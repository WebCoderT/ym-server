import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { CurrentAuth } from '../current-auth.decorator';
import type { AuthTokenPayload } from '../auth-token';
import { NotificationTargetPage } from '../modules/notification/entities/notification.entity';
import { ConfirmNotificationRequestDto } from '../modules/notification/dto/notification.dto';
import { ClientPendingNotificationVo } from '../modules/notification/vo/notification.vo';
import { NotificationService } from '../modules/notification/notification.service';

/**
 * 客户端通知控制器
 * 提供待确认通知查询与确认功能，需要客户端登录权限
 */
@ApiTags('client-notifications')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/notifications')
export class ClientNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取当前用户在指定页面的待确认通知（最多返回一条）
   */
  @Get('pending')
  @RequirePermission(Permission.CLIENT_NOTIFICATION)
  @ApiOperation({ summary: 'Get pending notification for a target page' })
  @ApiQuery({ name: 'targetPage', enum: NotificationTargetPage, required: true })
  @ApiOkResponse({ type: ClientPendingNotificationVo, nullable: true })
  async getPendingNotification(
    @CurrentAuth() auth: AuthTokenPayload,
    @Query('targetPage') targetPage: NotificationTargetPage,
  ): Promise<ClientPendingNotificationVo | null> {
    return this.notificationService.getPendingNotification(auth.sub, targetPage);
  }

  /**
   * 确认通知（标记为已读，不再弹出）
   */
  @Post('confirm')
  @RequirePermission(Permission.CLIENT_NOTIFICATION)
  @ApiOperation({ summary: 'Confirm a notification' })
  @ApiOkResponse({ description: 'Confirmed successfully' })
  async confirmNotification(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: ConfirmNotificationRequestDto,
  ): Promise<void> {
    return this.notificationService.confirmNotification(auth.sub, body.notificationId);
  }
}
