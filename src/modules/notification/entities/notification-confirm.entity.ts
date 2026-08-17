import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 通知确认记录实体
 * 对应数据库 notification_confirms 表，记录哪些用户已确认过哪些通知
 * 每个 (notificationId, userId) 组合唯一，确保同一用户对同一通知只确认一次
 */
@Entity('notification_confirms')
@Index('IDX_notification_confirm_unique', ['notificationId', 'userId'], { unique: true })
export class NotificationConfirmEntity {
  /** 唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 关联通知 ID */
  @Column({ type: 'varchar', length: 64, name: 'notification_id' })
  notificationId!: string;

  /** 关联用户 ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 确认时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
