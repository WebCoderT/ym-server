import { ApiProperty } from '@nestjs/swagger';

/**
 * 会员等级摘要 VO
 * 用于在排行榜等场景中轻量展示用户的会员等级信息
 */
export class MemberLevelSummary {
  /** 等级唯一标识 */
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  /** 等级名称，如"白银会员" */
  @ApiProperty({ type: 'string', example: '白银会员' })
  name!: string;

  /** 等级序号 */
  @ApiProperty({ type: Number, example: 1 })
  level!: number;

  /** 等级图标 URL */
  @ApiProperty({ type: 'string', example: 'https://example.com/icon.png', nullable: true })
  icon!: string | null;
}
