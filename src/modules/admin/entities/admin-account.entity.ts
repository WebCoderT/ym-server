/**
 * 管理员账户实体模块
 * 本模块定义了系统管理员账户的数据库实体结构，
 * 用于在数据库中存储和管理管理员的基本信息、登录凭据及状态。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 管理员账户实体类
 * 对应数据库表 admin_accounts，存储管理员账号相关信息。
 */
@Entity({ name: 'admin_accounts' })
export class AdminAccountEntity {
  /**
   * 管理员唯一标识符
   * 采用 UUID 自动生成，作为主键使用。
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 管理员登录用户名
   * 全局唯一，最大长度为 64 个字符，用于管理员登录系统。
   */
  @Column({ unique: true, length: 64 })
  username!: string;

  /**
   * 管理员显示名称
   * 最大长度为 128 个字符，用于在系统中展示管理员名称。
   */
  @Column({ length: 128 })
  displayName!: string;

  /**
   * 密码哈希值
   * 存储经过加密处理后的密码，最大长度为 255 个字符，保障账户安全。
   */
  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  /**
   * 账户是否激活
   * 默认值为 true，表示账户处于可用状态；false 表示账户被禁用。
   */
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  /**
   * 记录创建时间
   * 由数据库自动维护，记录该管理员账户首次创建的时间点。
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * 记录更新时间
   * 由数据库自动维护，记录该管理员账户最近一次修改的时间点。
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
