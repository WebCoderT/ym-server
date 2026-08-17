/**
 * @fileoverview 存储配置管理服务
 * 负责读取和更新系统存储配置，并在首次启动时初始化默认值。
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageConfigEntity } from './entities/storage-config.entity';
import { UpdateStorageConfigRequestDto } from './dto/storage.dto';
import { StorageConfigVo } from './vo/storage.vo';

/**
 * 存储配置服务
 *
 * @description
 * 系统仅维护一条存储配置记录（id=1）。
 * 若记录不存在，自动创建一条默认使用本地存储的配置。
 */
@Injectable()
export class StorageConfigService {
  constructor(
    @InjectRepository(StorageConfigEntity)
    private readonly configRepo: Repository<StorageConfigEntity>,
  ) {}

  /**
   * 获取当前存储配置
   * @returns 存储配置 DTO
   */
  async getConfig(): Promise<StorageConfigVo> {
    const config = await this.ensureConfig();
    return this.toDto(config);
  }

  /**
   * 更新存储配置
   * @param dto - 更新内容
   * @returns 更新后的配置 DTO
   */
  async updateConfig(dto: UpdateStorageConfigRequestDto): Promise<StorageConfigVo> {
    const config = await this.ensureConfig();

    config.provider = dto.provider;
    if (dto.localBaseUrl !== undefined) config.localBaseUrl = dto.localBaseUrl || null;
    if (dto.localStoragePath !== undefined) config.localStoragePath = dto.localStoragePath || null;
    if (dto.ossRegion !== undefined) config.ossRegion = dto.ossRegion || null;
    if (dto.ossBucket !== undefined) config.ossBucket = dto.ossBucket || null;
    if (dto.ossAccessKeyId !== undefined) config.ossAccessKeyId = dto.ossAccessKeyId || null;
    if (dto.ossAccessKeySecret !== undefined) config.ossAccessKeySecret = dto.ossAccessKeySecret || null;
    if (dto.ossEndpoint !== undefined) config.ossEndpoint = dto.ossEndpoint || null;
    if (dto.ossCdnDomain !== undefined) config.ossCdnDomain = dto.ossCdnDomain || null;

    const saved = await this.configRepo.save(config);
    return this.toDto(saved);
  }

  /**
   * 确保配置记录存在（不存在则创建默认配置）
   */
  private async ensureConfig(): Promise<StorageConfigEntity> {
    let config = await this.configRepo.findOne({ where: { id: '1' } });
    if (!config) {
      config = this.configRepo.create({
        id: '1',
        provider: 'local',
        localStoragePath: 'uploads',
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  /**
   * 将实体转换为 DTO
   */
  private toDto(entity: StorageConfigEntity): StorageConfigVo {
    return {
      id: entity.id,
      provider: entity.provider,
      localBaseUrl: entity.localBaseUrl,
      localStoragePath: entity.localStoragePath,
      ossRegion: entity.ossRegion,
      ossBucket: entity.ossBucket,
      ossAccessKeyId: entity.ossAccessKeyId,
      ossAccessKeySecret: entity.ossAccessKeySecret,
      ossEndpoint: entity.ossEndpoint,
      ossCdnDomain: entity.ossCdnDomain,
    };
  }

  /* ───────────────────── URL 动态拼接 ───────────────────── */

  /**
   * 根据存储配置将数据库中的相对路径拼接为完整可访问 URL
   *
   * @description
   * - 如果传入的已是完整 URL（以 http:// 或 https:// 开头），直接返回（兼容历史数据）
   * - 空值返回空字符串
   * - 根据 provider 类型和配置字段动态拼接前缀
   *
   * @param storedPath - 数据库中存储的相对路径
   * @returns 完整的文件访问 URL
   */
  async resolveFileUrl(storedPath: string | null | undefined): Promise<string> {
    if (!storedPath?.trim()) return '';
    const trimmed = storedPath.trim();

    // 已是完整 URL（兼容历史数据），直接返回
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const config = await this.getConfig();
    const normalizedPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

    if (config.provider === 'oss') {
      if (config.ossCdnDomain) {
        return `${config.ossCdnDomain.replace(/\/$/, '')}/${normalizedPath}`;
      }
      if (config.ossEndpoint) {
        return `${config.ossEndpoint.replace(/\/$/, '')}/${normalizedPath}`;
      }
      if (config.ossBucket && config.ossRegion) {
        return `https://${config.ossBucket}.${config.ossRegion}.aliyuncs.com/${normalizedPath}`;
      }
      return normalizedPath;
    }

    // 本地存储
    if (config.localBaseUrl) {
      return `${config.localBaseUrl.replace(/\/$/, '')}/${normalizedPath}`;
    }
    return `/${normalizedPath}`;
  }

  /**
   * 批量将相对路径拼接为完整 URL
   * @param storedPaths - 数据库中存储的相对路径数组
   * @returns 完整 URL 数组（过滤空值）
   */
  async resolveFileUrls(storedPaths: (string | null | undefined)[] | null | undefined): Promise<string[]> {
    if (!storedPaths?.length) return [];
    const resolved = await Promise.all(storedPaths.map((p) => this.resolveFileUrl(p)));
    return resolved.filter(Boolean);
  }

  /* ───────────────────── URL 归一化（保存前剥离域名） ───────────────────── */

  /**
   * 将图片 URL 归一化为相对路径，剥离所有域名前缀
   *
   * @description
   * 确保数据库中只存储相对路径，域名由 resolveFileUrl() 在读取时动态拼接。
   * - 已是相对路径 → 原样返回
   * - 完整 URL → 剥离协议和域名部分，只保留路径
   * - 空值 → 返回 null
   *
   * @param url - 前端传入的图片 URL（可能是完整 URL 或相对路径）
   * @returns 归一化后的相对路径，空值返回 null
   */
  normalizeFileUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    const trimmed = url.trim();

    // 已是相对路径，直接返回
    if (!/^https?:\/\//i.test(trimmed)) return trimmed;

    // 完整 URL → 提取路径部分（剥离协议和域名）
    try {
      const parsed = new URL(trimmed);
      // 返回 pathname + search + hash，去掉开头的 /
      const path = parsed.pathname.replace(/^\//, '') + parsed.search + parsed.hash;
      return path || null;
    } catch {
      // URL 解析失败，用正则兜底
      return trimmed.replace(/^https?:\/\/[^/]+\/?/i, '') || null;
    }
  }

  /**
   * 批量归一化图片 URL 数组
   * @param urls - 前端传入的图片 URL 数组
   * @returns 归一化后的相对路径数组（过滤空值）
   */
  normalizeFileUrls(urls: (string | null | undefined)[] | null | undefined): string[] | null {
    if (!urls?.length) return null;
    const normalized = urls.map((u) => this.normalizeFileUrl(u)).filter(Boolean) as string[];
    return normalized.length > 0 ? normalized : null;
  }
}
