/**
 * 文档访问控制中间件模块
 *
 * 本模块提供 Swagger API 文档的访问控制中间件工厂函数。
 * 由于 Swagger UI 和 JSON 文档端点不属于 NestJS 控制器路由，无法直接使用 @RequireAccessLevel 装饰器进行保护，
 * 因此通过 Express 中间件在文档路由层面进行访问级别校验，确保只有具备对应角色的用户才能查看敏感接口文档。
 *
 * @module docs-access.middleware
 */

// Express 核心类型：请求对象、响应对象和下一个中间件函数
import { NextFunction, Request, Response } from 'express';
// 访问级别枚举，定义系统支持的角色类型
import { AccessLevel } from './access-level.enum';
// 从请求中解析访问级别的工具函数
import { resolveAccessLevelFromRequest } from './auth-token';

/**
 * 创建文档访问控制中间件
 *
 * 该工厂函数根据所需的访问级别生成一个 Express 中间件函数，
 * 用于挂载在 Swagger 文档路由上，限制未授权用户的访问。
 *
 * 校验逻辑：
 * 1. 若所需级别为 PUBLIC，直接放行，任何人均可访问
 * 2. 尝试从请求的 Authorization 头中解析 JWT 令牌并提取角色
 * 3. 若解析失败（令牌缺失或无效），返回 403 错误响应
 * 4. 若令牌角色与所需级别不一致，返回 403 错误响应
 * 5. 校验通过，调用 next() 将请求传递给下一个中间件或 Swagger 处理程序
 *
 * @param requiredLevel - 访问该文档所需的最低访问级别
 * @returns Express 中间件函数 (request, response, next) => void
 */
export function createDocsAccessMiddleware(requiredLevel: AccessLevel) {
  // 返回中间件函数，该函数将被挂载到 Swagger 路由上
  return (request: Request, response: Response, next: NextFunction) => {
    // 若文档配置为公开访问，无需任何鉴权，直接放行
    if (requiredLevel === AccessLevel.PUBLIC) {
      next();
      return;
    }

    // 声明请求级别变量，用于存储从令牌中解析出的角色
    let requestLevel: AccessLevel;

    try {
      // 尝试从请求的 Authorization 头中提取并校验 JWT 令牌，获取角色信息
      requestLevel = resolveAccessLevelFromRequest(request);
    } catch (error) {
      // 若令牌解析失败（缺失、过期、格式错误等），构造错误消息并返回 403
      const message =
        error instanceof Error
          ? // 若捕获到 Error 实例，使用其消息内容（保留原始英文提示）
            error.message.replace('Authorization', 'Authorization')
          : // 若捕获到非 Error 对象，使用默认的英文提示信息
            `Authorization bearer token is required to access ${requiredLevel} docs`;

      // 返回 JSON 格式的 403 错误响应，与 NestJS 全局异常格式保持一致
      response.status(403).json({
        // HTTP 状态码
        statusCode: 403,
        // 错误描述消息
        message,
        // 错误类型标识
        error: 'Forbidden',
      });
      return;
    }

    // 校验请求令牌中的角色是否与文档所需的访问级别一致
    if (requestLevel !== requiredLevel) {
      // 角色不匹配，返回 403 错误响应
      response.status(403).json({
        // HTTP 状态码
        statusCode: 403,
        // 描述角色不匹配的具体原因
        message: `role ${requestLevel} cannot access ${requiredLevel} docs`,
        // 错误类型标识
        error: 'Forbidden',
      });
      return;
    }

    // 所有校验通过，将请求传递给 Swagger 文档处理程序
    next();
  };
}
