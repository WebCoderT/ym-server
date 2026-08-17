import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OssSignatureRequestDto {
  @ApiProperty({
    description: '文件存储目录，例如 images/stars',
    example: 'images/stars',
  })
  @IsString()
  @IsNotEmpty()
  dir!: string;

  @ApiPropertyOptional({
    description: '可选的自定义文件名',
    example: 'avatar.jpg',
  })
  @IsString()
  @IsOptional()
  filename?: string;
}
