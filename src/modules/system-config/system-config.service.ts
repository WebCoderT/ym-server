import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageConfigService } from '../storage/storage-config.service';
import { SystemConfigEntity } from './entities/system-config.entity';
import { UpdateSystemConfigRequestDto, FontConfigValueDto } from './dto/system-config.dto';
import { SystemConfigVo } from './vo/system-config.vo';

/**
 * 系统配置服务
 *
 * @description
 * 系统仅维护一条配置记录（id=1）。
 * 若记录不存在，自动创建一条默认配置。
 */
@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private readonly configRepo: Repository<SystemConfigEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 获取系统配置
   * @returns 系统配置 DTO
   */
  async getConfig(): Promise<SystemConfigVo> {
    const config = await this.ensureConfig();
    return this.toDto(config);
  }

  /**
   * 更新系统配置
   * @param dto - 更新内容
   * @returns 更新后的配置 DTO
   */
  async updateConfig(
    dto: UpdateSystemConfigRequestDto,
  ): Promise<SystemConfigVo> {
    const config = await this.ensureConfig();

    if (dto.name !== undefined) config.name = dto.name;
    if (dto.logo !== undefined) config.logo = this.storageConfig.normalizeFileUrl(dto.logo) ?? '';
    if (dto.mpLogo !== undefined) config.mpLogo = this.storageConfig.normalizeFileUrl(dto.mpLogo) ?? '';
    if (dto.emptyStateImage !== undefined) config.emptyStateImage = this.storageConfig.normalizeFileUrl(dto.emptyStateImage) ?? '';
    if (dto.starAvatarSelectedBg !== undefined) config.starAvatarSelectedBg = this.storageConfig.normalizeFileUrl(dto.starAvatarSelectedBg) ?? '';
    if (dto.description !== undefined) config.description = dto.description;
    if (dto.contactPhone !== undefined) config.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) config.contactEmail = dto.contactEmail;
    if (dto.loginMode !== undefined) config.loginMode = dto.loginMode;
    if (dto.cdnBaseUrl !== undefined) config.cdnBaseUrl = dto.cdnBaseUrl;
    if (dto.requireRealNameAuth !== undefined) config.requireRealNameAuth = dto.requireRealNameAuth;
    if (dto.globalUniqueAudience !== undefined) config.globalUniqueAudience = dto.globalUniqueAudience;
    if (dto.amapKey !== undefined) config.amapKey = dto.amapKey;
    if (dto.amapSecurityCode !== undefined) config.amapSecurityCode = dto.amapSecurityCode;
    if (dto.pageBackgrounds !== undefined) {
      // 处理每个条目：image 归一化为相对路径，code 原样保存
      const resolved: Record<string, { image: string; code: string }> = {};
      for (const [pagePath, entry] of Object.entries(dto.pageBackgrounds)) {
        resolved[pagePath] = {
          image: entry.image ? (this.storageConfig.normalizeFileUrl(entry.image) ?? '') : '',
          code: entry.code ?? '',
        };
      }
      config.pageBackgrounds = JSON.stringify(resolved);
    }
    if (dto.fontConfig !== undefined) {
      // fontUrl 归一化为相对路径，fontFamily 原样保存
      config.fontConfig = JSON.stringify({
        fontFamily: dto.fontConfig.fontFamily ?? '',
        fontUrl: dto.fontConfig.fontUrl
          ? (this.storageConfig.normalizeFileUrl(dto.fontConfig.fontUrl) ?? '')
          : '',
      });
    }
    if (dto.registrationAgreement !== undefined) config.registrationAgreement = dto.registrationAgreement;
    if (dto.privacyPolicy !== undefined) config.privacyPolicy = dto.privacyPolicy;
    if (dto.realNameAuthAgreement !== undefined) config.realNameAuthAgreement = dto.realNameAuthAgreement;
    if (dto.defaultNickname !== undefined) config.defaultNickname = dto.defaultNickname;
    if (dto.defaultAvatar !== undefined) config.defaultAvatar = this.storageConfig.normalizeFileUrl(dto.defaultAvatar) ?? '';
    if (dto.kuaidi100Customer !== undefined) config.kuaidi100Customer = dto.kuaidi100Customer;
    if (dto.kuaidi100Key !== undefined) config.kuaidi100Key = dto.kuaidi100Key;
    if (dto.defaultShippingFee !== undefined) config.defaultShippingFee = dto.defaultShippingFee;
    if (dto.remoteShippingFee !== undefined) config.remoteShippingFee = dto.remoteShippingFee;
    if (dto.freeShippingAmount !== undefined) config.freeShippingAmount = dto.freeShippingAmount;

    const saved = await this.configRepo.save(config);
    return this.toDto(saved);
  }

  /**
   * 确保配置记录存在（不存在则创建默认配置）
   */
  private async ensureConfig(): Promise<SystemConfigEntity> {
    let config = await this.configRepo.findOne({ where: { id: '1' } });
    if (!config) {
      config = this.configRepo.create({
        id: '1',
        name: '',
        logo: '',
        mpLogo: '',
        emptyStateImage: '',
        starAvatarSelectedBg: '',
        description: '',
        contactPhone: '',
        contactEmail: '',
        loginMode: 'wx,code,phone',
        cdnBaseUrl: '',
        requireRealNameAuth: false,
        globalUniqueAudience: false,
        amapKey: '',
        amapSecurityCode: '',
        pageBackgrounds: '{}',
        fontConfig: '{}',
        registrationAgreement: '',
        privacyPolicy: '',
        realNameAuthAgreement: '',
        defaultNickname: '粉丝',
        defaultAvatar: '',
        kuaidi100Customer: '',
        kuaidi100Key: '',
        defaultShippingFee: 0,
        remoteShippingFee: 0,
        freeShippingAmount: 0,
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  /**
   * 解析页面背景配置 JSON，将每个 image URL 拼接为完整地址
   */
  private async resolvePageBackgrounds(
    rawJson: string | null,
  ): Promise<Record<string, { image: string; code: string }>> {
    try {
      const raw: Record<string, unknown> = JSON.parse(rawJson || '{}');
      const resolved: Record<string, { image: string; code: string }> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // 新格式：{ image, code }
          const entry = value as Record<string, string>;
          resolved[key] = {
            image: entry.image ? await this.storageConfig.resolveFileUrl(entry.image) : '',
            code: entry.code ?? '',
          };
        } else if (typeof value === 'string') {
          // 兼容旧格式：字符串值视为 image
          resolved[key] = {
            image: value ? await this.storageConfig.resolveFileUrl(value) : '',
            code: '',
          };
        }
      }
      return resolved;
    } catch {
      return {};
    }
  }

  /**
   * 解析字体配置 JSON，将 fontUrl 拼接为完整地址
   */
  private async resolveFontConfig(
    rawJson: string | null,
  ): Promise<FontConfigValueDto> {
    try {
      const raw = JSON.parse(rawJson || '{}');
      if (!raw.fontUrl) return {};
      return {
        fontFamily: raw.fontFamily ?? '',
        fontUrl: await this.storageConfig.resolveFileUrl(raw.fontUrl),
      };
    } catch {
      return {};
    }
  }

  /**
   * 将实体转换为 DTO
   */
  private async toDto(entity: SystemConfigEntity): Promise<SystemConfigVo> {
    return {
      id: entity.id,
      name: entity.name,
      logo: await this.storageConfig.resolveFileUrl(entity.logo),
      mpLogo: await this.storageConfig.resolveFileUrl(entity.mpLogo),
      emptyStateImage: await this.storageConfig.resolveFileUrl(entity.emptyStateImage),
      starAvatarSelectedBg: await this.storageConfig.resolveFileUrl(entity.starAvatarSelectedBg),
      description: entity.description,
      contactPhone: entity.contactPhone,
      contactEmail: entity.contactEmail,
      loginMode: entity.loginMode,
      cdnBaseUrl: entity.cdnBaseUrl,
      requireRealNameAuth: entity.requireRealNameAuth,
      globalUniqueAudience: entity.globalUniqueAudience,
      amapKey: entity.amapKey,
      amapSecurityCode: entity.amapSecurityCode,
      pageBackgrounds: await this.resolvePageBackgrounds(entity.pageBackgrounds),
      fontConfig: await this.resolveFontConfig(entity.fontConfig),
      registrationAgreement: entity.registrationAgreement ?? '',
      privacyPolicy: entity.privacyPolicy ?? '',
      realNameAuthAgreement: entity.realNameAuthAgreement ?? '',
      defaultNickname: entity.defaultNickname || '粉丝',
      defaultAvatar: await this.storageConfig.resolveFileUrl(entity.defaultAvatar),
      kuaidi100Customer: entity.kuaidi100Customer ?? '',
      kuaidi100Key: entity.kuaidi100Key ?? '',
      defaultShippingFee: Number(entity.defaultShippingFee),
      remoteShippingFee: Number(entity.remoteShippingFee),
      freeShippingAmount: Number(entity.freeShippingAmount),
    };
  }
}
