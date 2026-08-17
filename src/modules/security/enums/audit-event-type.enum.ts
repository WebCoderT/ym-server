/**
 * 审计事件类型枚举
 * 定义系统支持的安全审计事件种类
 */
export enum AuditEventType {
  /** 登录事件 */
  LOGIN = 'login',
  /** 登出事件 */
  LOGOUT = 'logout',
  /** 修改密码事件 */
  PASSWORD_CHANGE = 'password_change',
  /** 隐私设置更新事件 */
  PRIVACY_UPDATE = 'privacy_update',
  /** 设备注销事件 */
  DEVICE_LOGOUT = 'device_logout',
  /** 敏感操作事件 */
  SENSITIVE_OPERATION = 'sensitive_operation',
}
