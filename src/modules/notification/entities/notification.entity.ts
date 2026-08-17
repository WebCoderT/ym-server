import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationTargetPage } from '../enums/notification-target-page.enum';

// Re-export enums for backward compatibility
export { NotificationTargetPage } from '../enums/notification-target-page.enum';

/**
 * 通知实体
 * 对应数据库 notifications 表，存储管理端发布的文字通知
 */
@Entity('notifications')
export class NotificationEntity {
  /** 唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 通知内容（纯文本） */
  @Column({ type: 'text' })
  content!: string;

  /** 目标页面：通知在哪个根页面弹出 */
  @Column({
    type: 'enum',
    enum: NotificationTargetPage,
    name: 'target_page',
  })
  targetPage!: NotificationTargetPage;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
