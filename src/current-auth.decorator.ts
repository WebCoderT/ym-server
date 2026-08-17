/**
 * 当前认证信息装饰器模块
 *
 * 本模块提供自定义参数装饰器 `@CurrentAuth()`，用于在控制器方法中直接注入当前请求的认证载荷。
 * 该装饰器基于 NestJS 的 createParamDecorator 实现，自动从 HTTP 请求的 Authorization 头中解析 JWT 令牌，
 * 并将解析后的 AuthTokenPayload 对象作为参数传递给控制器方法，避免在每个接口中重复编写令牌解析逻辑。
 *
 * @module current-auth.decorator
 */

// NestJS 参数装饰器工厂与执行上下文类型
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// Express 请求类型，提供类型安全的请求对象
import { Request } from 'express';
// 从请求中解析认证载荷的工具函数
import { resolveAuthPayloadFromRequest } from './auth-token';

/**
 * 当前认证信息参数装饰器
 *
 * 使用方式：在控制器方法的参数前添加 `@CurrentAuth()`，即可获取当前登录用户的认证载荷。
 * 示例：
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentAuth() auth: AuthTokenPayload) {
 *   return this.userService.findById(auth.sub);
 * }
 * ```
 *
 * 该装饰器内部通过 ExecutionContext 获取当前 HTTP 请求对象，
 * 并调用 resolveAuthPayloadFromRequest 完成令牌提取与校验。
 */
export const CurrentAuth = createParamDecorator(
  /**
   * 参数装饰器的工厂函数
   *
   * @param _data - 装饰器传入的数据（本装饰器无需使用，以下划线标记为未使用）
   * @param context - NestJS 执行上下文，包含当前请求、响应和处理器信息
   * @returns 解析后的认证载荷对象（AuthTokenPayload）
   */
  (_data: unknown, context: ExecutionContext) => {
    // 从执行上下文中切换到 HTTP 层，并获取类型化的 Express Request 对象
    const request = context.switchToHttp().getRequest<Request>();

    // 调用工具函数从请求头中提取 Bearer 令牌并校验，返回完整的认证载荷
    return resolveAuthPayloadFromRequest(request);
  },
);

/**
 * 可选认证信息参数装饰器
 *
 * 与 CurrentAuth 类似，但当请求未携带令牌或令牌无效时返回 null 而不是抛出异常。
 * 适用于公开接口中需要识别已登录用户身份的场景。
 */
export const OptionalAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    try {
      return resolveAuthPayloadFromRequest(request);
    } catch {
      return null;
    }
  },
);
