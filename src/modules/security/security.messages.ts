/**
 * 安全模块消息常量
 * 集中管理安全相关模块的提示与错误信息
 */
export const SECURITY_MESSAGES = {
  /** 设备不存在时的提示信息，接收设备ID作为参数 */
  DEVICE_NOT_FOUND: (deviceId: string) => `设备 ${deviceId} 不存在`,
  /** 尝试注销当前设备时的错误提示 */
  CANNOT_LOGOUT_CURRENT_DEVICE: '无法注销当前登录设备',
} as const;
