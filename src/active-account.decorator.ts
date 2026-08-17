/**
 * 活跃账户要求装饰器模块
 *
 * 标记需要账户处于活跃状态（非冻结）才能访问的路由。
 * 配合 ActiveAccountGuard 使用：当用户账户被冻结时，
 * 已标记的路由会拒绝访问，但未标记的路由仍可正常使用。
 *
 * 典型用法：资金相关接口（下单、支付、退款、打赏、抽卡等）。
 *
 * @module active-account.decorator
 */

import { SetMetadata } from '@nestjs/common';

/** 活跃账户要求的元数据 key */
export const ACTIVE_ACCOUNT_KEY = 'active-account';

/**
 * 要求当前用户账户处于活跃状态（非冻结）
 *
 * 冻结用户访问已标记的路由时将收到 403 响应。
 * 可与 @RequireAccessLevel、@RequirePermission 组合使用。
 */
export const RequireActiveAccount = () => SetMetadata(ACTIVE_ACCOUNT_KEY, true);
