import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentNotifyEntity,
  PaymentNotifyStatus,
} from './entities/payment-notify.entity';
import {
  PaymentNotifyDto,
  PaymentNotifyListResponseDto,
  PaymentNotifyQueryDto,
} from './dto/payment-notify.dto';

/**
 * 支付回调记录服务
 * 负责记录和管理支付回调通知
 */
@Injectable()
export class PaymentNotifyService {
  private readonly logger = new Logger(PaymentNotifyService.name);

  constructor(
    @InjectRepository(PaymentNotifyEntity)
    private readonly paymentNotifyRepo: Repository<PaymentNotifyEntity>,
  ) {}

  /**
   * 记录支付回调
   */
  async recordNotify(params: {
    transactionId?: string;
    paymentMethodCode: string;
    provider: string;
    bizType: string;
    bizNo: string;
    rawHeaders?: Record<string, any>;
    rawBody: string;
    decryptedData?: Record<string, any>;
  }): Promise<PaymentNotifyEntity> {
    const entity = this.paymentNotifyRepo.create({
      transactionId: params.transactionId || null,
      paymentMethodCode: params.paymentMethodCode,
      provider: params.provider,
      bizType: params.bizType,
      bizNo: params.bizNo,
      rawHeaders: params.rawHeaders || null,
      rawBody: params.rawBody,
      decryptedData: params.decryptedData || null,
      status: PaymentNotifyStatus.PENDING,
      retryCount: 0,
    });

    const saved = await this.paymentNotifyRepo.save(entity);

    this.logger.log(
      `记录支付回调：id=${saved.id}, provider=${params.provider}, bizType=${params.bizType}, bizNo=${params.bizNo}`,
    );

    return saved;
  }

  /**
   * 标记回调处理成功
   */
  async markSuccess(id: string, resultMessage?: string): Promise<void> {
    const notify = await this.paymentNotifyRepo.findOne({ where: { id } });

    if (!notify) {
      throw new NotFoundException(`支付回调记录不存在：${id}`);
    }

    notify.status = PaymentNotifyStatus.SUCCESS;
    notify.resultMessage = resultMessage || '处理成功';
    notify.processedAt = new Date();

    await this.paymentNotifyRepo.save(notify);

    this.logger.log(`支付回调标记为成功：id=${id}, bizNo=${notify.bizNo}`);
  }

  /**
   * 标记回调处理失败
   */
  async markFailed(id: string, resultMessage: string): Promise<void> {
    const notify = await this.paymentNotifyRepo.findOne({ where: { id } });

    if (!notify) {
      throw new NotFoundException(`支付回调记录不存在：${id}`);
    }

    notify.status = PaymentNotifyStatus.FAILED;
    notify.resultMessage = resultMessage;
    notify.retryCount += 1;

    await this.paymentNotifyRepo.save(notify);

    this.logger.warn(
      `支付回调标记为失败：id=${id}, bizNo=${notify.bizNo}, retryCount=${notify.retryCount}, reason=${resultMessage}`,
    );
  }

  /**
   * 标记回调已忽略（重复回调等）
   */
  async markIgnored(id: string, resultMessage: string): Promise<void> {
    const notify = await this.paymentNotifyRepo.findOne({ where: { id } });

    if (!notify) {
      throw new NotFoundException(`支付回调记录不存在：${id}`);
    }

    notify.status = PaymentNotifyStatus.IGNORED;
    notify.resultMessage = resultMessage;
    notify.processedAt = new Date();

    await this.paymentNotifyRepo.save(notify);

    this.logger.log(`支付回调已忽略：id=${id}, bizNo=${notify.bizNo}, reason=${resultMessage}`);
  }

  /**
   * 管理员查询支付回调记录列表
   */
  async adminList(query: PaymentNotifyQueryDto): Promise<PaymentNotifyListResponseDto> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;

    const qb = this.paymentNotifyRepo.createQueryBuilder('n');

    if (query.paymentMethodCode) {
      qb.andWhere('n.paymentMethodCode = :paymentMethodCode', {
        paymentMethodCode: query.paymentMethodCode,
      });
    }

    if (query.provider) {
      qb.andWhere('n.provider = :provider', { provider: query.provider });
    }

    if (query.bizType) {
      qb.andWhere('n.bizType = :bizType', { bizType: query.bizType });
    }

    if (query.bizNo) {
      qb.andWhere('n.bizNo = :bizNo', { bizNo: query.bizNo });
    }

    if (query.status) {
      qb.andWhere('n.status = :status', { status: query.status });
    }

    qb.orderBy('n.createdAt', 'DESC');

    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      items: items.map((item) => this.toDto(item)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 管理员查询支付回调记录详情
   */
  async adminGetDetail(id: string): Promise<PaymentNotifyDto> {
    const notify = await this.paymentNotifyRepo.findOne({ where: { id } });

    if (!notify) {
      throw new NotFoundException(`支付回调记录不存在：${id}`);
    }

    return this.toDto(notify);
  }

  /**
   * 实体转 DTO
   */
  private toDto(entity: PaymentNotifyEntity): PaymentNotifyDto {
    return {
      id: entity.id,
      transactionId: entity.transactionId,
      paymentMethodCode: entity.paymentMethodCode,
      provider: entity.provider,
      bizType: entity.bizType,
      bizNo: entity.bizNo,
      rawHeaders: entity.rawHeaders,
      rawBody: entity.rawBody,
      decryptedData: entity.decryptedData,
      status: entity.status,
      resultMessage: entity.resultMessage,
      retryCount: entity.retryCount,
      processedAt: entity.processedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
