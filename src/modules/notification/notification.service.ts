import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessLevel } from '../../access-level.enum';
import { buildPaginationMeta, calcSkip, PaginationRequestDto } from '../../common/dto/pagination.dto';
import { BUSINESS_MESSAGES } from '../../common/messages/business.messages';
import { NotificationEntity, NotificationTargetPage } from './entities/notification.entity';
import { NotificationConfirmEntity } from './entities/notification-confirm.entity';
import {
  CreateNotificationRequestDto,
  UpdateNotificationRequestDto,
  ConfirmNotificationRequestDto,
} from './dto/notification.dto';
import {
  AdminNotificationListResponseVo,
  ClientPendingNotificationVo,
  NotificationVo,
} from './vo/notification.vo';

/**
 * 通知服务
 * 提供管理端通知 CRUD 与客户端待确认通知查询 / 确认功能
 */
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationConfirmEntity)
    private readonly confirmRepo: Repository<NotificationConfirmEntity>,
  ) {}

  // ── 管理端方法 ──

  /**
   * 获取通知列表（分页，管理端）
   * 按创建时间倒序排列
   */
  async listNotifications(
    pagination: PaginationRequestDto = {},
  ): Promise<AdminNotificationListResponseVo> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;

    const [items, total] = await this.notificationRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: items.map((n) => this.toVo(n)),
      pagination: buildPaginationMeta(total, page, pageSize),
    };
  }

  /**
   * 创建通知
   */
  async createNotification(
    body: CreateNotificationRequestDto,
  ): Promise<NotificationVo> {
    const notification = this.notificationRepo.create({
      content: body.content,
      targetPage: body.targetPage,
    });
    await this.notificationRepo.save(notification);
    return this.toVo(notification);
  }

  /**
   * 更新通知
   */
  async updateNotification(
    id: string,
    body: UpdateNotificationRequestDto,
  ): Promise<NotificationVo> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(BUSINESS_MESSAGES.NOTIFICATION.NOT_FOUND(id));
    }

    if (body.content !== undefined) notification.content = body.content;
    if (body.targetPage !== undefined) notification.targetPage = body.targetPage;

    await this.notificationRepo.save(notification);
    return this.toVo(notification);
  }

  /**
   * 删除通知（同时清理关联的确认记录）
   */
  async deleteNotification(id: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(BUSINESS_MESSAGES.NOTIFICATION.NOT_FOUND(id));
    }

    // 先删除关联的确认记录
    await this.confirmRepo.delete({ notificationId: id });
    await this.notificationRepo.remove(notification);
  }

  // ── 客户端方法 ──

  /**
   * 获取当前用户在指定页面的第一条待确认通知
   * 查询逻辑：找到目标页面的通知，排除用户已确认的，返回最早创建的一条
   */
  async getPendingNotification(
    userId: string,
    targetPage: NotificationTargetPage,
  ): Promise<ClientPendingNotificationVo | null> {
    // 查询用户已确认的通知 ID 列表
    const confirmedRecords = await this.confirmRepo.find({
      where: { userId },
      select: ['notificationId'],
    });
    const confirmedIds = confirmedRecords.map((r) => r.notificationId);

    // 查询目标页面中未被该用户确认的通知，按创建时间正序（先发布的先弹）
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.targetPage = :targetPage', { targetPage })
      .orderBy('notification.createdAt', 'ASC');

    if (confirmedIds.length > 0) {
      query.andWhere('notification.id NOT IN (:...confirmedIds)', { confirmedIds });
    }

    const notification = await query.getOne();
    if (!notification) return null;

    return {
      id: notification.id,
      content: notification.content,
    };
  }

  /**
   * 确认通知（记录用户已读）
   * 使用 insert + ignore 方式避免重复插入
   */
  async confirmNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    // 确认通知存在
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException(BUSINESS_MESSAGES.NOTIFICATION.NOT_FOUND(notificationId));
    }

    // 插入确认记录（如果已存在则忽略）
    await this.confirmRepo
      .createQueryBuilder()
      .insert()
      .into(NotificationConfirmEntity)
      .values({
        notificationId,
        userId,
      })
      .orIgnore()
      .execute();
  }

  // ── 私有方法 ──

  private toVo(entity: NotificationEntity): NotificationVo {
    return {
      id: entity.id,
      content: entity.content,
      targetPage: entity.targetPage,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
