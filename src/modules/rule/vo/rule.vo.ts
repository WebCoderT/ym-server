import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';

export class RuleVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: 'fan_club_ranking' })
  code!: string;

  @ApiProperty({ type: 'string', example: '粉丝团榜单规则' })
  title!: string;

  @ApiProperty({ type: 'string', nullable: true })
  titleImage!: string | null;

  @ApiProperty({ type: 'string', example: '<p>规则内容...</p>' })
  content!: string;

  @ApiProperty({ type: 'string', nullable: true })
  backgroundImage!: string | null;

  @ApiProperty({ type: 'string', example: '2026-07-31T10:00:00.000Z' })
  updatedAt!: string;
}

export class RuleListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  @ApiProperty({ type: [RuleVo] })
  items!: RuleVo[];
}
