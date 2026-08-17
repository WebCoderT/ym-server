import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';
import { TrendRange } from '../enums/trend-range.enum';

/* ─────────── 通用模块统计子结构 ─────────── */

export class UserStatsVo {
  @ApiProperty({ type: Number, example: 1000 })
  total!: number;

  @ApiProperty({ type: Number, example: 10 })
  todayNew!: number;
}

export class MemberStatsVo {
  @ApiProperty({ type: Number, example: 500 })
  total!: number;
}

export class WalletStatsVo {
  @ApiProperty({ type: Number, example: 200 })
  rechargeCount!: number;

  @ApiProperty({ type: Number, example: 50000 })
  rechargeTotal!: number;

  @ApiProperty({ type: Number, example: 50 })
  withdrawalCount!: number;
}

export class ContentStatsVo {
  @ApiProperty({ type: Number, example: 1000 })
  imageCount!: number;

  @ApiProperty({ type: Number, example: 10 })
  bannerCount!: number;

  @ApiProperty({ type: Number, example: 100 })
  notificationCount!: number;

  @ApiProperty({ type: Number, example: 20 })
  courierCount!: number;
}

/* ─────────── 主响应结构 ─────────── */

export class DashboardStatsResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: UserStatsVo })
  users!: UserStatsVo;

  @ApiProperty({ type: MemberStatsVo })
  members!: MemberStatsVo;

  @ApiProperty({ type: WalletStatsVo })
  wallet!: WalletStatsVo;

  @ApiProperty({ type: ContentStatsVo })
  content!: ContentStatsVo;
}

/**
 * 趋势点 VO
 */
export class TrendPointVo {
  @ApiProperty({ type: 'string', description: '日期' })
  date!: string;

  @ApiProperty({ type: Number, description: '数值' })
  value!: number;
}

/**
 * 趋势响应 VO
 */
export class TrendResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: [TrendPointVo] })
  points!: TrendPointVo[];
}
