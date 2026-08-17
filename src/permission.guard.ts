/**
 * 权限守卫模块
 *
 * 全局守卫 PermissionGuard，用于在请求到达控制器方法前校验细粒度权限。
 * 守卫通过 Reflector 读取目标路由所需的 Permission 元数据，
 * 并**每次请求**从数据库实时聚合用户的当前权限（不依赖 JWT 缓存），
 * 确保管理员对角色的权限修改能够立即生效。
 *
 * 校验逻辑：
 * 1. 若路由未声明 @RequirePermission，直接放行（向后兼容）
 * 2. 若请求身份为 ADMIN，直接放行（管理员拥有所有权限）
 * 3. 从数据库实时查询用户当前所有角色的权限并集
 * 4. 若任一所需权限被用户权限满足，放行
 * 5. 否则抛出 403 异常
 *
 * 性能说明：
 * - 每次请求触发 user_roles + roles 联表查询
 * - 已为 user_roles.user_id 与 user_roles.role_id 建立索引，查询开销可控
 * - 与 UserStatusGuard（同样每次请求查 DB 校验账号状态）采用相同模式
 * - 如未来性能瓶颈显现，可引入 Redis 缓存优化
 *
 * @module permission.guard
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessLevel } from './access-level.enum';
import { PERMISSION_KEY } from './permission.decorator';
import { Permission } from './permission.enum';
import { matchPermission } from './permissions.matcher';
import { resolveAuthPayloadFromRequest } from './auth-token';
import { RoleService } from './modules/role/role.service';

/**
 * 权限守卫
 * 每次请求实时从数据库聚合用户权限，确保管理员对角色的修改立即生效
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger('PermissionGuard');

  constructor(
    private readonly reflector: Reflector,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 读取目标处理器或类上的权限元数据
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 未声明权限装饰器 → 直接放行（向后兼容，不破坏现有接口）
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 解析 JWT 载荷（主要为了读取 role 字段，判断是否为 ADMIN）
    const payload = resolveAuthPayloadFromRequest(request);

    // ADMIN 身份直接放行（管理员拥有所有权限）
    if (payload.role === AccessLevel.ADMIN) {
      return true;
    }

    // 实时从数据库聚合用户权限（不依赖 JWT 缓存）
    let userPermissions: string[];
    try {
      userPermissions = await this.roleService.aggregateUserPermissions(payload.sub);
    } catch (err) {
      this.logger.warn(`聚合用户权限失败，回退到 JWT 缓存权限：${(err as Error).message}`);
      // 降级到 JWT 中的权限（确保 DB 故障时不彻底阻断业务）
      userPermissions = payload.permissions ?? [];
    }

    // 检查是否任一所需权限被满足
    const hasPermission = requiredPermissions.some((required) =>
      matchPermission(userPermissions, required),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`权限不足，需要以下权限之一：${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
