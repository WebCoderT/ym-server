/**
 * 领域事件定义
 *
 * 定义系统中所有的领域事件常量与载荷类型。
 * 核心模块在关键业务节点发布这些事件，插件通过 @OnEvent() 监听并处理。
 * 事件载荷的设计遵循"最小必要信息"原则，仅包含监听器所需的数据。
 *
 * @module domain-events
 */

// ═══════════════════════════════════════════════
// 用户注册事件
// ═══════════════════════════════════════════════

/** 用户注册完成事件名称 */
export const USER_REGISTERED = 'user.registered';

/** 用户注册事件载荷 */
export interface UserRegisteredPayload {
  /** 用户唯一标识 */
  userId: string;
  /** 微信 openid（若通过微信注册） */
  openid?: string;
  /** 手机号（若通过手机号注册） */
  phone?: string;
  /** 注册时的设备标识 */
  deviceId?: string;
  /** 注册时的设备名称 */
  deviceName?: string;
}

// ═══════════════════════════════════════════════
// 用户登录事件
// ═══════════════════════════════════════════════

/** 用户登录成功事件名称 */
export const USER_LOGGED_IN = 'user.loggedIn';

/** 用户登录事件载荷 */
export interface UserLoggedInPayload {
  /** 用户唯一标识 */
  userId: string;
  /** 登录时的设备标识 */
  deviceId?: string;
  /** 登录时的设备名称 */
  deviceName?: string;
  /** 登录时的 IP 地址 */
  loginIp?: string | null;
  /** 登录时的城市 */
  loginCity?: string | null;
}
