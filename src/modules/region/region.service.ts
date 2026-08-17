import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from './entities/region.entity';
import { RegionDataItem } from './region-data';

export interface RegionTreeNode {
  id: number;
  code: string;
  name: string;
  level: number;
  children?: RegionTreeNode[];
}

/**
 * 地区服务
 * 提供地区数据的查询、初始化、管理功能
 */
@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,
  ) {}

  /**
   * 获取地区树（仅启用的地区）
   */
  async getRegionTree(): Promise<RegionTreeNode[]> {
    const regions = await this.regionRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return this.buildTree(regions);
  }

  /**
   * 获取所有地区（管理端用）
   */
  async getAllRegions(): Promise<RegionEntity[]> {
    return this.regionRepo.find({
      order: { level: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取子地区列表
   */
  async getChildren(parentId: number): Promise<RegionEntity[]> {
    return this.regionRepo.find({
      where: { parentId, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 批量导入地区数据
   */
  async importRegions(
    regions: Array<{
      code: string;
      name: string;
      parentId: number;
      level: number;
      sortOrder: number;
    }>,
  ): Promise<void> {
    // 清空现有数据
    await this.regionRepo.clear();
    // 批量插入
    const entities = regions.map((r) =>
      this.regionRepo.create({
        code: r.code,
        name: r.name,
        parentId: r.parentId,
        level: r.level,
        sortOrder: r.sortOrder,
        isActive: true,
      }),
    );
    await this.regionRepo.save(entities);
  }

  /**
   * 从原始行政区划数据初始化
   * 按层级顺序插入，自动维护 parentId 映射
   */
  async initFromRegionData(rawData: RegionDataItem[]): Promise<{ count: number }> {
    await this.regionRepo.clear();

    const codeToId = new Map<string, number>();
    let sortOrder = 0;

    // 按层级排序：先省(1) -> 市(2) -> 区(3)
    const sorted = [...rawData].sort((a, b) => a.level - b.level);

    for (const item of sorted) {
      const parentId = item.parentCode === '0' ? 0 : (codeToId.get(item.parentCode) ?? 0);
      const entity = this.regionRepo.create({
        code: item.code,
        name: item.name,
        parentId,
        level: item.level,
        sortOrder: sortOrder++,
        isActive: true,
      });
      const saved = await this.regionRepo.save(entity);
      codeToId.set(item.code, saved.id);
    }

    return { count: sorted.length };
  }

  /**
   * 启用/禁用地区
   */
  async toggleRegionActive(
    regionId: number,
    isActive: boolean,
  ): Promise<RegionEntity> {
    const region = await this.regionRepo.findOne({
      where: { id: regionId },
    });
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }
    region.isActive = isActive;
    await this.regionRepo.save(region);
    return region;
  }

  /**
   * 设置地区偏远标记
   */
  async toggleRegionRemote(
    regionId: number,
    isRemote: boolean,
  ): Promise<RegionEntity> {
    const region = await this.regionRepo.findOne({
      where: { id: regionId },
    });
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }
    region.isRemote = isRemote;
    await this.regionRepo.save(region);
    return region;
  }

  /**
   * 根据ID获取地区
   */
  async getRegionById(id: number): Promise<RegionEntity | null> {
    return this.regionRepo.findOne({ where: { id } });
  }

  /**
   * 根据名称获取地区
   */
  async getRegionByName(name: string): Promise<RegionEntity | null> {
    return this.regionRepo.findOne({ where: { name } });
  }

  /**
   * 根据code获取地区
   */
  async getRegionByCode(code: string): Promise<RegionEntity | null> {
    return this.regionRepo.findOne({ where: { code } });
  }

  /**
   * 构建树形结构
   */
  private buildTree(regions: RegionEntity[]): RegionTreeNode[] {
    const map = new Map<number, RegionTreeNode>();
    const roots: RegionTreeNode[] = [];

    for (const r of regions) {
      map.set(r.id, {
        id: r.id,
        code: r.code,
        name: r.name,
        level: r.level,
        children: [],
      });
    }

    for (const r of regions) {
      const node = map.get(r.id)!;
      if (r.parentId === 0) {
        roots.push(node);
      } else {
        const parent = map.get(r.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    }

    // 移除空的 children 数组
    const clean = (nodes: RegionTreeNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length === 0) {
          delete node.children;
        } else if (node.children) {
          clean(node.children);
        }
      }
    };
    clean(roots);

    return roots;
  }
}
