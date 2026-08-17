/**
 * 访问级别守卫模块
 *
 * 本模块实现全局守卫 AccessLevelGuard，用于在请求到达控制器方法前校验访问权限。
 * 守卫通过 Reflector 读取目标路由所需的 AccessLevel 元数据，并与请求 JWT 令牌中的角色进行比对，
 * 若角色不匹配或元数据缺失，则抛出 ForbiddenException 阻止请求继续执行。
 *
 * @module access-level.guard
 */

// NestJS 核心接口与异常类
import {
  CanActivate, // 守卫必须实现的接口，定义 canActivate 方法
  ExecutionContext, // 执行上下文，包含当前请求、处理器和类信息
  ForbiddenException, // 403 禁止访问异常
  Injectable, // 标记该类可由 NestJS 依赖注入容器管理
} from '@nestjs/common';
// NestJS 反射器，用于读取类或方法上的自定义元数据
import { Reflector } from '@nestjs/core';

// 访问级别装饰器中定义的元数据键名常量
import { ACCESS_LEVEL_KEY } from './access-level.decorator';
// 访问级别枚举，定义 ADMIN / CLIENT / PUBLIC 三种角色
import { AccessLevel } from './access-level.enum';
// 认证相关错误消息常量对象
import { AUTH_MESSAGES } from './auth.messages';
// 从请求中解析访问级别的工具函数
import { resolveAccessLevelFromRequest } from './auth-token';

/**
 * 访问级别守卫类
 *
 * 该守卫作为全局 APP_GUARD 注册，所有进入应用的请求都会先经过此守卫的校验。
 * 校验逻辑如下：
 * 1. 通过 Reflector 获取目标处理器或控制器类上的 ACCESS_LEVEL_KEY 元数据
 * 2. 若元数据不存在，说明路由未配置访问级别，抛出异常
 * 3. 若所需级别为 PUBLIC，直接放行
 * 4. 从请求的 Authorization 头中解析 JWT 令牌，提取角色信息
 * 5. 将令牌角色与所需角色比对，不一致则抛出 403 异常
 */
@Injectable()
export class AccessLevelGuard implements CanActivate {
  /**
   * 构造函数，注入 Reflector 实例
   *
   * @param reflector - NestJS 反射器，用于读取元数据
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * 判断当前请求是否具备访问目标资源的权限
   *
   * @param context - 执行上下文，包含当前 HTTP 请求、处理器和控制器类
   * @returns true 表示允许访问；若抛出异常则表示拒绝访问
   * @throws ForbiddenException 当访问级别元数据缺失或角色不匹配时抛出
   */
  canActivate(context: ExecutionContext): boolean {
    // 从当前处理器方法和控制器类上读取 ACCESS_LEVEL_KEY 元数据
    // getAllAndOverride 会优先返回方法级别的元数据，若不存在则回退到类级别
    const requiredLevel = this.reflector.getAllAndOverride<AccessLevel>(ACCESS_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 若未找到访问级别元数据，说明开发者忘记在路由上添加 @RequireAccessLevel 装饰器
    // 出于安全考虑，拒绝访问并提示配置缺失
    if (!requiredLevel) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCESS_LEVEL_METADATA_MISSING);
    }

    // 若目标接口声明为 PUBLIC 级别，表示无需鉴权，直接放行
    if (requiredLevel === AccessLevel.PUBLIC) {
      return true;
    }

    // 从执行上下文中获取当前 HTTP 请求对象
    const request = context.switchToHttp().getRequest();

    // 从请求的 Authorization 头中解析 JWT 令牌，并提取其中的角色字段
    const requestLevel = resolveAccessLevelFromRequest(request);

    // 比对请求令牌中的角色与接口所需的角色，若不一致则拒绝访问
    if (requestLevel !== requiredLevel) {
      throw new ForbiddenException(
        // 生成包含实际角色和期望角色的错误提示信息
        AUTH_MESSAGES.ACCESS_LEVEL_MISMATCH(requestLevel, requiredLevel),
      );
    }

    // 角色校验通过，允许请求继续执行
    return true;
  }
}
