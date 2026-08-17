import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateQuickNavItemRequestDto {
  @ApiProperty({ description: '图标 URL' })
  @IsString()
  @MaxLength(512)
  icon!: string;

  @ApiProperty({ description: '显示文字' })
  @IsString()
  @MaxLength(32)
  label!: string;

  @ApiProperty({ description: '跳转地址' })
  @IsString()
  @MaxLength(512)
  url!: string;

  @ApiProperty({ description: '跳转方式', example: 'navigate' })
  @IsString()
  @MaxLength(32)
  openType!: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}

export class UpdateQuickNavItemRequestDto {
  @ApiPropertyOptional({ description: '图标 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  icon?: string;

  @ApiPropertyOptional({ description: '显示文字' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  label?: string;

  @ApiPropertyOptional({ description: '跳转地址' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  url?: string;

  @ApiPropertyOptional({ description: '跳转方式' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  openType?: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}
