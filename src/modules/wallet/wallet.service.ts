import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BalanceTransactionEntity } from './entities/balance-transaction.entity';
import {
  BalanceTransactionQueryDto,
  CreateBalanceTransactionParams,
} from './dto/wallet.dto';
import { AccessLevel } from '../../access-level.enum';
import { UserEntity } from '../user/entities/user.entity';
import {
  WalletBalanceVo as WalletBalanceDto,
  BalanceTransactionVo as BalanceTransactionDto,
  BalanceTransactionListResponseVo as BalanceTransactionListResponseDto,
} from './vo/wallet.vo';

/**
 * 钱包服务
 * 负责处理用户钱包余额查询、余额变动记录查询和创建等业务逻辑
 */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(BalanceTransactionEntity)
    private readonly txRepo: Repository<BalanceTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 获取用户钱包余额
   * @param userId 用户ID
   * @returns 钱包余额 DTO
   */
  async getBalance(userId: string): Promise<WalletBalanceDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      balance: Number(user.balance),
      totalSpending: Number(user.totalSpending),
    };
  }

  /**
   * 获取用户余额变动记录列表（分页）
   * @param userId 用户ID
   * @param query 查询参数
   * @returns 余额变动记录列表
   */
  async getTransactions(
    userId: string,
    query: BalanceTransactionQueryDto,
  ): Promise<BalanceTransactionListResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .where('tx.user_id = :userId', { userId })
      .orderBy('tx.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 按类型筛选
    if (query.type) {
      qb.andWhere('tx.type = :type', { type: query.type });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      audience: AccessLevel.CLIENT,
      items: items.map((item) => this.toTransactionDto(item)),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取单条余额变动记录详情
   * @param userId 用户ID（用于权限校验）
   * @param transactionId 变动记录ID
   * @returns 变动记录详情
   */
  async getTransactionDetail(
    userId: string,
    transactionId: string,
  ): Promise<BalanceTransactionDto> {
    const tx = await this.txRepo.findOne({
      where: { id: transactionId, userId },
    });

    if (!tx) {
      throw new NotFoundException('变动记录不存在');
    }

    return this.toTransactionDto(tx);
  }

  /**
   * 创建余额变动记录
   * 供其他服务（如订单服务、退款服务）调用
   * @param params 创建参数
   * @returns 创建的变动记录 DTO
   */
  async createTransaction(params: CreateBalanceTransactionParams): Promise<BalanceTransactionDto> {
    const tx = this.txRepo.create({
      userId: params.userId,
      type: params.type,
      direction: params.direction,
      amount: params.amount,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      description: params.description ?? null,
      orderId: params.orderId ?? null,
      transactionNo: params.transactionNo ?? null,
    });

    await this.txRepo.save(tx);
    return this.toTransactionDto(tx);
  }

  /**
   * 将实体转换为 DTO
   */
  private toTransactionDto(entity: BalanceTransactionEntity): BalanceTransactionDto {
    return {
      id: entity.id,
      type: entity.type,
      direction: entity.direction,
      amount: Number(entity.amount),
      balanceAfter: Number(entity.balanceAfter),
      balanceBefore: Number(entity.balanceBefore),
      description: entity.description,
      orderId: entity.orderId,
      transactionNo: entity.transactionNo,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
