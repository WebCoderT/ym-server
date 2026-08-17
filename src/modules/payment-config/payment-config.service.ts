import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentConfigEntity } from './entities/payment-config.entity';
import { UpdatePaymentConfigRequestDto } from './dto/payment-config.dto';
import { PaymentConfigVo, PaymentConfigDetailVo } from './vo/payment-config.vo';

/**
 * 内存缓存的配置数据
 */
interface CachedConfig {
  config: PaymentConfigEntity;
  loadedAt: number;
}

/**
 * 支付配置服务
 *
 * @description
 * 系统仅维护一条支付配置记录（id=1）。
 * 若记录不存在，自动创建一条默认配置。
 * 配置数据会在内存中缓存，避免频繁查询数据库。
 */
@Injectable()
export class PaymentConfigService implements OnModuleInit {
  private readonly logger = new Logger(PaymentConfigService.name);

  /** 内存缓存 */
  private cache: CachedConfig | null = null;

  /** 缓存有效期（毫秒） */
  private readonly CACHE_TTL = 60 * 1000; // 1 分钟

  constructor(
    @InjectRepository(PaymentConfigEntity)
    private readonly configRepo: Repository<PaymentConfigEntity>,
  ) {}

  async onModuleInit() {
    // 模块初始化时预加载配置
    await this.ensureConfig();
    this.logger.log('支付配置模块已初始化');
  }

  /**
   * 获取支付配置（普通视图，敏感字段仅返回是否已配置）
   */
  async getConfig(): Promise<PaymentConfigVo> {
    const config = await this.ensureConfig();
    return this.toDto(config);
  }

  /**
   * 获取支付配置详情（管理端视图，包含完整敏感字段）
   */
  async getConfigDetail(): Promise<PaymentConfigDetailVo> {
    const config = await this.ensureConfig();
    return this.toDetailDto(config);
  }

  /**
   * 更新支付配置
   */
  async updateConfig(dto: UpdatePaymentConfigRequestDto): Promise<PaymentConfigVo> {
    const config = await this.ensureConfig();

    // 只更新传入的字段
    if (dto.wechatAppId !== undefined) config.wechatAppId = dto.wechatAppId;
    if (dto.wechatAppSecret !== undefined) config.wechatAppSecret = dto.wechatAppSecret;
    if (dto.wechatMchId !== undefined) config.wechatMchId = dto.wechatMchId;
    if (dto.wechatPayApiV3Key !== undefined) config.wechatPayApiV3Key = dto.wechatPayApiV3Key;
    if (dto.wechatPaySerialNo !== undefined) config.wechatPaySerialNo = dto.wechatPaySerialNo;
    if (dto.wechatPayPrivateKey !== undefined) config.wechatPayPrivateKey = dto.wechatPayPrivateKey;
    if (dto.wechatPayPlatformCert !== undefined) config.wechatPayPlatformCert = dto.wechatPayPlatformCert;
    if (dto.wechatPayNotifyUrl !== undefined) config.wechatPayNotifyUrl = dto.wechatPayNotifyUrl;

    // 支付宝配置
    if (dto.alipayAppId !== undefined) config.alipayAppId = dto.alipayAppId;
    if (dto.alipayPrivateKey !== undefined) config.alipayPrivateKey = dto.alipayPrivateKey;
    if (dto.alipayPublicKey !== undefined) config.alipayPublicKey = dto.alipayPublicKey;
    if (dto.alipayNotifyUrl !== undefined) config.alipayNotifyUrl = dto.alipayNotifyUrl;
    if (dto.alipayReturnUrl !== undefined) config.alipayReturnUrl = dto.alipayReturnUrl;

    const saved = await this.configRepo.save(config);

    // 清除缓存，下次读取时重新加载
    this.clearCache();

    this.logger.log('支付配置已更新');

    return this.toDto(saved);
  }

  /**
   * 判断微信支付是否已完整配置
   * 供 wechat-pay.service 调用
   */
  async isWechatPayConfigured(): Promise<boolean> {
    const config = await this.ensureConfig();
    return Boolean(
      config.wechatAppId &&
      config.wechatMchId &&
      config.wechatPayApiV3Key &&
      config.wechatPaySerialNo &&
      config.wechatPayPrivateKey &&
      config.wechatPayNotifyUrl,
    );
  }

  /**
   * 获取微信 AppID
   */
  async getWechatAppId(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatAppId;
  }

  /**
   * 获取微信 AppSecret
   */
  async getWechatAppSecret(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatAppSecret;
  }

  /**
   * 获取微信支付商户号
   */
  async getWechatMchId(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatMchId;
  }

  /**
   * 获取微信支付 APIv3 密钥
   */
  async getWechatPayApiV3Key(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatPayApiV3Key;
  }

  /**
   * 获取商户证书序列号
   */
  async getWechatPaySerialNo(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatPaySerialNo;
  }

  /**
   * 获取商户私钥内容
   */
  async getWechatPayPrivateKey(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatPayPrivateKey ?? '';
  }

  /**
   * 获取平台证书内容
   */
  async getWechatPayPlatformCert(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatPayPlatformCert ?? '';
  }

  /**
   * 获取回调通知 URL
   */
  async getWechatPayNotifyUrl(): Promise<string> {
    const config = await this.ensureConfig();
    return config.wechatPayNotifyUrl;
  }

  /* ───────────────────── 支付宝配置读取 ───────────────────── */

  /**
   * 判断支付宝是否已完整配置
   * 供 alipay-pay.service 调用
   */
  async isAlipayConfigured(): Promise<boolean> {
    const config = await this.ensureConfig();
    return Boolean(
      config.alipayAppId &&
      config.alipayPrivateKey &&
      config.alipayPublicKey &&
      config.alipayNotifyUrl,
    );
  }

  /**
   * 获取支付宝 AppID
   */
  async getAlipayAppId(): Promise<string> {
    const config = await this.ensureConfig();
    return config.alipayAppId;
  }

  /**
   * 获取支付宝应用私钥
   */
  async getAlipayPrivateKey(): Promise<string> {
    const config = await this.ensureConfig();
    return config.alipayPrivateKey ?? '';
  }

  /**
   * 获取支付宝公钥
   */
  async getAlipayPublicKey(): Promise<string> {
    const config = await this.ensureConfig();
    return config.alipayPublicKey ?? '';
  }

  /**
   * 获取支付宝异步通知 URL
   */
  async getAlipayNotifyUrl(): Promise<string> {
    const config = await this.ensureConfig();
    return config.alipayNotifyUrl;
  }

  /**
   * 获取支付宝同步回跳 URL
   */
  async getAlipayReturnUrl(): Promise<string> {
    const config = await this.ensureConfig();
    return config.alipayReturnUrl;
  }

  /**
   * 清除内存缓存
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * 确保配置记录存在（不存在则创建默认配置）
   * 使用内存缓存减少数据库查询
   */
  private async ensureConfig(): Promise<PaymentConfigEntity> {
    // 检查缓存是否有效
    if (this.cache && Date.now() - this.cache.loadedAt < this.CACHE_TTL) {
      return this.cache.config;
    }

    let config = await this.configRepo.findOne({ where: { id: '1' } });
    if (!config) {
      config = this.configRepo.create({
        id: '1',
        wechatAppId: '',
        wechatAppSecret: '',
        wechatMchId: '',
        wechatPayApiV3Key: '',
        wechatPaySerialNo: '',
        wechatPayPrivateKey: null,
        wechatPayPlatformCert: null,
        wechatPayNotifyUrl: '',
        alipayAppId: '',
        alipayPrivateKey: null,
        alipayPublicKey: null,
        alipayNotifyUrl: '',
        alipayReturnUrl: '',
      });
      config = await this.configRepo.save(config);
      this.logger.log('已创建默认支付配置');
    }

    // 更新缓存
    this.cache = {
      config,
      loadedAt: Date.now(),
    };

    return config;
  }

  /**
   * 将实体转换为普通 DTO（敏感字段仅返回是否已配置）
   */
  private toDto(entity: PaymentConfigEntity): PaymentConfigVo {
    const wechatPayConfigured = Boolean(
      entity.wechatAppId &&
      entity.wechatMchId &&
      entity.wechatPayApiV3Key &&
      entity.wechatPaySerialNo &&
      entity.wechatPayPrivateKey &&
      entity.wechatPayNotifyUrl,
    );

    const alipayConfigured = Boolean(
      entity.alipayAppId &&
      entity.alipayPrivateKey &&
      entity.alipayPublicKey &&
      entity.alipayNotifyUrl,
    );

    return {
      id: entity.id,
      wechatAppId: entity.wechatAppId,
      wechatAppSecretConfigured: Boolean(entity.wechatAppSecret),
      wechatMchId: entity.wechatMchId,
      wechatPayApiV3KeyConfigured: Boolean(entity.wechatPayApiV3Key),
      wechatPaySerialNo: entity.wechatPaySerialNo,
      wechatPayPrivateKeyConfigured: Boolean(entity.wechatPayPrivateKey),
      wechatPayPlatformCertConfigured: Boolean(entity.wechatPayPlatformCert),
      wechatPayNotifyUrl: entity.wechatPayNotifyUrl,
      wechatPayConfigured: wechatPayConfigured,
      alipayAppId: entity.alipayAppId,
      alipayPrivateKeyConfigured: Boolean(entity.alipayPrivateKey),
      alipayPublicKeyConfigured: Boolean(entity.alipayPublicKey),
      alipayNotifyUrl: entity.alipayNotifyUrl,
      alipayReturnUrl: entity.alipayReturnUrl,
      alipayConfigured: alipayConfigured,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 将实体转换为详情 DTO（包含完整敏感字段）
   */
  private toDetailDto(entity: PaymentConfigEntity): PaymentConfigDetailVo {
    const wechatPayConfigured = Boolean(
      entity.wechatAppId &&
      entity.wechatMchId &&
      entity.wechatPayApiV3Key &&
      entity.wechatPaySerialNo &&
      entity.wechatPayPrivateKey &&
      entity.wechatPayNotifyUrl,
    );

    const alipayConfigured = Boolean(
      entity.alipayAppId &&
      entity.alipayPrivateKey &&
      entity.alipayPublicKey &&
      entity.alipayNotifyUrl,
    );

    return {
      id: entity.id,
      wechatAppId: entity.wechatAppId,
      wechatAppSecret: entity.wechatAppSecret,
      wechatAppSecretConfigured: Boolean(entity.wechatAppSecret),
      wechatMchId: entity.wechatMchId,
      wechatPayApiV3Key: entity.wechatPayApiV3Key,
      wechatPayApiV3KeyConfigured: Boolean(entity.wechatPayApiV3Key),
      wechatPaySerialNo: entity.wechatPaySerialNo,
      wechatPayPrivateKey: entity.wechatPayPrivateKey,
      wechatPayPrivateKeyConfigured: Boolean(entity.wechatPayPrivateKey),
      wechatPayPlatformCert: entity.wechatPayPlatformCert,
      wechatPayPlatformCertConfigured: Boolean(entity.wechatPayPlatformCert),
      wechatPayNotifyUrl: entity.wechatPayNotifyUrl,
      wechatPayConfigured: wechatPayConfigured,
      alipayAppId: entity.alipayAppId,
      alipayPrivateKey: entity.alipayPrivateKey,
      alipayPrivateKeyConfigured: Boolean(entity.alipayPrivateKey),
      alipayPublicKey: entity.alipayPublicKey,
      alipayPublicKeyConfigured: Boolean(entity.alipayPublicKey),
      alipayNotifyUrl: entity.alipayNotifyUrl,
      alipayReturnUrl: entity.alipayReturnUrl,
      alipayConfigured: alipayConfigured,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
