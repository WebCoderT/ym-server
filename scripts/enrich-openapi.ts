/**
 * OpenAPI 枚举增强脚本
 * 将枚举注册表中的枚举注入为独立 schema，并将 DTO 属性中的内联 enum 替换为 $ref 引用。
 * 这样 openapi-generator 会生成干净的枚举类型（如 OrderStatus），而非冗长的 DTO 内联枚举。
 */

import type { OpenAPIObject } from '@nestjs/swagger';
import { enumRegistry } from './enum-registry';

export function enrichWithStandaloneEnums(spec: OpenAPIObject): void {
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};

  // 1. 添加独立枚举 schema
  for (const def of enumRegistry) {
    spec.components.schemas[def.name] = {
      type: def.type,
      enum: [...def.values],
    };
  }

  // 2. 将 DTO 属性中的内联 enum 替换为 $ref
  //    当多个枚举值完全相同时（如 StarStatus 和 BannerStatus 都是 ['active','inactive']），
  //    优先选择名称与 schema 名称匹配的枚举。
  for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
    const props = (schema as any).properties;
    if (!props) continue;
    for (const prop of Object.values(props) as any[]) {
      if (!prop.enum) continue;
      // 找出所有值匹配的候选枚举
      const candidates = enumRegistry.filter(
        (d) =>
          d.type === prop.type &&
          d.values.length === prop.enum.length &&
          d.values.every((v, i) => v === prop.enum[i]),
      );
      if (candidates.length === 0) continue;
      // 优先选择名称前缀与 schema 名称匹配的候选
      let match = candidates[0];
      if (candidates.length > 1) {
        const contextMatch = candidates.find((c) => {
          // 提取枚举名称前缀（如 BannerStatus -> Banner, TaskStatus -> Task）
          const prefix = c.name.replace(/Status$|Type$|Rarity$|Result$|Level$/, '');
          return schemaName.startsWith(prefix) || schemaName.includes(prefix);
        });
        if (contextMatch) match = contextMatch;
      }
      // 保留 example
      const example = prop.example;
      delete prop.type;
      delete prop.enum;
      prop.$ref = `#/components/schemas/${match.name}`;
      if (example !== undefined) prop.example = example;
    }
  }
}
