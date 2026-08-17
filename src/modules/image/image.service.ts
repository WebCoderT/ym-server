/**
 * @fileoverview 图片管理服务
 * 提供图片与图片分组的 CRUD 操作及列表查询。
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessLevel } from '../../access-level.enum';
import { buildPaginationMeta, calcSkip, PaginationRequestDto } from '../../common/dto/pagination.dto';
import { BUSINESS_MESSAGES } from '../../common/messages/business.messages';
import { StorageConfigService } from '../storage/storage-config.service';
import { ImageEntity } from './entities/image.entity';
import { ImageGroupEntity } from './entities/image-group.entity';
import { CreateImageGroupRequestDto, CreateImageRecordRequestDto, UpdateImageGroupRequestDto } from './dto/image.dto';
import { ImageVo, ImageGroupVo, ImageListResponseVo } from './vo/image.vo';

/**
 * 图片管理服务
 *
 * @description
 * 负责图片元数据和分组的持久化操作，包括创建、查询、删除。
 * 实际文件上传通过阿里云 OSS 直传完成，本服务仅管理元数据。
 */
@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(ImageGroupEntity)
    private readonly groupRepo: Repository<ImageGroupEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /* ── ImageGroup ── */

  async getGroupList(): Promise<ImageGroupVo[]> {
    const groups = await this.groupRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return groups.map(this.toGroupDto);
  }

  async createGroup(body: CreateImageGroupRequestDto): Promise<ImageGroupVo> {
    const group = this.groupRepo.create({
      name: body.name,
      sortOrder: body.sortOrder ?? 0,
    });
    const saved = await this.groupRepo.save(group);
    return this.toGroupDto(saved);
  }

  async updateGroup(
    groupId: string,
    body: UpdateImageGroupRequestDto,
  ): Promise<ImageGroupVo> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(BUSINESS_MESSAGES.IMAGE.GROUP_NOT_FOUND);
    }
    if (body.name !== undefined) group.name = body.name;
    if (body.sortOrder !== undefined) group.sortOrder = body.sortOrder;
    const saved = await this.groupRepo.save(group);
    return this.toGroupDto(saved);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(BUSINESS_MESSAGES.IMAGE.GROUP_NOT_FOUND);
    }
    // 将分组下图片的 groupId 置空
    await this.imageRepo.update({ groupId }, { groupId: null });
    await this.groupRepo.remove(group);
  }

  /* ── Image ── */

  async getImageList(
    groupId: string | undefined,
    pagination: PaginationRequestDto = {},
  ): Promise<ImageListResponseVo> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;

    const where: { groupId?: string } = {};
    if (groupId) {
      where.groupId = groupId;
    }

    const [images, total] = await this.imageRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: await Promise.all(images.map((img) => this.toImageVo(img))),
      pagination: buildPaginationMeta(total, page, pageSize),
    };
  }

  async createImage(body: CreateImageRecordRequestDto): Promise<ImageVo> {
    const image = this.imageRepo.create({
      url: this.storageConfig.normalizeFileUrl(body.url) ?? '',
      ossKey: body.ossKey,
      fileName: body.fileName ?? '',
      fileSize: body.fileSize ?? 0,
      groupId: body.groupId ?? null,
    });
    const saved = await this.imageRepo.save(image) as ImageEntity;
    return this.toImageVo(saved);
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException(BUSINESS_MESSAGES.IMAGE.NOT_FOUND);
    }
    await this.imageRepo.remove(image);
  }

  /* ── DTO 转换 ── */

  private toGroupDto(entity: ImageGroupEntity): ImageGroupVo {
    return {
      id: entity.id,
      name: entity.name,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
    };
  }

  private async toImageVo(entity: ImageEntity): Promise<ImageVo> {
    return {
      id: entity.id,
      url: await this.storageConfig.resolveFileUrl(entity.url),
      ossKey: entity.url, // 返回原始相对路径，用于前端存储
      fileName: entity.fileName,
      fileSize: entity.fileSize,
      groupId: entity.groupId,
      createdAt: entity.createdAt,
    };
  }
}
