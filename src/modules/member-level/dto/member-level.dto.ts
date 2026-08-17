import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';

/**
 * 会员特权配置 DTO
 */
export class MemberPrivilegesDto {
  @ApiPropertyOptional({ type: 'number', example: 0.95, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  goodsDiscount?: number | null;

  @ApiPropertyOptional({ type: 'boolean', example: false })
  @IsOptional()
  @IsBoolean()
  earlyTicket?: boolean;

  @ApiPropertyOptional({ type: 'boolean', example: false })
  @IsOptional()
  @IsBoolean()
  fastRefund?: boolean;
}

/**
 * 创建会员等级请求 DTO
 */
export class CreateMemberLevelRequestDto {
  @ApiProperty({ type: 'string', example: '白银会员' })
  @IsString()
  name!: string;

  @ApiProperty({ type: 'number', example: 1 })
  @IsNumber()
  @Min(1)
  level!: number;

  @ApiProperty({ type: 'number', example: 1000 })
  @IsNumber()
  @Min(0)
  minSpending!: number;

  @ApiPropertyOptional({ type: 'string', example: 'https://cdn.example.com/icon.png' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ type: MemberPrivilegesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberPrivilegesDto)
  privileges?: MemberPrivilegesDto;
}

/**
 * 更新会员等级请求 DTO
 */
export class UpdateMemberLevelRequestDto {
  @ApiPropertyOptional({ type: 'string', example: '黄金会员' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: 'number', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({ type: 'number', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpending?: number;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ type: MemberPrivilegesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberPrivilegesDto)
  privileges?: MemberPrivilegesDto;
}

/**
 * 会员等级响应 DTO
 */
export class MemberLevelDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ type: 'number' })
  level!: number;

  @ApiProperty({ type: 'number' })
  minSpending!: number;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  icon!: string | null;

  @ApiProperty({ type: MemberPrivilegesDto })
  privileges!: MemberPrivilegesDto;
}

/**
 * 会员等级列表响应 DTO
 */
export class MemberLevelListResponseDto {
  @ApiProperty({ enum: AccessLevel })
  audience!: AccessLevel;

  @ApiProperty({ type: [MemberLevelDto] })
  items!: MemberLevelDto[];

  @ApiProperty({ type: PaginationMeta })
  pagination!: PaginationMeta;
}

/**
 * 用户会员等级响应 DTO
 */
export class UserMemberLevelResponseDto {
  @ApiProperty({ enum: AccessLevel })
  audience!: AccessLevel;

  @ApiProperty({ type: 'string' })
  userId!: string;

  @ApiProperty({ type: 'number' })
  totalSpending!: number;

  @ApiPropertyOptional({ type: MemberLevelDto, nullable: true })
  currentLevel!: MemberLevelDto | null;

  @ApiPropertyOptional({ type: MemberLevelDto, nullable: true })
  nextLevel!: MemberLevelDto | null;
}
