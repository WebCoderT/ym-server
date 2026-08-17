import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 系统配置实体
 *
 * @description
 * 管理系统全局基础配置，包括logo、名称、描述等。
 * 表中仅有一条记录（id=1），通过更新该记录实现配置变更。
 */
@Entity('system_config')
export class SystemConfigEntity {
  /** 配置 ID，固定为 1 */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 系统名称 */
  @Column({ type: 'varchar', length: 128, default: '' })
  name!: string;

  /** 系统 Logo URL */
  @Column({ type: 'varchar', length: 512, default: '' })
  logo!: string;

  /** 小程序 Logo URL */
  @Column({ type: 'varchar', length: 512, default: '', name: 'mp_logo' })
  mpLogo!: string;

  /** 全局空状态图标 URL */
  @Column({ type: 'varchar', length: 512, default: '', name: 'empty_state_image' })
  emptyStateImage!: string;

  /** 明星头像选中背景图 URL */
  @Column({ type: 'varchar', length: 512, default: '', name: 'star_avatar_selected_bg' })
  starAvatarSelectedBg!: string;

  /** 系统描述 */
  @Column({ type: 'varchar', length: 512, default: '' })
  description!: string;

  /** 联系电话 */
  @Column({ type: 'varchar', length: 32, default: '', name: 'contact_phone' })
  contactPhone!: string;

  /** 联系邮箱 */
  @Column({ type: 'varchar', length: 128, default: '', name: 'contact_email' })
  contactEmail!: string;

  /** 登录方式配置：逗号分隔，如 wx,code,phone */
  @Column({ type: 'varchar', length: 64, default: 'wx,code,phone', name: 'login_mode' })
  loginMode!: string;

  /** CDN 基础地址 */
  @Column({ type: 'varchar', length: 512, default: '', name: 'cdn_base_url' })
  cdnBaseUrl!: string;

  /**
   * 是否强制实名认证（开启后用户登录必须完成实名认证才能使用系统）
   * 认证时同步完成手机号绑定（微信一键获取手机号）
   */
  @Column({ type: 'boolean', default: false, name: 'require_real_name_auth' })
  requireRealNameAuth!: boolean;

  /**
   * 全局唯一观演人（开启后用户完成手机号绑定和实名认证时，自动将认证信息添加为观演人）
   * 客户端隐藏观演人的新增、编辑和删除功能
   */
  @Column({ type: 'boolean', default: false, name: 'global_unique_audience' })
  globalUniqueAudience!: boolean;

  /** 高德地图 API Key（用于管理端地图选点组件） */
  @Column({ type: 'varchar', length: 128, default: '', name: 'amap_key' })
  amapKey!: string;

  /** 高德地图安全密钥（AMap JS API 2.0 必填，与 Key 配合使用） */
  @Column({ type: 'varchar', length: 128, default: '', name: 'amap_security_code' })
  amapSecurityCode!: string;

  /**
   * 客户端页面背景配置（JSON 文本）
   * 格式：Record<string, string>，key 为客户端页面路径（如 pages/index/index），value 为背景图片 URL
   * 特殊 key "default" 表示全局默认背景，优先级低于页面级配置
   */
  @Column({ type: 'text', nullable: true, name: 'page_backgrounds' })
  pageBackgrounds!: string;

  /**
   * 客户端字体配置（JSON 文本）
   * 格式：{ fontFamily: string, fontUrl: string }
   * fontFamily 为 CSS font-family 名称，fontUrl 为字体文件相对路径
   * 为空时表示未配置自定义字体
   */
  @Column({ type: 'text', nullable: true, name: 'font_config' })
  fontConfig!: string;

  /** 注册协议内容（纯文本，由管理端编辑，客户端展示） */
  @Column({ type: 'text', nullable: true, name: 'registration_agreement' })
  registrationAgreement!: string;

  /** 隐私政策内容（纯文本，由管理端编辑，客户端展示） */
  @Column({ type: 'text', nullable: true, name: 'privacy_policy' })
  privacyPolicy!: string;

  /** 实名认证服务协议内容（纯文本，由管理端编辑，客户端展示） */
  @Column({ type: 'text', nullable: true, name: 'real_name_auth_agreement' })
  realNameAuthAgreement!: string;

  /** 用户默认昵称前缀（实际昵称 = 前缀 + 用户ID，如"粉丝" → "粉丝1001"） */
  @Column({ type: 'varchar', length: 32, default: '粉丝', name: 'default_nickname' })
  defaultNickname!: string;

  /** 用户默认头像 URL（相对路径） */
  @Column({ type: 'varchar', length: 512, default: '', name: 'default_avatar' })
  defaultAvatar!: string;

  /** 快递100 Customer（API 授权标识，用于物流轨迹查询） */
  @Column({ type: 'varchar', length: 128, default: '', name: 'kuaidi100_customer' })
  kuaidi100Customer!: string;

  /** 快递100 Key（API 密钥，用于签名校验） */
  @Column({ type: 'varchar', length: 128, default: '', name: 'kuaidi100_key' })
  kuaidi100Key!: string;

  /** 默认邮费（非偏远地区） */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'default_shipping_fee' })
  defaultShippingFee!: number;

  /** 偏远地区邮费 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'remote_shipping_fee' })
  remoteShippingFee!: number;

  /** 包邮金额（订单金额达到此值免邮） */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'free_shipping_amount' })
  freeShippingAmount!: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
