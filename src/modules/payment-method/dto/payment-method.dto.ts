import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentMethodRequestDto {
  @ApiProperty({ example: 'wechat', description: '支付方式编码，唯一' })
  @IsString()
  code!: string;

  @ApiProperty({ example: '微信支付', description: '支付方式显示名称' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '', description: '图标 URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '推荐使用微信支付', description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 0, description: '排序权重' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePaymentMethodRequestDto {
  @ApiPropertyOptional({ example: '微信支付', description: '支付方式显示名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '', description: '图标 URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '推荐使用微信支付', description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 0, description: '排序权重' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class TogglePaymentMethodRequestDto {
  @ApiProperty({ example: true, description: '是否启用' })
  @IsBoolean()
  enabled!: boolean;
}
