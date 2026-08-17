/**
 * 用户状态守卫模块
 *
 * 本模块在 AccessLevelGuard 之后执行，专门用于校验客户端用户账号是否被禁用。
 * 对于需要 CLIENT 权限的接口，从请求中解析 JWT 令牌获取用户 ID，
 * 查询数据库确认用户状态，若用户被禁用（BANNED）则阻止请求继续执行。
 * 冻结（FREEZED）用户不被此守卫拦截，其资金操作限制由 ActiveAccountGuard 负责。
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ACCESS_LEVEL_KEY } from './access-level.decorator';
import { AccessLevel } from './access-level.enum';
import { AUTH_MESSAGES } from './auth.messages';
import { resolveAuthPayloadFromRequest } from './auth-token';
import { UserEntity, UserStatus } from './modules/user/entities/user.entity';

/**
 * 用户状态守卫类
 *
 * 作为全局 APP_GUARD 注册，在 AccessLevelGuard 之后执行（通过 provider 注册顺序保证）。
 * 仅对 CLIENT 级别的接口进行用户状态校验，ADMIN 和 PUBLIC 接口直接放行。
 */
@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 判断当前请求的用户账号是否处于正常状态
   *
   * @param context - 执行上下文
   * @returns true 表示允许访问；若抛出异常则表示拒绝访问
   * @throws ForbiddenException 当用户被禁用时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLevel = this.reflector.getAllAndOverride<AccessLevel>(ACCESS_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 若接口未配置访问级别或不是 CLIENT 级别，直接放行
    if (!requiredLevel || requiredLevel !== AccessLevel.CLIENT) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 解析 JWT 令牌获取用户标识
    let payload;
    try {
      payload = resolveAuthPayloadFromRequest(request);
    } catch {
      // 令牌解析失败时交由 AccessLevelGuard 处理，此处直接放行
      return true;
    }

    // 查询用户状态
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'status'],
    });

    // 用户不存在或被禁用（BANNED），拒绝访问
    // 冻结（FREEZED）用户不在此处拦截，由 ActiveAccountGuard 处理
    if (!user || user.status === UserStatus.BANNED) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_BANNED);
    }

    return true;
  }
}
