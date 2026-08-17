import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { CreatePaymentMethodRequestDto, UpdatePaymentMethodRequestDto } from './dto/payment-method.dto';
import { PaymentMethodSummaryVo as PaymentMethodSummaryDto, PaymentMethodDetailVo as PaymentMethodDetailDto, PaymentMethodListResponseVo as PaymentMethodListResponseDto } from './vo/payment-method.vo';
import { StorageConfigService } from '../storage/storage-config.service';

/**
 * 支付方式服务
 *
 * 负责管理支付方式的增删改查与启用/停用。
 * 注意：本服务不处理支付凭证（如商户号、API 密钥等），
 * 支付凭证统一由 `PaymentConfigService` 管理。
 */
@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodRepo: Repository<PaymentMethodEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 获取支付方式列表（管理端）
   * 返回所有支付方式，按 sortOrder 升序排列
   */
  async listAdminPaymentMethods(): Promise<PaymentMethodListResponseDto> {
    const methods = await this.paymentMethodRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      items: await Promise.all(methods.map((m) => this.toSummaryDto(m))),
    };
  }

  /**
   * 获取已启用的支付方式列表（客户端）
   * 只返回 enabled=true 的支付方式，按 sortOrder 升序排列
   */
  async listClientPaymentMethods(): Promise<PaymentMethodListResponseDto> {
    const methods = await this.paymentMethodRepo.find({
      where: { enabled: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      items: await Promise.all(methods.map((m) => this.toSummaryDto(m))),
    };
  }

  /**
   * 获取支付方式详情（管理端）
   */
  async getDetail(id: string): Promise<PaymentMethodDetailDto> {
    const method = await this.paymentMethodRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`支付方式 ${id} 不存在`);
    }
    return this.toDetailDto(method);
  }

  /**
   * 创建支付方式
   */
  async create(body: CreatePaymentMethodRequestDto): Promise<PaymentMethodDetailDto> {
    // 检查 code 是否已存在
    const existing = await this.paymentMethodRepo.findOne({
      where: { code: body.code },
    });
    if (existing) {
      throw new ConflictException(`支付方式编码 "${body.code}" 已存在`);
    }

    const method = this.paymentMethodRepo.create({
      code: body.code,
      name: body.name,
      icon: this.storageConfig.normalizeFileUrl(body.icon) ?? '',
      description: body.description ?? '',
      enabled: body.enabled ?? true,
      sortOrder: body.sortOrder ?? 0,
    });

    await this.paymentMethodRepo.save(method);
    return this.toDetailDto(method);
  }

  /**
   * 更新支付方式
   */
  async update(id: string, body: UpdatePaymentMethodRequestDto): Promise<PaymentMethodDetailDto> {
    const method = await this.paymentMethodRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`支付方式 ${id} 不存在`);
    }

    if (body.name !== undefined) method.name = body.name;
    if (body.icon !== undefined) method.icon = this.storageConfig.normalizeFileUrl(body.icon) ?? '';
    if (body.description !== undefined) method.description = body.description;
    if (body.enabled !== undefined) method.enabled = body.enabled;
    if (body.sortOrder !== undefined) method.sortOrder = body.sortOrder;

    await this.paymentMethodRepo.save(method);
    return this.toDetailDto(method);
  }

  /**
   * 切换支付方式启用状态
   */
  async toggleEnabled(id: string, enabled: boolean): Promise<PaymentMethodDetailDto> {
    const method = await this.paymentMethodRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`支付方式 ${id} 不存在`);
    }

    method.enabled = enabled;
    await this.paymentMethodRepo.save(method);
    return this.toDetailDto(method);
  }

  /**
   * 删除支付方式
   */
  async delete(id: string): Promise<void> {
    const method = await this.paymentMethodRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`支付方式 ${id} 不存在`);
    }
    await this.paymentMethodRepo.remove(method);
  }

  /**
   * 校验支付方式编码是否有效且已启用
   * 用于订单/充值流程中验证用户选择的支付方式
   */
  async validatePaymentMethod(code: string): Promise<PaymentMethodEntity> {
    const method = await this.paymentMethodRepo.findOne({
      where: { code },
    });
    if (!method) {
      throw new BadRequestException(`支付方式 "${code}" 不存在`);
    }
    if (!method.enabled) {
      throw new BadRequestException(`支付方式 "${method.name}" 已停用`);
    }
    return method;
  }

  /**
   * 初始化默认支付方式
   *
   * 当 payment_methods 表为空时，自动插入微信、余额两种支付方式。
   * 仅包含展示信息（名称、图标、排序），不包含任何支付凭证。
   * 支付凭证请在管理后台「订单中心 → 支付配置」中配置。
   */
  async seedDefaults(): Promise<void> {
    const count = await this.paymentMethodRepo.count();
    if (count > 0) return;

    const defaults: Partial<PaymentMethodEntity>[] = [
      {
        code: 'wechat',
        name: '微信支付',
        icon: '',
        description: '推荐使用微信支付',
        enabled: true,
        sortOrder: 0,
      },
      {
        code: 'balance',
        name: '余额支付',
        icon: '',
        description: '使用账户余额支付',
        enabled: true,
        sortOrder: 1,
      },
    ];

    const entities = this.paymentMethodRepo.create(defaults);
    await this.paymentMethodRepo.save(entities);
  }

  /**
   * 实体转摘要 DTO
   */
  private async toSummaryDto(method: PaymentMethodEntity): Promise<PaymentMethodSummaryDto> {
    return {
      id: method.id,
      code: method.code,
      name: method.name,
      icon: await this.storageConfig.resolveFileUrl(method.icon),
      description: method.description,
      enabled: method.enabled,
      sortOrder: method.sortOrder,
      createdAt: method.createdAt.toISOString(),
    };
  }

  /**
   * 实体转详情 DTO
   */
  private async toDetailDto(method: PaymentMethodEntity): Promise<PaymentMethodDetailDto> {
    return this.toSummaryDto(method);
  }
}
