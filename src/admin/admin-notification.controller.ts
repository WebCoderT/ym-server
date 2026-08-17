import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { PaginationRequestDto } from '../common/dto/pagination.dto';
import { CreateNotificationRequestDto, UpdateNotificationRequestDto } from '../modules/notification/dto/notification.dto';
import { NotificationVo, AdminNotificationListResponseVo } from '../modules/notification/vo/notification.vo';
import { NotificationService } from '../modules/notification/notification.service';

/**
 * 管理员通知管理控制器
 * 所有接口需要管理员权限
 */
@ApiTags('admin-notifications')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/notifications')
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取通知列表（分页）
   */
  @Get()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'List all notifications' })
  @ApiOkResponse({ type: AdminNotificationListResponseVo })
  async listNotifications(
    @Query() pagination: PaginationRequestDto,
  ): Promise<AdminNotificationListResponseVo> {
    return this.notificationService.listNotifications(pagination);
  }

  /**
   * 创建通知
   */
  @Post()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Create notification' })
  @ApiOkResponse({ type: NotificationVo })
  async createNotification(
    @Body() body: CreateNotificationRequestDto,
  ): Promise<NotificationVo> {
    return this.notificationService.createNotification(body);
  }

  /**
   * 更新通知
   */
  @Put(':id')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Update notification' })
  @ApiOkResponse({ type: NotificationVo })
  async updateNotification(
    @Param('id') id: string,
    @Body() body: UpdateNotificationRequestDto,
  ): Promise<NotificationVo> {
    return this.notificationService.updateNotification(id, body);
  }

  /**
   * 删除通知
   */
  @Delete(':id')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiOkResponse({ description: 'Deleted successfully' })
  async deleteNotification(@Param('id') id: string): Promise<void> {
    return this.notificationService.deleteNotification(id);
  }
}
