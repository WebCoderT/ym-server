import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditEventType } from '../enums/audit-event-type.enum';
import { AuditEventResult } from '../enums/audit-event-result.enum';

// Re-export enums for backward compatibility
export { AuditEventType } from '../enums/audit-event-type.enum';
export { AuditEventResult } from '../enums/audit-event-result.enum';

/**
 * 安全审计日志实体
 * 对应数据库 security_audit_log 表，记录用户的安全相关操作日志
 */
@Entity('security_audit_log')
@Index('IDX_audit_user_event_time', ['userId', 'eventType', 'createdAt'])
export class SecurityAuditLogEntity {
  /** 日志记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 关联的用户ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 事件类型，如登录、注销、修改密码等 */
  @Column({ type: 'varchar', length: 64, name: 'event_type' })
  eventType!: AuditEventType;

  /** 事件结果：1-成功，0-失败，默认成功 */
  @Column({
    type: 'tinyint',
    default: AuditEventResult.SUCCESS,
    name: 'event_result',
  })
  eventResult!: AuditEventResult;

  /** 操作 IP 地址，可能为空 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  /** 关联设备标识，可能为空 */
  @Column({ type: 'varchar', length: 64, name: 'device_id', nullable: true })
  deviceId!: string | null;

  /** 事件详情，以 JSON 格式存储额外信息 */
  @Column({ type: 'json', nullable: true })
  detail!: Record<string, unknown> | null;

  /** 日志创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
