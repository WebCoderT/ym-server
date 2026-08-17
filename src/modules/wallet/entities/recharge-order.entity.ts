import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RechargeStatus } from '../enums/wallet.enum';

// 重新导出枚举，保持外部 import 路径兼容
export { RechargeStatus };

/**
 * 充值订单实体
 * 对应数据库 recharge_orders 表，记录用户充值订单
 */
@Entity('recharge_orders')
@Index('IDX_recharge_user', ['userId'])
@Index('IDX_recharge_status', ['status'])
export class RechargeOrderEntity {
  /** 充值订单唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户 ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 充值金额，decimal(10,2) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  /** 支付方式编码（如 wechat、balance 等） */
  @Column({ type: 'varchar', length: 64, name: 'payment_method_code' })
  paymentMethodCode!: string;

  /** 充值订单状态 */
  @Column({ type: 'enum', enum: RechargeStatus, default: RechargeStatus.PENDING })
  status!: RechargeStatus;

  /** 充值订单号（业务单号） */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'recharge_no' })
  rechargeNo!: string;

  /** 第三方支付交易号（微信支付回调返回的 transaction_id） */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'transaction_id' })
  transactionId!: string | null;

  /** 支付时间 */
  @Column({ type: 'datetime', nullable: true, name: 'paid_at' })
  paidAt!: Date | null;

  /** 过期时间（待支付订单超时自动取消） */
  @Column({ type: 'datetime', nullable: true, name: 'expire_at' })
  expireAt!: Date | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
