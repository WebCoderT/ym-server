import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';

export class CourierCompanyVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: '顺丰速运' })
  name!: string;

  @ApiPropertyOptional({ type: 'string', example: 'SF' })
  code!: string | null;

  @ApiPropertyOptional({ type: 'string', example: '国内快递' })
  type!: string | null;

  @ApiProperty({ type: 'boolean', example: true })
  enabled!: boolean;

  @ApiProperty({ type: Number, example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;
}

export class CourierCompanyInitResultVo {
  @ApiProperty({ type: Number, description: '新增数量', example: 50 })
  inserted!: number;

  @ApiProperty({ type: Number, description: '跳过数量（已存在）', example: 3 })
  skipped!: number;

  @ApiProperty({ type: Number, description: '文件中的总有效数据行数', example: 53 })
  total!: number;
}

export class CourierCompanyListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: [CourierCompanyVo] })
  items!: CourierCompanyVo[];

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
