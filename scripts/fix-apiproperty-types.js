#!/usr/bin/env node
/**
 * fix-apiproperty-types.js
 *
 * 自动为所有 DTO 文件中缺失 type 的 @ApiProperty / @ApiPropertyOptional 补充类型。
 *
 * 原理：
 *   扫描 @ApiProperty({...}) 或 @ApiPropertyOptional({...}) 装饰器，
 *   如果其中没有 type:/enum:/isArray:/type: [xxx]，
 *   则查看紧接着的字段声明的 TypeScript 类型，自动推断并注入 type:。
 *
 * 类型映射：
 *   string / string | null      → type: String
 *   number / number | null      → type: Number
 *   boolean / boolean | null    → type: Boolean
 *   string[] / string[] | null  → type: [String]
 *   SomeClass / SomeClass | null → type: SomeClass
 *   SomeClass[] / SomeClass[] | null → type: [SomeClass]
 *
 * 跳过条件：
 *   - 已有 type:/enum:/[String]/isArray 的装饰器
 *   - 内联对象类型 { ... }（跳过，需手动处理）
 *   - 装饰器后跟的不是字段声明
 */

const fs = require('fs');
const path = require('path');

// 递归收集所有 dto.ts 文件
function findDtoFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findDtoFiles(full));
    } else if (entry.name.endsWith('.dto.ts')) {
      results.push(full);
    }
  }
  return results;
}

// 根据 TS 类型字符串推断 Swagger type
function inferSwaggerType(tsType) {
  const t = tsType.trim();

  // 内联对象类型 → 跳过
  if (t.startsWith('{')) return null;

  // 联合类型：X | null / X | undefined / X | null | undefined
  const coreType = t
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s !== 'null' && s !== 'undefined')
    .join(' | ')
    .trim();

  // 数组：Type[] 或 Array<Type>
  let isArray = false;
  let innerType = coreType;

  if (coreType.endsWith('[]')) {
    isArray = true;
    innerType = coreType.slice(0, -2).trim();
  } else if (coreType.startsWith('Array<') && coreType.endsWith('>')) {
    isArray = true;
    innerType = coreType.slice(6, -1).trim();
  }

  // 基础类型映射
  const primitiveMap = {
    string: 'String',
    number: 'Number',
    boolean: 'Boolean',
  };

  if (primitiveMap[innerType]) {
    return isArray ? `[${primitiveMap[innerType]}]` : primitiveMap[innerType];
  }

  // 类类型（首字母大写 → 假定是类）
  if (/^[A-Z]/.test(innerType)) {
    return isArray ? `[${innerType}]` : innerType;
  }

  return null;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fixCount = 0;

  // 匹配 @ApiProperty(...) 或 @ApiPropertyOptional(...) 装饰器
  // 需要处理多行的情况
  const decoratorRegex =
    /@(ApiProperty(?:Optional)?)\(([^)]*)\)\s*\n(\s+)(\w+)([?!]?):\s*([^\n;]+)/g;

  content = content.replace(decoratorRegex, (match, decoratorName, argsRaw, indent, fieldName, optionalMark, tsType) => {
    // argsRaw 包含装饰器 () 内全部内容，可能带外层花括号
    // 例如: ""  |  "{ example: false }"  |  "type: String, example: 'x'"
    let argsInner = argsRaw.trim();

    // 如果包裹在 { } 内，剥掉外层花括号
    if (argsInner.startsWith('{') && argsInner.endsWith('}')) {
      argsInner = argsInner.slice(1, -1).trim();
    }

    // 已有 type:/enum:/[String]/isArray 的 → 跳过
    if (/\btype\s*:/.test(argsInner)) return match;
    if (/\benum\s*:/.test(argsInner)) return match;
    if (/\bisArray\s*:/.test(argsInner)) return match;
    if (argsInner.includes('[String]')) return match;

    // 推断类型
    const swaggerType = inferSwaggerType(tsType);
    if (!swaggerType) return match;

    // 构建新的参数
    let newArgs;
    if (argsInner === '') {
      newArgs = `type: ${swaggerType}`;
    } else {
      newArgs = `type: ${swaggerType}, ${argsInner}`;
    }

    fixCount++;
    return `@${decoratorName}({ ${newArgs} })\n${indent}${fieldName}${optionalMark}: ${tsType}`;
  });

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return fixCount;
}

// 主流程
const serverRoot = path.resolve(__dirname, '../src');
const dtoFiles = findDtoFiles(serverRoot);

let totalFixes = 0;
let filesChanged = 0;

for (const file of dtoFiles) {
  const fixes = processFile(file);
  if (fixes > 0) {
    const rel = path.relative(path.resolve(__dirname, '..'), file);
    console.log(`  ✓ ${rel}: ${fixes} 个字段补充 type`);
    totalFixes += fixes;
    filesChanged++;
  }
}

console.log(`\n共修改 ${filesChanged} 个文件，补充 ${totalFixes} 个 type 声明`);
