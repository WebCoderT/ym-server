import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 用户登录设备实体
 * 对应数据库 user_login_device 表，记录用户的登录设备信息
 */
@Entity('user_login_device')
@Index('IDX_device_user_login', ['userId', 'lastLoginAt'])
export class UserLoginDeviceEntity {
  /** 设备记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 关联的用户ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 设备唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'device_id' })
  deviceId!: string;

  /** 设备名称，可能为空 */
  @Column({ type: 'varchar', length: 128, name: 'device_name', nullable: true })
  deviceName!: string | null;

  /** 登录 IP 地址，可能为空 */
  @Column({ type: 'varchar', length: 64, name: 'login_ip', nullable: true })
  loginIp!: string | null;

  /** 登录城市，可能为空 */
  @Column({ type: 'varchar', length: 64, name: 'login_city', nullable: true })
  loginCity!: string | null;

  /** 是否为当前设备：1-是，0-否 */
  @Column({ type: 'tinyint', default: 0, name: 'is_current' })
  isCurrent!: number;

  /** 最后登录时间 */
  @CreateDateColumn({ name: 'last_login_at' })
  lastLoginAt!: Date;
}
