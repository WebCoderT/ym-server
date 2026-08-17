/**
 * 应用程序附加配置模块
 *
 * 本模块负责在 NestJS 应用启动后注册 Swagger API 文档。
 * 通过遍历预定义的 Swagger 域配置，为不同角色（admin/client/public）生成独立的 API 文档站点，
 * 并为每个文档路径添加访问级别中间件保护，防止未授权用户查看敏感接口文档。
 *
 * @module configure-app
 */

// NestJS 应用接口，用于操作已创建的应用实例
import { INestApplication } from '@nestjs/common';
// Swagger 模块，用于生成和挂载 OpenAPI 文档
import { SwaggerModule } from '@nestjs/swagger';
// Swagger 文档构建配置、域配置列表及类型定义
import {
  buildSwaggerDocumentConfig,
  swaggerDomains,
  type SwaggerDomainConfig,
} from './config/swagger.config';
// 文档访问控制中间件工厂函数，用于限制对 Swagger 文档的访问权限
import { createDocsAccessMiddleware } from './docs-access.middleware';

/**
 * 注册单个 Swagger 文档站点
 *
 * 该函数为指定的域配置创建 Swagger 文档，并在指定路由上挂载文档 UI 和 JSON 端点。
 * 同时，为文档访问路径添加中间件，确保只有具备对应访问级别的用户才能查看。
 *
 * @param app - NestJS 应用实例
 * @param domain - Swagger 域配置对象，包含路由、标题、包含模块及所需访问级别
 */
function registerSwaggerDocument(app: INestApplication, domain: SwaggerDomainConfig) {
  // 根据域配置创建 Swagger 文档对象，仅包含该域指定的模块控制器
  const document = SwaggerModule.createDocument(
    app,
    buildSwaggerDocumentConfig(domain),
    // include 选项限制仅扫描指定模块中的控制器，避免文档混杂
    { include: domain.include },
  );

  // 计算 Swagger JSON 文件的访问路径，格式为 "{route}-json"
  const jsonPath = `${domain.route}-json`;

  // 为 Swagger UI 路由添加访问控制中间件
  app.use(`/${domain.route}`, createDocsAccessMiddleware(domain.requiredLevel));
  // 为 Swagger JSON 端点添加访问控制中间件
  app.use(`/${jsonPath}`, createDocsAccessMiddleware(domain.requiredLevel));

  // 在指定路由上挂载 Swagger UI，并配置 JSON 文档地址和持久化授权选项
  SwaggerModule.setup(domain.route, app, document, {
    // 指定 JSON 文档的公开访问地址
    jsonDocumentUrl: jsonPath,
    // Swagger UI 选项：刷新页面后保持已输入的授权信息，提升开发体验
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

/**
 * 配置 NestJS 应用程序
 *
 * 该函数在应用启动后被调用，遍历所有预定义的 Swagger 域配置，
 * 依次为每个域注册独立的 Swagger 文档站点，实现按角色隔离的 API 文档访问。
 *
 * @param app - NestJS 应用实例
 */
export function configureApplication(app: INestApplication) {
  console.log('正在注册 Swagger 文档...');
  // 遍历所有 Swagger 域配置，逐一注册文档站点
  swaggerDomains.forEach((domain) => {
    registerSwaggerDocument(app, domain);
    // 打印日志，提示已注册的 Swagger 文档路由和所需访问级别
    console.log(
      `已注册 Swagger 文档：${domain.name}，路由：/${domain.route}，所需访问级别：${domain.requiredLevel}`,
    );
  });
}
