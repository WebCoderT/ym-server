/**
 * 活跃账户守卫模块
 *
 * 本模块在 UserStatusGuard 之后执行，专门用于校验被标记为
 * @RequireActiveAccount() 的路由是否允许冻结用户访问。
 *
 * UserStatusGuard 仅拦截禁用（BANNED）用户，冻结（FREEZED）用户可以通过。
 * 本守卫在此基础上进一步拦截冻结用户对资金相关接口的访问。
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ACTIVE_ACCOUNT_KEY } from './active-account.decorator';
import { resolveAuthPayloadFromRequest } from './auth-token';
import { UserEntity, UserStatus } from './modules/user/entities/user.entity';

/** 冻结用户访问资金接口时的错误消息（不包含"请联系客服"，不触发客户端强制登出） */
const ACCOUNT_FROZEN_OPERATION_MESSAGE = '账号已冻结，暂时无法进行此操作';

/**
 * 活跃账户守卫
 *
 * 作为全局 APP_GUARD 注册，在 UserStatusGuard 之后、PermissionGuard 之前执行。
 * 仅对标注了 @RequireActiveAccount() 的路由生效。
 */
@Injectable()
export class ActiveAccountGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 仅对标注了 @RequireActiveAccount() 的路由生效
    const requireActive = this.reflector.getAllAndOverride<boolean>(ACTIVE_ACCOUNT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireActive) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 解析 JWT 获取用户标识
    let payload;
    try {
      payload = resolveAuthPayloadFromRequest(request);
    } catch {
      // 令牌解析失败交由其他守卫处理，此处放行
      return true;
    }

    // 查询用户状态
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'status'],
    });

    // 冻结用户不允许执行资金操作
    if (user && user.status === UserStatus.FREEZED) {
      throw new ForbiddenException(ACCOUNT_FROZEN_OPERATION_MESSAGE);
    }

    return true;
  }
}
