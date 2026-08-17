import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentConfigVo {
  @ApiProperty({ description: '配置 ID' })
  id!: string;

  @ApiPropertyOptional({ description: '微信小程序 AppID' })
  wechatAppId!: string;

  @ApiProperty({ description: '微信小程序 AppSecret 是否已配置' })
  wechatAppSecretConfigured!: boolean;

  @ApiPropertyOptional({ description: '微信支付商户号' })
  wechatMchId!: string;

  @ApiProperty({ description: 'APIv3 密钥是否已配置' })
  wechatPayApiV3KeyConfigured!: boolean;

  @ApiPropertyOptional({ description: '商户证书序列号' })
  wechatPaySerialNo!: string;

  @ApiProperty({ description: '商户私钥是否已配置' })
  wechatPayPrivateKeyConfigured!: boolean;

  @ApiProperty({ description: '平台证书是否已配置' })
  wechatPayPlatformCertConfigured!: boolean;

  @ApiPropertyOptional({ description: '回调通知 URL' })
  wechatPayNotifyUrl!: string;

  @ApiProperty({ description: '微信支付是否完整配置' })
  wechatPayConfigured!: boolean;

  @ApiPropertyOptional({ description: '支付宝应用 AppID' })
  alipayAppId!: string;

  @ApiProperty({ description: '支付宝应用私钥是否已配置' })
  alipayPrivateKeyConfigured!: boolean;

  @ApiProperty({ description: '支付宝公钥是否已配置' })
  alipayPublicKeyConfigured!: boolean;

  @ApiPropertyOptional({ description: '支付宝异步通知 URL' })
  alipayNotifyUrl!: string;

  @ApiPropertyOptional({ description: '支付宝同步回跳 URL' })
  alipayReturnUrl!: string;

  @ApiProperty({ description: '支付宝是否完整配置' })
  alipayConfigured!: boolean;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: string;
}

export class PaymentConfigDetailVo extends PaymentConfigVo {
  @ApiPropertyOptional({ description: '微信小程序 AppSecret（完整内容）' })
  wechatAppSecret!: string;

  @ApiPropertyOptional({ description: 'APIv3 密钥（完整内容）' })
  wechatPayApiV3Key!: string;

  @ApiPropertyOptional({ description: '商户私钥（完整内容）' })
  wechatPayPrivateKey!: string | null;

  @ApiPropertyOptional({ description: '平台证书（完整内容）' })
  wechatPayPlatformCert!: string | null;

  @ApiPropertyOptional({ description: '支付宝应用私钥（完整内容）' })
  alipayPrivateKey!: string | null;

  @ApiPropertyOptional({ description: '支付宝公钥（完整内容）' })
  alipayPublicKey!: string | null;
}
