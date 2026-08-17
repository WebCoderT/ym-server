import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 单个页面背景值
 */
export class PageBgValueVo {
  @ApiPropertyOptional({ type: String, description: '背景图片 URL（相对路径）' })
  image?: string;

  @ApiPropertyOptional({ type: String, description: 'CSS background 代码' })
  code?: string;
}

/**
 * 字体配置值
 */
export class FontConfigValueVo {
  @ApiPropertyOptional({ type: String, description: 'CSS font-family 名称' })
  fontFamily?: string;

  @ApiPropertyOptional({ type: String, description: '字体文件 URL（完整地址）' })
  fontUrl?: string;
}

/**
 * 系统配置响应 VO
 */
export class SystemConfigVo {
  @ApiProperty({ type: String, description: '配置 ID' })
  id!: string;

  @ApiProperty({ type: String, description: '系统名称' })
  name!: string;

  @ApiProperty({ type: String, description: '系统 Logo URL' })
  logo!: string;

  @ApiProperty({ type: String, description: '小程序 Logo URL' })
  mpLogo!: string;

  @ApiProperty({ type: String, description: '全局空状态图标 URL' })
  emptyStateImage!: string;

  @ApiProperty({ type: String, description: '明星头像选中背景图 URL' })
  starAvatarSelectedBg!: string;

  @ApiProperty({ type: String, description: '系统描述' })
  description!: string;

  @ApiProperty({ type: String, description: '联系电话' })
  contactPhone!: string;

  @ApiProperty({ type: String, description: '联系邮箱' })
  contactEmail!: string;

  @ApiProperty({ type: String, description: '登录方式配置：逗号分隔，如 wx,code,phone' })
  loginMode!: string;

  @ApiProperty({ type: String, description: 'CDN 基础地址' })
  cdnBaseUrl!: string;

  @ApiProperty({ type: Boolean, description: '是否强制实名认证', example: false })
  requireRealNameAuth!: boolean;

  @ApiProperty({ type: Boolean, description: '全局唯一观演人', example: false })
  globalUniqueAudience!: boolean;

  @ApiProperty({ type: String, description: '高德地图 API Key（用于管理端地图选点）' })
  amapKey!: string;

  @ApiProperty({ type: String, description: '高德地图安全密钥（AMap JS API 2.0 必填）' })
  amapSecurityCode!: string;

  @ApiProperty({
    type: 'object',
    description: '客户端页面背景配置',
    additionalProperties: {
      type: 'object',
      properties: {
        image: { type: 'string', description: '背景图片 URL（相对路径）' },
        code: { type: 'string', description: 'CSS background 代码' },
      },
    },
  })
  pageBackgrounds!: Record<string, PageBgValueVo>;

  @ApiPropertyOptional({
    type: FontConfigValueVo,
    description: '客户端字体配置',
  })
  fontConfig!: FontConfigValueVo;

  @ApiProperty({ type: String, description: '注册协议内容（纯文本）', default: '' })
  registrationAgreement!: string;

  @ApiProperty({ type: String, description: '隐私政策内容（纯文本）', default: '' })
  privacyPolicy!: string;

  @ApiProperty({ type: String, description: '实名认证服务协议内容（纯文本）', default: '' })
  realNameAuthAgreement!: string;

  @ApiProperty({ type: String, description: '用户默认昵称前缀', default: '粉丝' })
  defaultNickname!: string;

  @ApiProperty({ type: String, description: '用户默认头像 URL', default: '' })
  defaultAvatar!: string;

  @ApiProperty({ type: String, description: '快递100 Customer（API 授权标识）', default: '' })
  kuaidi100Customer!: string;

  @ApiProperty({ type: String, description: '快递100 Key（API 密钥）', default: '' })
  kuaidi100Key!: string;

  @ApiProperty({ type: Number, description: '默认邮费（非偏远地区）', default: 0 })
  defaultShippingFee!: number;

  @ApiProperty({ type: Number, description: '偏远地区邮费', default: 0 })
  remoteShippingFee!: number;

  @ApiProperty({ type: Number, description: '包邮金额（订单金额达到此值免邮）', default: 0 })
  freeShippingAmount!: number;
}
