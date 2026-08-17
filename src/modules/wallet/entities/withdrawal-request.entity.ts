import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WithdrawalStatus } from '../enums/wallet.enum';

// 重新导出枚举，保持外部 import 路径兼容
export { WithdrawalStatus };

/**
 * 提现申请实体
 * 对应数据库 withdrawal_requests 表，记录用户的提现申请
 */
@Entity('withdrawal_requests')
@Index('IDX_withdrawal_user', ['userId'])
@Index('IDX_withdrawal_status', ['status'])
@Index('IDX_withdrawal_created', ['createdAt'])
export class WithdrawalRequestEntity {
  /** 申请唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 申请用户 ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 提现金额，decimal(10,2) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  /** 申请状态 */
  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status!: WithdrawalStatus;

  /** 目标微信 OpenID（提现到此微信账号） */
  @Column({ type: 'varchar', length: 64, name: 'wx_open_id' })
  wxOpenId!: string;

  /** 驳回原因（仅驳回时填写） */
  @Column({ type: 'varchar', length: 256, nullable: true, name: 'reject_reason' })
  rejectReason!: string | null;

  /** 审核人 ID（管理员 ID） */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'processed_by' })
  processedBy!: string | null;

  /** 审核时间 */
  @Column({ type: 'datetime', nullable: true, name: 'processed_at' })
  processedAt!: Date | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
