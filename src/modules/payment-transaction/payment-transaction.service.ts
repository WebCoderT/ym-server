import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentTransactionEntity,
  PaymentTransactionStatus,
  PaymentBizType,
} from './entities/payment-transaction.entity';
import { PaymentTransactionQueryDto } from './dto/payment-transaction.dto';
import { PaymentTransactionVo, PaymentTransactionListResponseVo } from './vo/payment-transaction.vo';

/**
 * 支付流水服务
 * 负责创建、查询、更新支付流水
 */
@Injectable()
export class PaymentTransactionService {
  private readonly logger = new Logger(PaymentTransactionService.name);

  constructor(
    @InjectRepository(PaymentTransactionEntity)
    private readonly paymentTransactionRepo: Repository<PaymentTransactionEntity>,
  ) {}

  /**
   * 创建支付流水
   */
  async createTransaction(params: {
    paymentMethodCode: string;
    bizType: PaymentBizType;
    bizNo: string;
    userId: string;
    amount: number; // 单位：分
    title: string;
    extra?: Record<string, any>;
  }): Promise<PaymentTransactionEntity> {
    const transactionNo = this.generateTransactionNo();

    const entity = this.paymentTransactionRepo.create({
      transactionNo,
      paymentMethodCode: params.paymentMethodCode,
      bizType: params.bizType,
      bizNo: params.bizNo,
      userId: params.userId,
      amount: params.amount,
      status: PaymentTransactionStatus.PENDING,
      title: params.title,
      extra: params.extra || null,
    });

    const saved = await this.paymentTransactionRepo.save(entity);

    this.logger.log(
      `创建支付流水：transactionNo=${transactionNo}, bizType=${params.bizType}, bizNo=${params.bizNo}, amount=${params.amount}分`,
    );

    return saved;
  }

  /**
   * 标记支付成功
   */
  async markSuccess(
    transactionNo: string,
    thirdPartyTransactionId: string,
  ): Promise<PaymentTransactionEntity> {
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { transactionNo },
    });

    if (!transaction) {
      throw new NotFoundException(`支付流水不存在：${transactionNo}`);
    }

    if (transaction.status === PaymentTransactionStatus.SUCCESS) {
      this.logger.warn(`支付流水已标记为成功：${transactionNo}`);
      return transaction;
    }

    transaction.status = PaymentTransactionStatus.SUCCESS;
    transaction.thirdPartyTransactionId = thirdPartyTransactionId;
    transaction.paidAt = new Date();

    await this.paymentTransactionRepo.save(transaction);

    this.logger.log(
      `支付流水标记为成功：transactionNo=${transactionNo}, thirdPartyTransactionId=${thirdPartyTransactionId}`,
    );

    return transaction;
  }

  /**
   * 标记支付失败
   */
  async markFailed(
    transactionNo: string,
    reason?: string,
  ): Promise<PaymentTransactionEntity> {
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { transactionNo },
    });

    if (!transaction) {
      throw new NotFoundException(`支付流水不存在：${transactionNo}`);
    }

    if (transaction.status === PaymentTransactionStatus.SUCCESS) {
      throw new Error('已成功支付的流水不能标记为失败');
    }

    transaction.status = PaymentTransactionStatus.FAILED;
    transaction.failedAt = new Date();

    if (reason && transaction.extra) {
      transaction.extra = { ...transaction.extra, failReason: reason };
    } else if (reason) {
      transaction.extra = { failReason: reason };
    }

    await this.paymentTransactionRepo.save(transaction);

    this.logger.warn(`支付流水标记为失败：transactionNo=${transactionNo}, reason=${reason}`);

    return transaction;
  }

  /**
   * 关闭支付流水（超时未支付）
   */
  async markClosed(transactionNo: string): Promise<void> {
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { transactionNo },
    });

    if (!transaction) {
      return;
    }

    if (transaction.status === PaymentTransactionStatus.PENDING) {
      transaction.status = PaymentTransactionStatus.CLOSED;
      await this.paymentTransactionRepo.save(transaction);

      this.logger.log(`支付流水已关闭：transactionNo=${transactionNo}`);
    }
  }

  /**
   * 根据业务单号查询支付流水
   */
  async findByBizNo(bizNo: string): Promise<PaymentTransactionEntity | null> {
    return this.paymentTransactionRepo.findOne({
      where: { bizNo },
    });
  }

  /**
   * 根据流水号查询支付流水
   */
  async findByTransactionNo(
    transactionNo: string,
  ): Promise<PaymentTransactionEntity | null> {
    return this.paymentTransactionRepo.findOne({
      where: { transactionNo },
    });
  }

  /**
   * 管理员查询支付流水列表
   */
  async adminList(
    query: PaymentTransactionQueryDto,
  ): Promise<PaymentTransactionListResponseVo> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;

    const qb = this.paymentTransactionRepo.createQueryBuilder('t');

    if (query.paymentMethodCode) {
      qb.andWhere('t.paymentMethodCode = :paymentMethodCode', {
        paymentMethodCode: query.paymentMethodCode,
      });
    }

    if (query.bizType) {
      qb.andWhere('t.bizType = :bizType', { bizType: query.bizType });
    }

    if (query.bizNo) {
      qb.andWhere('t.bizNo = :bizNo', { bizNo: query.bizNo });
    }

    if (query.userId) {
      qb.andWhere('t.userId = :userId', { userId: query.userId });
    }

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }

    qb.orderBy('t.createdAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.toDto(item)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 管理员查询支付流水详情
   */
  async adminGetDetail(id: string): Promise<PaymentTransactionVo> {
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`支付流水不存在：${id}`);
    }

    return this.toDto(transaction);
  }

  /**
   * 生成支付流水号
   * 格式：PAY + 年月日时分秒 + 4位随机数
   */
  private generateTransactionNo(): string {
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `PAY${dateStr}${random}`;
  }

  /**
   * 实体转 DTO
   */
  private toDto(entity: PaymentTransactionEntity): PaymentTransactionVo {
    return {
      id: entity.id,
      transactionNo: entity.transactionNo,
      thirdPartyTransactionId: entity.thirdPartyTransactionId,
      paymentMethodCode: entity.paymentMethodCode,
      bizType: entity.bizType,
      bizNo: entity.bizNo,
      userId: entity.userId,
      amount: entity.amount,
      status: entity.status,
      title: entity.title,
      extra: entity.extra,
      paidAt: entity.paidAt?.toISOString() ?? null,
      failedAt: entity.failedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
