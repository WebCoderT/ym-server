import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WithdrawalRequestEntity, WithdrawalStatus } from './entities/withdrawal-request.entity';
import { BalanceTransactionEntity, BalanceTransactionDirection, BalanceTransactionType } from './entities/balance-transaction.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CreateWithdrawalRequestDto, DecideWithdrawalRequestDto } from './dto/withdrawal.dto';
import {
  WithdrawalRequestVo as WithdrawalRequestDto,
  WithdrawalRequestListResponseVo as WithdrawalRequestListResponseDto,
  AdminWithdrawalRequestVo as AdminWithdrawalRequestDto,
  AdminWithdrawalRequestListResponseVo as AdminWithdrawalRequestListResponseDto,
} from './vo/withdrawal.vo';

/**
 * 提现服务
 * 处理用户提现申请的创建、查询，以及管理端的审批/驳回
 */
@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawalRepo: Repository<WithdrawalRequestEntity>,
    @InjectRepository(BalanceTransactionEntity)
    private readonly transactionRepo: Repository<BalanceTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 创建提现申请
   *
   * 流程：
   * 1. 校验用户已绑定微信（openid 存在）
   * 2. 校验余额充足
   * 3. 冻结提现金额（扣减余额 + 记录余额变动）
   * 4. 创建提现申请记录
   */
  async createRequest(
    userId: string,
    dto: CreateWithdrawalRequestDto,
  ): Promise<WithdrawalRequestDto> {
    // 查询用户信息
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 校验已绑定微信
    if (!user.openid) {
      throw new ForbiddenException('请先绑定微信后再提现');
    }

    // 校验是否有待审核的申请（防止重复提交）
    const pendingCount = await this.withdrawalRepo.count({
      where: { userId, status: WithdrawalStatus.PENDING },
    });
    if (pendingCount > 0) {
      throw new BadRequestException('您有待审核的提现申请，请等待处理后再提交');
    }

    // 校验金额
    const amount = Number(dto.amount);
    if (amount < 1) {
      throw new BadRequestException('提现金额最少 1 元');
    }
    if (amount > 5000) {
      throw new BadRequestException('单笔提现金额最多 5000 元');
    }
    if (user.balance < amount) {
      throw new BadRequestException('余额不足');
    }

    // 原子扣减余额：WHERE balance >= amount 防止并发超扣
    const balanceBefore = Number(user.balance);
    const deductResult = await this.userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ balance: () => `balance - ${amount}` })
      .where('id = :id AND balance >= :amount', { id: userId, amount })
      .execute();

    if (deductResult.affected === 0) {
      throw new BadRequestException('余额不足');
    }
    const balanceAfter = balanceBefore - amount;

    // 记录余额变动
    const transaction = this.transactionRepo.create({
      userId,
      type: BalanceTransactionType.WITHDRAWAL,
      direction: BalanceTransactionDirection.OUT,
      amount,
      balanceBefore,
      balanceAfter,
      description: `提现至微信`,
    });
    await this.transactionRepo.save(transaction);

    // 创建提现申请
    const request = this.withdrawalRepo.create({
      userId,
      amount,
      status: WithdrawalStatus.PENDING,
      wxOpenId: user.openid,
    });
    const saved = await this.withdrawalRepo.save(request);

    this.logger.log(
      `用户 ${userId} 提交提现申请 ${saved.id}，金额 ${amount} 元`,
    );

    return this.toDto(saved);
  }

  /**
   * 查询用户的提现申请列表
   */
  async getUserRequests(
    userId: string,
    page = 1,
    pageSize = 10,
  ): Promise<WithdrawalRequestListResponseDto> {
    const [items, total] = await this.withdrawalRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      audience: 'client',
      items: items.map((i) => this.toDto(i)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 管理端：查询所有提现申请列表（支持状态过滤）
   */
  async adminListRequests(
    page = 1,
    pageSize = 20,
    status?: WithdrawalStatus,
  ): Promise<AdminWithdrawalRequestListResponseDto> {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.withdrawalRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 批量查询用户信息
    const userIds = [...new Set(items.map((i) => i.userId))];
    const users = userIds.length
      ? await this.userRepo.find({
          where: { id: In(userIds) },
          select: ['id', 'nickname', 'phone'],
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      audience: 'admin',
      items: items.map((i) => this.toAdminDto(i, userMap.get(i.userId))),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 管理端：审核通过提现申请
   */
  async adminApprove(
    requestId: string,
    adminId: string,
  ): Promise<AdminWithdrawalRequestDto> {
    const request = await this.withdrawalRepo.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('提现申请不存在');
    }
    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('该申请已处理，无法重复操作');
    }

    // 原子抢占审批（CAS：仅 PENDING → APPROVED）
    const claimResult = await this.withdrawalRepo
      .createQueryBuilder()
      .update(WithdrawalRequestEntity)
      .set({
        status: WithdrawalStatus.APPROVED,
        processedBy: adminId,
        processedAt: new Date(),
      })
      .where('id = :id AND status = :status', {
        id: requestId,
        status: WithdrawalStatus.PENDING,
      })
      .execute();

    if (claimResult.affected === 0) {
      throw new BadRequestException('该申请已被并发处理，请刷新后重试');
    }

    request.status = WithdrawalStatus.APPROVED;
    request.processedBy = adminId;
    request.processedAt = new Date();

    this.logger.log(
      `管理员 ${adminId} 通过提现申请 ${requestId}，金额 ${request.amount} 元`,
    );

    const user = await this.userRepo.findOne({
      where: { id: request.userId },
      select: ['id', 'nickname', 'phone'],
    });
    return this.toAdminDto(request, user);
  }

  /**
   * 管理端：驳回提现申请（退回冻结金额）
   */
  async adminReject(
    requestId: string,
    adminId: string,
    rejectReason?: string,
  ): Promise<AdminWithdrawalRequestDto> {
    const request = await this.withdrawalRepo.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('提现申请不存在');
    }
    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('该申请已处理，无法重复操作');
    }

    // 原子抢占审批（CAS：仅 PENDING → REJECTED），先占位再退款
    const claimResult = await this.withdrawalRepo
      .createQueryBuilder()
      .update(WithdrawalRequestEntity)
      .set({
        status: WithdrawalStatus.REJECTED,
        rejectReason: rejectReason ?? null,
        processedBy: adminId,
        processedAt: new Date(),
      })
      .where('id = :id AND status = :status', {
        id: requestId,
        status: WithdrawalStatus.PENDING,
      })
      .execute();

    if (claimResult.affected === 0) {
      throw new BadRequestException('该申请已被并发处理，请刷新后重试');
    }

    // 退回冻结金额（原子操作）
    const user = await this.userRepo.findOne({
      where: { id: request.userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const amount = Number(request.amount);
    const balanceBefore = Number(user.balance);
    const balanceAfter = balanceBefore + amount;

    // 原子增加余额
    await this.userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ balance: () => `balance + ${amount}` })
      .where('id = :id', { id: request.userId })
      .execute();

    // 记录退款变动
    const transaction = this.transactionRepo.create({
      userId: request.userId,
      type: BalanceTransactionType.WITHDRAWAL_REFUND,
      direction: BalanceTransactionDirection.IN,
      amount,
      balanceBefore,
      balanceAfter,
      description: `提现驳回退回${rejectReason ? `：${rejectReason}` : ''}`,
    });
    await this.transactionRepo.save(transaction);

    // 同步内存对象（状态已由 CAS 写入数据库）
    request.status = WithdrawalStatus.REJECTED;
    request.rejectReason = rejectReason ?? null;
    request.processedBy = adminId;
    request.processedAt = new Date();

    this.logger.log(
      `管理员 ${adminId} 驳回提现申请 ${requestId}，金额 ${amount} 元已退回`,
    );

    return this.toAdminDto(request, user);
  }

  /* ───────────────────── DTO 转换 ───────────────────── */

  private toDto(entity: WithdrawalRequestEntity): WithdrawalRequestDto {
    return {
      id: entity.id,
      amount: Number(entity.amount),
      status: entity.status,
      rejectReason: entity.rejectReason,
      createdAt: entity.createdAt.toISOString(),
      processedAt: entity.processedAt?.toISOString() ?? null,
    };
  }

  private toAdminDto(
    entity: WithdrawalRequestEntity,
    user?: UserEntity | null,
  ): AdminWithdrawalRequestDto {
    return {
      id: entity.id,
      userId: entity.userId,
      userNickname: user?.nickname ?? null,
      userPhone: user?.phone ?? null,
      amount: Number(entity.amount),
      status: entity.status,
      wxOpenId: entity.wxOpenId,
      rejectReason: entity.rejectReason,
      processedBy: entity.processedBy,
      createdAt: entity.createdAt.toISOString(),
      processedAt: entity.processedAt?.toISOString() ?? null,
    };
  }
}
