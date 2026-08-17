import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { StorageConfigService } from '../storage/storage-config.service';
import { BannerEntity, BannerStatus } from './entities/banner.entity';
import { CreateBannerRequestDto, UpdateBannerRequestDto } from './dto/banner.dto';
import {
  AdminBannerListResponseVo,
  BannerSummaryVo,
  ClientBannerListResponseVo,
} from './vo/banner.vo';

/**
 * Banner服务
 * 提供Banner的查询、创建、更新、删除功能
 */
@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(BannerEntity)
    private readonly bannerRepo: Repository<BannerEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 获取Banner列表（管理后台）
   */
  async listAdminBanners(): Promise<AdminBannerListResponseVo> {
    const banners = await this.bannerRepo.find({
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return {
      items: await Promise.all(banners.map((b) => this.toSummaryVo(b))),
    };
  }

  /**
   * 获取生效中的Banner列表（客户端）
   * 只返回状态为active且在有效期内的Banner
   */
  async listClientBanners(): Promise<ClientBannerListResponseVo> {
    const now = new Date();
    const banners = await this.bannerRepo.find({
      where: {
        status: BannerStatus.ACTIVE,
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      order: { priority: 'ASC' },
    });

    return {
      items: await Promise.all(banners.map((b) => this.toSummaryVo(b))),
    };
  }

  /**
   * 根据ID获取Banner详情
   */
  async getBannerDetail(bannerId: string): Promise<BannerSummaryVo> {
    const banner = await this.bannerRepo.findOne({ where: { id: bannerId } });
    if (!banner) {
      throw new NotFoundException(`Banner ${bannerId} not found`);
    }
    return this.toSummaryVo(banner);
  }

  /**
   * 创建Banner
   */
  async createBanner(body: CreateBannerRequestDto): Promise<BannerSummaryVo> {
    const banner = this.bannerRepo.create({
      title: body.title,
      image: this.storageConfig.normalizeFileUrl(body.image) ?? '',
      linkType: body.linkType,
      linkTarget: body.linkTarget,
      description: body.description ?? null,
      tags: body.tags ?? null,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      status: body.status ?? BannerStatus.ACTIVE,
      priority: body.priority ?? 0,
    });

    await this.bannerRepo.save(banner);
    return this.toSummaryVo(banner);
  }

  /**
   * 更新Banner
   */
  async updateBanner(bannerId: string, body: UpdateBannerRequestDto): Promise<BannerSummaryVo> {
    const banner = await this.bannerRepo.findOne({ where: { id: bannerId } });
    if (!banner) {
      throw new NotFoundException(`Banner ${bannerId} not found`);
    }

    if (body.title !== undefined) banner.title = body.title;
    if (body.image !== undefined)
      banner.image = await this.storageConfig.resolveFileUrl(body.image);
    if (body.linkType !== undefined) banner.linkType = body.linkType;
    if (body.linkTarget !== undefined) banner.linkTarget = body.linkTarget;
    if (body.description !== undefined) banner.description = body.description ?? null;
    if (body.tags !== undefined) banner.tags = body.tags ?? null;
    if (body.startTime !== undefined) banner.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) banner.endTime = new Date(body.endTime);
    if (body.status !== undefined) banner.status = body.status;
    if (body.priority !== undefined) banner.priority = body.priority;

    await this.bannerRepo.save(banner);
    return this.toSummaryVo(banner);
  }

  /**
   * 删除Banner
   */
  async deleteBanner(bannerId: string): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id: bannerId } });
    if (!banner) {
      throw new NotFoundException(`Banner ${bannerId} not found`);
    }
    await this.bannerRepo.remove(banner);
  }

  /**
   * 实体转DTO
   */
  private async toSummaryVo(banner: BannerEntity): Promise<BannerSummaryVo> {
    return {
      id: banner.id,
      title: banner.title,
      image: await this.storageConfig.resolveFileUrl(banner.image),
      linkType: banner.linkType,
      linkTarget: banner.linkTarget,
      description: banner.description,
      tags: banner.tags,
      startTime: this.formatDate(banner.startTime),
      endTime: this.formatDate(banner.endTime),
      status: banner.status,
      priority: banner.priority,
      createdAt: banner.createdAt.toISOString(),
    };
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
