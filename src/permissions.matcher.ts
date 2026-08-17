/**
 * 权限匹配工具模块
 *
 * 提供权限字符串的匹配逻辑，支持：
 * - 精确匹配：`staff:ticket:verify` 匹配 `staff:ticket:verify`
 * - 模块通配：`client:*` 匹配任何 `client:` 前缀的权限
 * - 全局通配：`*` 匹配任何权限
 *
 * @module permissions.matcher
 */

import { PERMISSION_WILDCARD_ALL } from './permission.enum';

/**
 * 判断单条用户权限是否满足所需权限
 *
 * 匹配规则（优先级从高到低）：
 * 1. 全局通配 `*`：直接通过
 * 2. 精确匹配：字符串相等
 * 3. 模块通配 `xxx:*`：所需权限以 `xxx:` 开头
 *
 * @param userPermission - 用户持有的单条权限（可能含通配符）
 * @param required - 所需权限（精确值，不含通配符）
 * @returns 是否匹配
 */
export function matchSinglePermission(userPermission: string, required: string): boolean {
  // 全局通配
  if (userPermission === PERMISSION_WILDCARD_ALL) return true;

  // 精确匹配
  if (userPermission === required) return true;

  // 模块通配：`xxx:*` 匹配 `xxx:yyy` 形式
  if (userPermission.endsWith(':*')) {
    const prefix = userPermission.slice(0, -1); // 去掉 `*`，保留 `xxx:`
    return required.startsWith(prefix);
  }

  return false;
}

/**
 * 判断用户权限列表是否满足所需权限
 *
 * @param userPermissions - 用户持有的权限列表
 * @param required - 所需权限
 * @returns 是否满足
 */
export function matchPermission(userPermissions: string[], required: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.some((p) => matchSinglePermission(p, required));
}

/**
 * 合并多组权限列表并去重
 *
 * @param permissionLists - 多个权限列表
 * @returns 去重后的权限列表
 */
export function mergePermissions(...permissionLists: string[][]): string[] {
  const set = new Set<string>();
  for (const list of permissionLists) {
    for (const p of list) set.add(p);
  }
  return [...set];
}
