/**
 * @fileoverview Swagger 文档配置模块
 * 负责定义和管理 API 文档的分域配置，包括管理员、客户端和公共接口的 Swagger 文档生成规则。
 */

import type { Type } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';
import { AccessLevel } from '../access-level.enum';
import { AdminModule } from '../admin/admin.module';
import { ClientModule } from '../client/client.module';
import { PublicModule } from '../public/public.module';
import { ImageModule } from '../modules/image/image.module';
import { StorageModule } from '../modules/storage/storage.module';
import { SystemConfigModule } from '../modules/system-config/system-config.module';
import { QuickNavModule } from '../modules/quick-nav/quick-nav.module';

/**
 * Swagger 分域配置接口
 * 定义每个 API 域（admin/client/public）的文档元数据与路由规则。
 */
export interface SwaggerDomainConfig {
  /** 域标识名称，用于区分不同的 API 文档分组 */
  name: 'admin' | 'client' | 'public';
  /** Swagger 文档的路由路径 */
  route: string;
  /** API 文档标题 */
  title: string;
  /** API 文档描述信息 */
  description: string;
  /** 访问该文档所需的最低权限等级 */
  requiredLevel: AccessLevel;
  /** 需要包含在 Swagger 文档中的 NestJS 模块数组 */
  include: Array<Type<unknown>>;
  /** 生成的 OpenAPI JSON 文件名称 */
  outputFile: 'admin-openapi.json' | 'client-openapi.json' | 'public-openapi.json';
}

/**
 * Swagger 分域配置数组
 * 包含管理员端、客户端和公共端三个域的配置信息。
 */
export const swaggerDomains: SwaggerDomainConfig[] = [
  {
    // 管理员域配置：用于后台管理系统接口文档
    name: 'admin',
    route: 'docs/admin',
    title: 'Admin API',
    description: 'Admin only operations and schemas.',
    requiredLevel: AccessLevel.ADMIN,
    include: [AdminModule, ImageModule, StorageModule, SystemConfigModule, QuickNavModule],
    outputFile: 'admin-openapi.json',
  },
  {
    // 客户端域配置：用于 C 端用户接口文档
    name: 'client',
    route: 'docs/client',
    title: 'Client API',
    description: 'Client only operations and schemas.',
    requiredLevel: AccessLevel.CLIENT,
    include: [ClientModule],
    outputFile: 'client-openapi.json',
  },
  {
    // 公共域配置：用于无需鉴权的公共接口文档
    name: 'public',
    route: 'docs/public',
    title: 'Public API',
    description: 'Public operations and schemas.',
    requiredLevel: AccessLevel.PUBLIC,
    include: [PublicModule, SystemConfigModule, QuickNavModule],
    outputFile: 'public-openapi.json',
  },
];

/**
 * 构建指定域的 Swagger 文档配置对象
 *
 * @param domain - Swagger 分域配置对象，包含标题、描述、名称等元数据
 * @returns 构建完成的 OpenAPI 文档信息对象（info 部分）
 *
 * @description
 * 该函数根据传入的域配置，使用 NestJS 的 DocumentBuilder 生成对应的 Swagger 文档信息。
 * 对于 admin 和 client 域，会自动添加 Bearer Token（JWT）鉴权配置，以便在文档中测试受保护接口。
 */
export function buildSwaggerDocumentConfig(
  domain: SwaggerDomainConfig,
): OpenAPIObject['info'] extends never ? never : ReturnType<DocumentBuilder['build']> {
  // 初始化 DocumentBuilder，设置文档标题、描述和版本号
  const builder = new DocumentBuilder()
    .setTitle(domain.title)
    .setDescription(domain.description)
    .setVersion('1.0.0');

  // 对于管理员端和客户端接口，添加 Bearer JWT 鉴权方式
  // 公共接口无需鉴权，因此不添加 Bearer 配置
  if (domain.name === 'admin' || domain.name === 'client') {
    builder.addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    );
  }

  // 构建并返回最终的 OpenAPI 文档配置对象
  return builder.build();
}
