import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StorageConfigVo {
  @ApiProperty({ type: String, description: '配置 ID' })
  id!: string;

  @ApiProperty({ type: String, description: '存储提供商：local / oss', example: 'local' })
  provider!: string;

  @ApiPropertyOptional({ description: '本地存储基础访问 URL', type: 'string', nullable: true })
  localBaseUrl!: string | null;

  @ApiPropertyOptional({ description: '本地存储文件保存目录', type: 'string', nullable: true })
  localStoragePath!: string | null;

  @ApiPropertyOptional({ description: 'OSS 地域节点', type: 'string', nullable: true })
  ossRegion!: string | null;

  @ApiPropertyOptional({ description: 'OSS 存储空间名称', type: 'string', nullable: true })
  ossBucket!: string | null;

  @ApiPropertyOptional({ description: 'OSS AccessKey ID', type: 'string', nullable: true })
  ossAccessKeyId!: string | null;

  @ApiPropertyOptional({ description: 'OSS AccessKey Secret', type: 'string', nullable: true })
  ossAccessKeySecret!: string | null;

  @ApiPropertyOptional({ description: 'OSS Endpoint', type: 'string', nullable: true })
  ossEndpoint!: string | null;

  @ApiPropertyOptional({ description: 'OSS CDN 加速域名', type: 'string', nullable: true })
  ossCdnDomain!: string | null;
}

export class UploadFileResponseVo {
  @ApiProperty({ type: String, description: '文件访问 URL' })
  url!: string;

  @ApiProperty({ type: String, description: '存储路径/key' })
  key!: string;

  @ApiProperty({ type: String, description: '原始文件名' })
  fileName!: string;

  @ApiProperty({ type: Number, description: '文件大小（字节）' })
  fileSize!: number;
}
