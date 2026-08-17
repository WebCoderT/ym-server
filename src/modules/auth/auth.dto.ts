import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 登录请求 DTO
 * 用于客户端通过微信登录码发起登录请求时传递参数
 */
export class LoginRequestDto {
  /** 微信登录临时凭证 */
  @ApiProperty({ type: 'string', example: 'wechat-login-code' })
  @IsString()
  @MinLength(4)
  code!: string;

  /** 用户昵称（可选） */
  @ApiPropertyOptional({ example: '星愿旅人' })
  @IsOptional()
  @IsString()
  nickname?: string;

  /** 用户头像 URL（可选） */
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** 设备唯一标识（可选） */
  @ApiPropertyOptional({ example: 'device-iphone-15' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  /** 设备名称（可选） */
  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * 刷新令牌请求 DTO
 * 用于客户端通过刷新令牌换取新的访问令牌
 */
export class RefreshTokenRequestDto {
  /** 刷新令牌字符串 */
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

/**
 * 登出请求 DTO
 * 用于客户端发起登出请求时可选地传入刷新令牌以彻底注销会话
 */
export class LogoutRequestDto {
  /** 刷新令牌字符串（可选） */
  @ApiPropertyOptional({ example: 'refresh-token-value' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

/**
 * 注册请求 DTO
 * 用于客户端通过手机号和密码注册账号
 */
export class RegisterRequestDto {
  /** 手机号 */
  @ApiProperty({ type: 'string', example: '13800138000' })
  @IsString()
  @MinLength(11)
  phone!: string;

  /** 密码 */
  @ApiProperty({ type: 'string', example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  /** 用户昵称（可选） */
  @ApiPropertyOptional({ example: '星愿旅人' })
  @IsOptional()
  @IsString()
  nickname?: string;

  /** 设备唯一标识（可选） */
  @ApiPropertyOptional({ example: 'device-iphone-15' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  /** 设备名称（可选） */
  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * 手机号登录请求 DTO
 * 用于客户端通过手机号和密码登录
 */
export class PhoneLoginRequestDto {
  /** 手机号 */
  @ApiProperty({ type: 'string', example: '13800138000' })
  @IsString()
  @MinLength(11)
  phone!: string;

  /** 密码 */
  @ApiProperty({ type: 'string', example: 'password123' })
  @IsString()
  @MinLength(1)
  password!: string;

  /** 设备唯一标识（可选） */
  @ApiPropertyOptional({ example: 'device-iphone-15' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  /** 设备名称（可选） */
  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * 发送验证码请求 DTO
 */
export class SendCodeRequestDto {
  @ApiProperty({ type: 'string', example: '13800138000' })
  @IsString()
  @MinLength(11)
  phone!: string;
}

/**
 * 验证码登录请求 DTO
 */
export class CodeLoginRequestDto {
  @ApiProperty({ type: 'string', example: '13800138000' })
  @IsString()
  @MinLength(11)
  phone!: string;

  @ApiProperty({ type: 'string', example: '123456' })
  @IsString()
  @MinLength(4)
  code!: string;

  @ApiPropertyOptional({ example: 'device-iphone-15' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * 绑定手机号请求 DTO
 * 用于已登录用户绑定手机号
 */
export class BindPhoneRequestDto {
  /** 手机号 */
  @ApiProperty({ type: 'string', example: '13800138000' })
  @IsString()
  @MinLength(11)
  phone!: string;

  /** 短信验证码 */
  @ApiProperty({ type: 'string', example: '123456' })
  @IsString()
  @MinLength(4)
  code!: string;
}

/**
 * 微信一键绑定手机号请求 DTO
 * 使用微信 getPhoneNumber 获取的 code 直接绑定，无需短信验证码
 */
export class WechatBindPhoneRequestDto {
  /** 微信 getPhoneNumber 事件回调中的 code */
  @ApiProperty({ type: 'string', description: '微信 getPhoneNumber 回调中的 code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
