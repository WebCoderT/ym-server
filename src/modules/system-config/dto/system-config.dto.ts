import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PageBgValueDto {
  @ApiPropertyOptional({ type: String, description: '背景图片 URL（相对路径）' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: String, description: 'CSS background 代码' })
  @IsOptional()
  @IsString()
  code?: string;
}

export class FontConfigValueDto {
  @ApiPropertyOptional({ type: String, description: 'CSS font-family 名称' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ type: String, description: '字体文件 URL（完整地址）' })
  @IsOptional()
  @IsString()
  fontUrl?: string;
}

export class UpdateSystemConfigRequestDto {
  @ApiPropertyOptional({ description: '系统名称' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: '系统 Logo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  logo?: string;

  @ApiPropertyOptional({ description: '小程序 Logo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  mpLogo?: string;

  @ApiPropertyOptional({ description: '全局空状态图标 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  emptyStateImage?: string;

  @ApiPropertyOptional({ description: '明星头像选中背景图 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  starAvatarSelectedBg?: string;

  @ApiPropertyOptional({ description: '系统描述' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @ApiPropertyOptional({ description: '联系邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contactEmail?: string;

  @ApiPropertyOptional({ description: '登录方式配置：逗号分隔，如 wx,code,phone' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  loginMode?: string;

  @ApiPropertyOptional({ description: 'CDN 基础地址' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cdnBaseUrl?: string;

  @ApiPropertyOptional({ description: '是否强制实名认证', example: false })
  @IsOptional()
  @IsBoolean()
  requireRealNameAuth?: boolean;

  @ApiPropertyOptional({ description: '全局唯一观演人', example: false })
  @IsOptional()
  @IsBoolean()
  globalUniqueAudience?: boolean;

  @ApiPropertyOptional({ description: '高德地图 API Key（用于管理端地图选点）' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  amapKey?: string;

  @ApiPropertyOptional({ description: '高德地图安全密钥（AMap JS API 2.0 必填）' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  amapSecurityCode?: string;

  @ApiPropertyOptional({ description: '客户端页面背景配置' })
  @IsOptional()
  @IsObject()
  pageBackgrounds?: Record<string, PageBgValueDto>;

  @ApiPropertyOptional({ description: '客户端字体配置' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FontConfigValueDto)
  fontConfig?: FontConfigValueDto;

  @ApiPropertyOptional({ description: '注册协议内容（纯文本）' })
  @IsOptional()
  @IsString()
  registrationAgreement?: string;

  @ApiPropertyOptional({ description: '隐私政策内容（纯文本）' })
  @IsOptional()
  @IsString()
  privacyPolicy?: string;

  @ApiPropertyOptional({ description: '实名认证服务协议内容（纯文本）' })
  @IsOptional()
  @IsString()
  realNameAuthAgreement?: string;

  @ApiPropertyOptional({ description: '用户默认昵称前缀', example: '粉丝' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  defaultNickname?: string;

  @ApiPropertyOptional({ description: '用户默认头像 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  defaultAvatar?: string;

  @ApiPropertyOptional({ description: '快递100 Customer（API 授权标识）' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  kuaidi100Customer?: string;

  @ApiPropertyOptional({ description: '快递100 Key（API 密钥）' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  kuaidi100Key?: string;

  @ApiPropertyOptional({ description: '默认邮费（非偏远地区）', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultShippingFee?: number;

  @ApiPropertyOptional({ description: '偏远地区邮费', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remoteShippingFee?: number;

  @ApiPropertyOptional({ description: '包邮金额（订单金额达到此值免邮）', example: 99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingAmount?: number;
}
