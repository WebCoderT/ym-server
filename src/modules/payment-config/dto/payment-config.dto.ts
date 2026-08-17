import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePaymentConfigRequestDto {
  @ApiPropertyOptional({ description: '微信小程序 AppID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechatAppId?: string;

  @ApiPropertyOptional({ description: '微信小程序 AppSecret' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  wechatAppSecret?: string;

  @ApiPropertyOptional({ description: '微信支付商户号' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  wechatMchId?: string;

  @ApiPropertyOptional({ description: 'APIv3 密钥' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechatPayApiV3Key?: string;

  @ApiPropertyOptional({ description: '商户证书序列号' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechatPaySerialNo?: string;

  @ApiPropertyOptional({ description: '商户私钥（PEM 格式）' })
  @IsOptional()
  @IsString()
  wechatPayPrivateKey?: string;

  @ApiPropertyOptional({ description: '微信支付平台证书（PEM 格式）' })
  @IsOptional()
  @IsString()
  wechatPayPlatformCert?: string;

  @ApiPropertyOptional({ description: '回调通知 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  wechatPayNotifyUrl?: string;

  @ApiPropertyOptional({ description: '支付宝应用 AppID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  alipayAppId?: string;

  @ApiPropertyOptional({ description: '支付宝应用私钥（RSA2，PEM 格式）' })
  @IsOptional()
  @IsString()
  alipayPrivateKey?: string;

  @ApiPropertyOptional({ description: '支付宝公钥（RSA2，PEM 格式）' })
  @IsOptional()
  @IsString()
  alipayPublicKey?: string;

  @ApiPropertyOptional({ description: '支付宝异步通知 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  alipayNotifyUrl?: string;

  @ApiPropertyOptional({ description: '支付宝同步回跳 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  alipayReturnUrl?: string;
}
