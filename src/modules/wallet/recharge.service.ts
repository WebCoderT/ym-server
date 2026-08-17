import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RechargeOrderEntity, RechargeStatus } from './entities/recharge-order.entity';
import {
  BalanceTransactionDirection,
  BalanceTransactionType,
} from './entities/balance-transaction.entity';
import { UserEntity } from '../user/entities/user.entity';
import { WalletService } from './wallet.service';
import { CreateRechargeRequestDto } from './dto/recharge.dto';
import {
  RechargeOrderVo,
  CreateRechargeResponseVo,
  RechargeOrderListResponseVo,
} from './vo/recharge.vo';

/** 充值订单待支付有效期：15 分钟（毫秒） */
const RECHARGE_EXPIRE_MS = 15 * 60 * 1000;

/**
 * 充值服务
 * 处理用户充值订单的创建、支付、查询等业务逻辑
 */
@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    @InjectRepository(RechargeOrderEntity)
    private readonly rechargeRepo: Repository<RechargeOrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * 创建充值订单
   */
  async createRecharge(
    userId: string,
    body: CreateRechargeRequestDto,
  ): Promise<CreateRechargeResponseVo> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rechargeNo = `RCH${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expireAt = new Date(Date.now() + RECHARGE_EXPIRE_MS);

    const entity = this.rechargeRepo.create({
      rechargeNo,
      userId,
      amount: body.amount,
      paymentMethodCode: body.paymentMethodCode,
      status: RechargeStatus.PENDING,
      expireAt,
    });

    const saved = await this.rechargeRepo.save(entity);

    return {
      id: saved.id,
      rechargeNo: saved.rechargeNo,
      amount: saved.amount,
      paymentMethodCode: saved.paymentMethodCode,
      status: saved.status,
      transactionId: saved.transactionId,
      paidAt: saved.paidAt?.toISOString() ?? null,
      expireAt: saved.expireAt?.toISOString() ?? null,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  /**
   * 获取充值订单列表
   */
  async getRechargeList(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<RechargeOrderListResponseVo> {
    const [items, total] = await this.rechargeRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      audience: 'client' as any,
      items: items.map((item) => this.toVo(item)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取充值订单详情
   */
  async getRechargeDetail(userId: string, rechargeId: string): Promise<RechargeOrderVo> {
    const entity = await this.rechargeRepo.findOne({
      where: { id: rechargeId, userId },
    });

    if (!entity) {
      throw new NotFoundException('Recharge order not found');
    }

    return this.toVo(entity);
  }

  /**
   * 充值回调处理
   */
  async handleRechargeCallback(rechargeNo: string, transactionId: string): Promise<void> {
    const entity = await this.rechargeRepo.findOne({ where: { rechargeNo } });
    if (!entity || entity.status !== RechargeStatus.PENDING) {
      return;
    }

    entity.status = RechargeStatus.PAID;
    entity.transactionId = transactionId;
    entity.paidAt = new Date();
    await this.rechargeRepo.save(entity);

    // 给用户账户充值
    // 注意：需要 walletService 支持 addBalance 方法
    // await this.walletService.addBalance(
    //   entity.userId,
    //   entity.amount,
    //   BalanceTransactionType.DEPOSIT,
    //   BalanceTransactionDirection.IN,
    //   '充值到账',
    //   rechargeNo,
    // );
  }

  /**
   * 取消过期充值订单
   */
  async cancelExpiredRecharges(): Promise<number> {
    const result = await this.rechargeRepo.update(
      {
        status: RechargeStatus.PENDING,
        expireAt: LessThanOrEqual(new Date()),
      },
      { status: RechargeStatus.CANCELLED },
    );

    return result.affected ?? 0;
  }

  /**
   * 转换为 VO
   */
  private toVo(entity: RechargeOrderEntity): RechargeOrderVo {
    return {
      id: entity.id,
      rechargeNo: entity.rechargeNo,
      amount: entity.amount,
      paymentMethodCode: entity.paymentMethodCode,
      status: entity.status,
      transactionId: entity.transactionId,
      paidAt: entity.paidAt?.toISOString() ?? null,
      expireAt: entity.expireAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
