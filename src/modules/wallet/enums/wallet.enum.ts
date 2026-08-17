/**
 * 钱包模块枚举
 * 集中管理钱包、余额变动、提现、充值相关的所有枚举定义
 */

/**
 * 余额变动类型枚举
 * 定义余额变动的来源类型
 */
export enum BalanceTransactionType {
  /** 充值 */
  DEPOSIT = 'deposit',
  /** 消费 */
  CONSUME = 'consume',
  /** 退款 */
  REFUND = 'refund',
  /** 管理员调整 */
  ADMIN_ADJUST = 'admin_adjust',
  /** 提现扣款 */
  WITHDRAWAL = 'withdrawal',
  /** 提现驳回退款 */
  WITHDRAWAL_REFUND = 'withdrawal_refund',
}

/**
 * 余额变动方向枚举
 */
export enum BalanceTransactionDirection {
  /** 收入（余额增加） */
  IN = 'in',
  /** 支出（余额减少） */
  OUT = 'out',
}

/**
 * 提现申请状态枚举
 */
export enum WithdrawalStatus {
  /** 待审核 */
  PENDING = 'pending',
  /** 审核通过（已完成打款） */
  APPROVED = 'approved',
  /** 审核驳回 */
  REJECTED = 'rejected',
}

/**
 * 充值订单状态枚举
 */
export enum RechargeStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 支付成功 */
  PAID = 'paid',
  /** 已取消 */
  CANCELLED = 'cancelled',
}
