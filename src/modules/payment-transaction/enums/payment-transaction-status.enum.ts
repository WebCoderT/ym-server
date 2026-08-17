/**
 * 支付流水状态枚举
 */
export enum PaymentTransactionStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 支付成功 */
  SUCCESS = 'success',
  /** 支付失败 */
  FAILED = 'failed',
  /** 已关闭 */
  CLOSED = 'closed',
}
