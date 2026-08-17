import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentTransactionStatus } from '../enums/payment-transaction-status.enum';
import { PaymentBizType } from '../enums/payment-biz-type.enum';

// Re-export enums for backward compatibility
export { PaymentTransactionStatus } from '../enums/payment-transaction-status.enum';
export { PaymentBizType } from '../enums/payment-biz-type.enum';

/**
 * 支付流水实体
 * 记录每一笔支付交易的详细信息
 */
@Entity('payment_transactions')
@Index('IDX_payment_transaction_user', ['userId'])
@Index('IDX_payment_transaction_biz', ['bizType', 'bizNo'])
@Index('IDX_payment_transaction_status', ['status'])
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 业务流水号（系统生成，唯一） */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'transaction_no' })
  transactionNo!: string;

  /** 第三方支付交易号（微信/支付宝返回的，如微信的 transaction_id） */
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    name: 'third_party_transaction_id',
  })
  thirdPartyTransactionId!: string | null;

  /** 支付方式（wechat/alipay/balance） */
  @Column({ type: 'varchar', length: 32, name: 'payment_method_code' })
  paymentMethodCode!: string;

  /** 业务类型（order/recharge） */
  @Column({ type: 'enum', enum: PaymentBizType, name: 'biz_type' })
  bizType!: PaymentBizType;

  /** 业务单号（订单号/充值单号） */
  @Column({ type: 'varchar', length: 64, name: 'biz_no' })
  bizNo!: string;

  /** 用户ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 交易金额（单位：分） */
  @Column({ type: 'int', unsigned: true })
  amount!: number;

  /** 支付状态 */
  @Column({ type: 'enum', enum: PaymentTransactionStatus, default: PaymentTransactionStatus.PENDING })
  status!: PaymentTransactionStatus;

  /** 交易标题/描述 */
  @Column({ type: 'varchar', length: 128 })
  title!: string;

  /** 扩展信息（JSON 格式，存储原始请求/响应数据等） */
  @Column({ type: 'json', nullable: true })
  extra!: Record<string, any> | null;

  /** 支付成功时间 */
  @Column({ type: 'datetime', nullable: true, name: 'paid_at' })
  paidAt!: Date | null;

  /** 支付失败时间 */
  @Column({ type: 'datetime', nullable: true, name: 'failed_at' })
  failedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
