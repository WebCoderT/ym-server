import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 支付回调处理状态枚举
 */
export enum PaymentNotifyStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理成功 */
  SUCCESS = 'success',
  /** 处理失败 */
  FAILED = 'failed',
  /** 已忽略（重复回调等） */
  IGNORED = 'ignored',
}

/**
 * 支付回调记录实体
 * 记录每一次支付回调通知的详细信息，便于排查问题和审计
 */
@Entity('payment_notifies')
@Index('IDX_payment_notify_biz', ['bizType', 'bizNo'])
@Index('IDX_payment_notify_status', ['status'])
@Index('IDX_payment_notify_provider', ['provider'])
export class PaymentNotifyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 关联的支付流水 ID（可能为空，因为回调可能在流水创建前到达） */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'transaction_id' })
  transactionId!: string | null;

  /** 支付方式（wechat/alipay） */
  @Column({ type: 'varchar', length: 32, name: 'payment_method_code' })
  paymentMethodCode!: string;

  /** 支付来源（wechat/alipay） */
  @Column({ type: 'varchar', length: 32 })
  provider!: string;

  /** 业务类型（order/recharge） */
  @Column({ type: 'varchar', length: 32, name: 'biz_type' })
  bizType!: string;

  /** 业务单号 */
  @Column({ type: 'varchar', length: 64, name: 'biz_no' })
  bizNo!: string;

  /** 原始请求头（JSON 格式，用于签名验证排查） */
  @Column({ type: 'json', nullable: true, name: 'raw_headers' })
  rawHeaders!: Record<string, any> | null;

  /** 原始请求体（文本格式，用于验签和排查） */
  @Column({ type: 'text', name: 'raw_body' })
  rawBody!: string;

  /** 解密后的回调数据（JSON 格式） */
  @Column({ type: 'json', nullable: true, name: 'decrypted_data' })
  decryptedData!: Record<string, any> | null;

  /** 处理状态 */
  @Column({
    type: 'enum',
    enum: PaymentNotifyStatus,
    default: PaymentNotifyStatus.PENDING,
  })
  status!: PaymentNotifyStatus;

  /** 处理结果描述 */
  @Column({ type: 'varchar', length: 256, nullable: true, name: 'result_message' })
  resultMessage!: string | null;

  /** 重试次数 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'retry_count' })
  retryCount!: number;

  /** 处理时间 */
  @Column({ type: 'datetime', nullable: true, name: 'processed_at' })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
