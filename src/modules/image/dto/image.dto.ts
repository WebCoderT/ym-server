import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateImageGroupRequestDto {
  @ApiProperty({ description: '分组名称', example: '明星头像' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: '排序序号', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateImageGroupRequestDto {
  @ApiPropertyOptional({ description: '分组名称', example: '明星头像' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '排序序号', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateImageRecordRequestDto {
  @ApiProperty({ description: '图片访问 URL', example: 'https://cdn.example.com/images/star/avatar.jpg' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({ description: 'OSS 存储路径', example: 'images/stars/1234567890_abc123.jpg' })
  @IsString()
  @IsNotEmpty()
  ossKey!: string;

  @ApiPropertyOptional({ description: '原始文件名', example: 'avatar.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: '文件大小（字节）', example: 102400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: '所属分组 ID', example: '1' })
  @IsOptional()
  @IsString()
  groupId?: string;
}
