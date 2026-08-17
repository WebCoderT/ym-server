import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';
import { NotificationTargetPage } from '../enums/notification-target-page.enum';

/**
 * 目标页面选项标签映射（供前端使用）
 */
export const NOTIFICATION_TARGET_PAGE_LABELS: Record<NotificationTargetPage, string> = {
  [NotificationTargetPage.INDEX]: '首页',
  [NotificationTargetPage.STAR]: '明星',
  [NotificationTargetPage.CARD]: '星卡',
  [NotificationTargetPage.GOODS]: '周边',
  [NotificationTargetPage.USER]: '我的',
};

// ── 管理端 VO ──

/**
 * 通知 VO（管理端列表 / 详情使用）
 */
export class NotificationVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: '某某明星已退出' })
  content!: string;

  @ApiProperty({ enum: NotificationTargetPage, example: NotificationTargetPage.STAR })
  targetPage!: NotificationTargetPage;

  @ApiProperty({ type: 'string', example: '2026-06-29T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: 'string', example: '2026-06-29T10:00:00.000Z' })
  updatedAt!: string;
}

/**
 * 管理端通知列表响应 VO
 */
export class AdminNotificationListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: [NotificationVo] })
  items!: NotificationVo[];

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

// ── 客户端 VO ──

/**
 * 客户端待确认通知 VO
 */
export class ClientPendingNotificationVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: '某某明星已经退出，请注意' })
  content!: string;
}
