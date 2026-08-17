import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 支付方式实体
 *
 * 管理系统支持的支付方式（如微信支付、余额支付），仅控制：
 * - 客户端展示哪些支付方式（启用/停用、排序、名称、图标）
 *
 * 注意：支付凭证配置（如商户号、API 密钥等）统一存放在 `payment_config` 表，
 * 通过管理后台「订单中心 → 支付配置」页面维护。本表不再存储任何敏感凭证。
 */
@Entity('payment_methods')
@Index('IDX_payment_method_code', ['code'], { unique: true })
export class PaymentMethodEntity {
  /** 支付方式唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 支付方式编码，唯一标识，如 wechat / balance */
  @Column({ type: 'varchar', length: 32, unique: true })
  code!: string;

  /** 支付方式显示名称 */
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  /** 支付方式图标 URL */
  @Column({ type: 'varchar', length: 512, default: '' })
  icon!: string;

  /** 支付方式描述 */
  @Column({ type: 'varchar', length: 256, default: '' })
  description!: string;

  /** 是否启用 */
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  /** 排序权重，数字越小越靠前 */
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
