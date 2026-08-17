import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BalanceTransactionType, BalanceTransactionDirection } from '../enums/wallet.enum';

// 重新导出枚举，保持外部 import 路径兼容
export { BalanceTransactionType, BalanceTransactionDirection };

/**
 * 余额变动记录实体
 * 对应数据库 balance_transactions 表，记录用户余额的每一笔变动
 */
@Entity('balance_transactions')
@Index('IDX_balance_tx_user', ['userId'])
@Index('IDX_balance_tx_user_created', ['userId', 'createdAt'])
export class BalanceTransactionEntity {
  /** 变动记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 变动类型：充值、消费、退款、管理员调整 */
  @Column({ type: 'enum', enum: BalanceTransactionType })
  type!: BalanceTransactionType;

  /** 变动方向：收入/支出 */
  @Column({ type: 'enum', enum: BalanceTransactionDirection })
  direction!: BalanceTransactionDirection;

  /** 变动金额（始终为正数），decimal(10,2) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  /** 变动后的余额余额，decimal(10,2) */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_after' })
  balanceAfter!: number;

  /** 变动前的余额余额，decimal(10,2) */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_before' })
  balanceBefore!: number;

  /** 变动描述/备注，可能为空 */
  @Column({ type: 'varchar', length: 256, nullable: true })
  description!: string | null;

  /** 关联订单ID，可能为空（如管理员调整没有关联订单） */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'order_id' })
  orderId!: string | null;

  /** 关联交易流水号，可能为空 */
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    name: 'transaction_no',
  })
  transactionNo!: string | null;

  /** 变动记录创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
