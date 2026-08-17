import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';

/* ── ImageGroup VOs ── */

export class ImageGroupVo {
  @ApiProperty({ type: String, description: '分组 ID' })
  id!: string;

  @ApiProperty({ type: String, description: '分组名称' })
  name!: string;

  @ApiProperty({ type: Number, description: '排序序号' })
  sortOrder!: number;

  @ApiProperty({ type: Date, description: '创建时间' })
  createdAt!: Date;
}

export class ImageGroupListResponseVo {
  @ApiProperty({ description: '分组列表', type: [ImageGroupVo] })
  items!: ImageGroupVo[];
}

/* ── Image VOs ── */

export class ImageVo {
  @ApiProperty({ type: String, description: '图片 ID' })
  id!: string;

  @ApiProperty({ type: String, description: '图片访问 URL（完整 URL，用于显示）' })
  url!: string;

  @ApiProperty({ type: String, description: 'OSS 存储路径（相对路径，用于存储到数据库）' })
  ossKey!: string;

  @ApiProperty({ type: String, description: '原始文件名' })
  fileName!: string;

  @ApiProperty({ type: Number, description: '文件大小（字节）' })
  fileSize!: number;

  @ApiProperty({ type: String, description: '所属分组 ID' })
  groupId!: string | null;

  @ApiProperty({ type: Date, description: '创建时间' })
  createdAt!: Date;
}

export class ImageListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ description: '图片列表', type: [ImageVo] })
  items!: ImageVo[];

  @ApiProperty({
    type: 'object',
    properties: {
      total: { type: 'number' },
      page: { type: 'number' },
      pageSize: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  pagination!: PaginationMeta;
}
