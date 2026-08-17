import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageConfigService } from '../storage/storage-config.service';
import { QuickNavEntity } from './entities/quick-nav.entity';
import { CreateQuickNavItemRequestDto, UpdateQuickNavItemRequestDto } from './dto/quick-nav.dto';
import { QuickNavItemVo } from './vo/quick-nav.vo';

/**
 * 快捷导航服务
 */
@Injectable()
export class QuickNavService {
  constructor(
    @InjectRepository(QuickNavEntity)
    private readonly quickNavRepo: Repository<QuickNavEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 获取所有快捷导航项（按 sort 排序）
   */
  async findAll(): Promise<QuickNavItemVo[]> {
    const items = await this.quickNavRepo.find({
      order: { sort: 'ASC' },
    });
    return Promise.all(items.map((item) => this.toDto(item)));
  }

  /**
   * 创建快捷导航项
   */
  async create(dto: CreateQuickNavItemRequestDto): Promise<QuickNavItemVo> {
    const entity = this.quickNavRepo.create({
      icon: this.storageConfig.normalizeFileUrl(dto.icon) ?? '',
      label: dto.label,
      url: dto.url,
      openType: dto.openType,
      sort: dto.sort ?? 0,
    });
    const saved = await this.quickNavRepo.save(entity) as QuickNavEntity;
    return this.toDto(saved);
  }

  /**
   * 更新快捷导航项
   */
  async update(
    id: string,
    dto: UpdateQuickNavItemRequestDto,
  ): Promise<QuickNavItemVo> {
    const entity = await this.quickNavRepo.findOne({ where: { id } });
    if (!entity) {
      throw new Error('导航项不存在');
    }

    if (dto.icon !== undefined) entity.icon = this.storageConfig.normalizeFileUrl(dto.icon) ?? '';
    if (dto.label !== undefined) entity.label = dto.label;
    if (dto.url !== undefined) entity.url = dto.url;
    if (dto.openType !== undefined) entity.openType = dto.openType;
    if (dto.sort !== undefined) entity.sort = dto.sort;

    const saved = await this.quickNavRepo.save(entity);
    return this.toDto(saved);
  }

  /**
   * 删除快捷导航项
   */
  async remove(id: string): Promise<void> {
    await this.quickNavRepo.delete(id);
  }

  /**
   * 将实体转换为 DTO
   */
  private async toDto(entity: QuickNavEntity): Promise<QuickNavItemVo> {
    return {
      id: entity.id,
      icon: await this.storageConfig.resolveFileUrl(entity.icon),
      label: entity.label,
      url: entity.url,
      openType: entity.openType,
      sort: entity.sort,
    };
  }
}
