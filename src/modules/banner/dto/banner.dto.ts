import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { BannerLinkType } from '../enums/banner-link-type.enum';
import { BannerStatus } from '../enums/banner-status.enum';

/**
 * 创建Banner请求DTO
 */
export class CreateBannerRequestDto {
  @ApiProperty({ type: 'string', example: '林星语新专辑首发' })
  @IsString()
  @Length(1, 128)
  title!: string;

  @ApiProperty({ type: 'string', example: 'https://cdn.example.com/banner/001.jpg' })
  @IsString()
  @Length(1, 512)
  image!: string;

  @ApiProperty({ enum: BannerLinkType, example: BannerLinkType.STAR })
  @IsEnum(BannerLinkType)
  linkType!: BannerLinkType;

  @ApiProperty({ type: 'string', example: 'star_001' })
  @IsString()
  @Length(1, 128)
  linkTarget!: string;

  @ApiPropertyOptional({ type: 'string', example: '林星语全新专辑震撼首发，快来参与打榜活动' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: 'string', isArray: true, example: ['热门', '首发'] })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ type: 'string', example: '2024-06-15' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ type: 'string', example: '2024-07-15' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ enum: BannerStatus, example: BannerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BannerStatus)
  status?: BannerStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

/**
 * 更新Banner请求DTO
 */
export class UpdateBannerRequestDto {
  @ApiPropertyOptional({ example: '林星语新专辑首发' })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  title?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner/001.jpg' })
  @IsOptional()
  @IsString()
  @Length(1, 512)
  image?: string;

  @ApiPropertyOptional({ enum: BannerLinkType, example: BannerLinkType.STAR })
  @IsOptional()
  @IsEnum(BannerLinkType)
  linkType?: BannerLinkType;

  @ApiPropertyOptional({ example: 'star_001' })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  linkTarget?: string;

  @ApiPropertyOptional({ type: 'string', example: '林星语全新专辑震撼首发，快来参与打榜活动' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: 'string', isArray: true, example: ['热门', '首发'] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: '2024-06-15' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: BannerStatus, example: BannerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BannerStatus)
  status?: BannerStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
