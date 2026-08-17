import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateStorageConfigRequestDto {
  @ApiProperty({ description: '存储提供商：local / oss', example: 'local' })
  @IsString()
  @IsIn(['local', 'oss'])
  provider!: string;

  @ApiPropertyOptional({ description: '本地存储基础访问 URL' })
  @IsOptional()
  @IsString()
  localBaseUrl?: string;

  @ApiPropertyOptional({ description: '本地存储文件保存目录' })
  @IsOptional()
  @IsString()
  localStoragePath?: string;

  @ApiPropertyOptional({ description: 'OSS 地域节点' })
  @IsOptional()
  @IsString()
  ossRegion?: string;

  @ApiPropertyOptional({ description: 'OSS 存储空间名称' })
  @IsOptional()
  @IsString()
  ossBucket?: string;

  @ApiPropertyOptional({ description: 'OSS AccessKey ID' })
  @IsOptional()
  @IsString()
  ossAccessKeyId?: string;

  @ApiPropertyOptional({ description: 'OSS AccessKey Secret' })
  @IsOptional()
  @IsString()
  ossAccessKeySecret?: string;

  @ApiPropertyOptional({ description: 'OSS Endpoint' })
  @IsOptional()
  @IsString()
  ossEndpoint?: string;

  @ApiPropertyOptional({ description: 'OSS CDN 加速域名' })
  @IsOptional()
  @IsString()
  ossCdnDomain?: string;
}
