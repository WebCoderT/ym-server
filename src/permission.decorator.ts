/**
 * 权限装饰器模块
 *
 * 提供 `@RequirePermission()` 装饰器，用于在控制器方法上声明所需的细粒度权限。
 * PermissionGuard 会在请求处理前读取此元数据，与请求令牌中的权限列表进行比对。
 *
 * 与 @RequireAccessLevel 的区别：
 * - AccessLevel 是粗粒度的身份分级（ADMIN/CLIENT/PUBLIC）
 * - Permission 是细粒度的功能授权（staff:ticket:verify）
 *
 * 两者可叠加使用：先通过 AccessLevel 校验身份，再通过 Permission 校验功能授权。
 *
 * @module permission.decorator
 */

import { SetMetadata } from '@nestjs/common';
import { Permission } from './permission.enum';

/**
 * 权限元数据的键名常量
 */
export const PERMISSION_KEY = 'permission';

/**
 * 权限要求装饰器
 *
 * 在控制器方法或类上声明所需的权限。可以指定单个权限或多个权限（任一满足即可）。
 *
 * @example
 * ```typescript
 * @RequirePermission(Permission.STAFF_TICKET_VERIFY)
 * async verifyTicket(...) {}
 *
 * @RequirePermission([Permission.ADMIN_STAR, Permission.ADMIN_EVENT])
 * async manageSomething(...) {}
 * ```
 *
 * @param permission - 所需权限，单个或数组（数组表示任一满足即可）
 */
export const RequirePermission = (permission: Permission | Permission[]) =>
  SetMetadata(PERMISSION_KEY, Array.isArray(permission) ? permission : [permission]);
