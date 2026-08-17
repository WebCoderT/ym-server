import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 支付配置实体
 * 存储微信支付等支付方式的配置参数
 * 系统仅维护一条配置记录（id=1）
 */
@Entity('payment_config')
export class PaymentConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /* ============ 微信小程序基础配置 ============ */

  /** 微信小程序 AppID */
  @Column({ type: 'varchar', length: 64, default: '', name: 'wechat_app_id' })
  wechatAppId!: string;

  /** 微信小程序 AppSecret */
  @Column({ type: 'varchar', length: 128, default: '', name: 'wechat_app_secret' })
  wechatAppSecret!: string;

  /* ============ 微信支付配置 ============ */

  /** 微信支付商户号 */
  @Column({ type: 'varchar', length: 32, default: '', name: 'wechat_mch_id' })
  wechatMchId!: string;

  /** 微信支付 APIv3 密钥（32 字节） */
  @Column({ type: 'varchar', length: 64, default: '', name: 'wechat_pay_api_v3_key' })
  wechatPayApiV3Key!: string;

  /** 商户 API 证书序列号 */
  @Column({ type: 'varchar', length: 64, default: '', name: 'wechat_pay_serial_no' })
  wechatPaySerialNo!: string;

  /** 商户 API 私钥内容（PEM 格式） */
  @Column({ type: 'text', nullable: true, name: 'wechat_pay_private_key' })
  wechatPayPrivateKey!: string | null;

  /** 微信支付平台证书内容（PEM 格式，用于验证回调签名） */
  @Column({ type: 'text', nullable: true, name: 'wechat_pay_platform_cert' })
  wechatPayPlatformCert!: string | null;

  /** 支付结果回调通知 URL */
  @Column({ type: 'varchar', length: 256, default: '', name: 'wechat_pay_notify_url' })
  wechatPayNotifyUrl!: string;

  /* ============ 支付宝配置 ============ */

  /** 支付宝应用 AppID */
  @Column({ type: 'varchar', length: 64, default: '', name: 'alipay_app_id' })
  alipayAppId!: string;

  /** 支付宝应用私钥（RSA2，PEM 格式） */
  @Column({ type: 'text', nullable: true, name: 'alipay_private_key' })
  alipayPrivateKey!: string | null;

  /** 支付宝公钥（RSA2，PEM 格式，用于验证回调签名） */
  @Column({ type: 'text', nullable: true, name: 'alipay_public_key' })
  alipayPublicKey!: string | null;

  /** 支付宝回调通知 URL */
  @Column({ type: 'varchar', length: 256, default: '', name: 'alipay_notify_url' })
  alipayNotifyUrl!: string;

  /** 支付宝同步回跳 URL（支付完成后前端跳转） */
  @Column({ type: 'varchar', length: 256, default: '', name: 'alipay_return_url' })
  alipayReturnUrl!: string;

  /* ============ 时间戳 ============ */

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
