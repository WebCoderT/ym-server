import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { UserStatus } from '../enums/user.enum';

/**
 * 更新客户端用户资料请求 DTO
 * 用于客户端用户更新自己的昵称、头像和手机号
 */
export class UpdateClientProfileRequestDto {
  /** 用户昵称（可选） */
  @ApiPropertyOptional({ example: '星愿旅人' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  nickname?: string;

  /** 用户头像 URL（可选） */
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** 用户手机号（可选） */
  @ApiPropertyOptional({ type: 'string', example: '13800138000', nullable: true })
  @IsOptional()
  @IsString()
  @Length(11, 20)
  phone?: string;

  /** 用户头像框（可选） */
  @ApiPropertyOptional({ type: 'string', example: 'avatar_frame_id', nullable: true })
  @IsOptional()
  @IsString()
  avatarFrame?: string | null;
}

/**
 * 管理员查询用户列表请求 DTO
 */
export class AdminUserListQueryDto {
  /** 搜索关键词（昵称、手机号、ID） */
  @ApiPropertyOptional({ example: '张三' })
  @IsOptional()
  @IsString()
  keyword?: string;

  /** 状态筛选 */
  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /** 页码，默认 1 */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** 每页条数，默认 10 */
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

/**
 * 管理员创建用户请求 DTO
 */
export class AdminCreateUserDto {
  /** 用户昵称 */
  @ApiProperty({ type: 'string', example: '张三' })
  @IsString()
  @Length(1, 64)
  nickname!: string;

  /** 用户手机号 */
  @ApiPropertyOptional({ example: '13800138000' })
  @IsOptional()
  @IsString()
  @Length(11, 20)
  phone?: string;

  /** 用户头像 URL */
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** 初始余额 */
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number = 0;

  /** 用户状态 */
  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;
}

/**
 * 管理员更新用户请求 DTO
 */
export class AdminUpdateUserDto {
  /** 用户昵称 */
  @ApiPropertyOptional({ example: '张三' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  nickname?: string;

  /** 用户手机号 */
  @ApiPropertyOptional({ example: '13800138000' })
  @IsOptional()
  @IsString()
  @Length(11, 20)
  phone?: string;

  /** 用户头像 URL */
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** 用户余额 */
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  balance?: number;
}

/**
 * 实名认证提交请求 DTO
 */
export class SubmitRealNameAuthRequestDto {
  /** 真实姓名 */
  @ApiProperty({ type: 'string', example: '张三' })
  @IsString()
  @Length(1, 64)
  realName!: string;

  /** 证件类型 */
  @ApiProperty({ type: 'string', example: '身份证' })
  @IsString()
  @Length(1, 20)
  idCardType!: string;

  /** 证件号码 */
  @ApiProperty({ type: 'string', example: '420123199001011234' })
  @IsString()
  @Length(1, 64)
  idCard!: string;

  /** 微信手机号临时 code（客户端 open-type="getPhoneNumber" 获取） */
  @ApiProperty({
    type: 'string',
    example: 'abcdef123456',
    description: '微信 getPhoneNumber 返回的临时 code，用于解码手机号',
  })
  @IsString()
  @Length(1, 256)
  phoneWechatCode!: string;
}

/**
 * 管理员更新用户会员等级请求 DTO
 */
export class AdminUpdateUserMemberLevelDto {
  /** 会员等级ID，null 表示取消等级 */
  @ApiPropertyOptional({ type: 'string', example: '1', nullable: true })
  @IsOptional()
  @IsString()
  memberLevelId?: string | null;
}

/**
 * 管理员更新用户状态请求 DTO
 */
export class AdminUpdateUserStatusDto {
  /** 用户状态 */
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
