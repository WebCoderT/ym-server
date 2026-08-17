import { ApiProperty } from '@nestjs/swagger';
import { BannerLinkType } from '../enums/banner-link-type.enum';
import { BannerStatus } from '../enums/banner-status.enum';

/**
 * Banner列表项VO
 */
export class BannerSummaryVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: '林星语新专辑首发' })
  title!: string;

  @ApiProperty({ type: 'string', example: 'https://cdn.example.com/banner/001.jpg' })
  image!: string;

  @ApiProperty({ enum: BannerLinkType, example: BannerLinkType.STAR })
  linkType!: BannerLinkType;

  @ApiProperty({ type: 'string', example: 'star_001' })
  linkTarget!: string;

  @ApiProperty({ type: 'string', example: '林星语全新专辑震撼首发，快来参与打榜活动', nullable: true })
  description!: string | null;

  @ApiProperty({ type: 'string', isArray: true, example: ['热门', '首发'], nullable: true })
  tags!: string[] | null;

  @ApiProperty({ type: 'string', example: '2024-06-15' })
  startTime!: string;

  @ApiProperty({ type: 'string', example: '2024-07-15' })
  endTime!: string;

  @ApiProperty({ enum: BannerStatus, example: BannerStatus.ACTIVE })
  status!: BannerStatus;

  @ApiProperty({ type: Number, example: 1 })
  priority!: number;

  @ApiProperty({ type: 'string', example: '2024-06-01T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * Banner列表响应VO（管理后台）
 */
export class AdminBannerListResponseVo {
  @ApiProperty({ type: [BannerSummaryVo] })
  items!: BannerSummaryVo[];
}

/**
 * 客户端Banner列表响应VO
 */
export class ClientBannerListResponseVo {
  @ApiProperty({ type: [BannerSummaryVo] })
  items!: BannerSummaryVo[];
}
