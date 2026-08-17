import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAuth } from '../current-auth.decorator';
import type { AuthTokenPayload } from '../auth-token';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { WalletService } from '../modules/wallet/wallet.service';
import { WithdrawalService } from '../modules/wallet/withdrawal.service';
import { RechargeService } from '../modules/wallet/recharge.service';
// 请求 DTO
import {
  BalanceTransactionQueryDto,
} from '../modules/wallet/dto/wallet.dto';
// 响应 VO
import {
  BalanceTransactionVo,
  BalanceTransactionListResponseVo,
  WalletBalanceVo,
} from '../modules/wallet/vo/wallet.vo';
import {
  CreateWithdrawalRequestDto,
} from '../modules/wallet/dto/withdrawal.dto';
import {
  WithdrawalRequestVo,
  WithdrawalRequestListResponseVo,
} from '../modules/wallet/vo/withdrawal.vo';
import {
  CreateRechargeRequestDto,
} from '../modules/wallet/dto/recharge.dto';
import {
  CreateRechargeResponseVo,
  RechargeOrderListResponseVo,
} from '../modules/wallet/vo/recharge.vo';

/**
 * 客户端钱包控制器
 * 提供钱包余额查询、余额变动记录查询等功能
 */
@ApiTags('client-wallet')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/wallet')
export class ClientWalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly withdrawalService: WithdrawalService,
    private readonly rechargeService: RechargeService,
  ) {}

  /**
   * 获取当前用户钱包余额
   */
  @Get('balance')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiOkResponse({ type: WalletBalanceVo })
  async getBalance(@CurrentAuth() auth: AuthTokenPayload): Promise<WalletBalanceVo> {
    return this.walletService.getBalance(auth.sub);
  }

  /**
   * 获取当前用户余额变动记录列表（分页）
   */
  @Get('transactions')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'Get current user balance transaction list' })
  @ApiOkResponse({ type: BalanceTransactionListResponseVo })
  async getTransactions(
    @CurrentAuth() auth: AuthTokenPayload,
    @Query() query: BalanceTransactionQueryDto,
  ): Promise<BalanceTransactionListResponseVo> {
    return this.walletService.getTransactions(auth.sub, query);
  }

  /**
   * 获取单条余额变动记录详情
   */
  @Get('transactions/:id')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'Get balance transaction detail' })
  @ApiOkResponse({ type: BalanceTransactionVo })
  async getTransactionDetail(
    @CurrentAuth() auth: AuthTokenPayload,
    @Param('id') id: string,
  ): Promise<BalanceTransactionVo> {
    return this.walletService.getTransactionDetail(auth.sub, id);
  }

  /**
   * 提交提现申请
   * 提现只能到账号绑定的微信，提交时冻结对应金额，审核通过后打款，驳回则退回
   */
  @Post('withdraw')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'Submit a withdrawal request (to bound WeChat)' })
  @ApiCreatedResponse({ type: WithdrawalRequestVo })
  async createWithdrawal(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: CreateWithdrawalRequestDto,
  ): Promise<WithdrawalRequestVo> {
    return this.withdrawalService.createRequest(auth.sub, body);
  }

  /**
   * 查询当前用户的提现申请列表
   */
  @Get('withdrawals')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'List current user withdrawal requests' })
  @ApiOkResponse({ type: WithdrawalRequestListResponseVo })
  async getWithdrawals(
    @CurrentAuth() auth: AuthTokenPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<WithdrawalRequestListResponseVo> {
    return this.withdrawalService.getUserRequests(
      auth.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  /**
   * 创建充值订单
   * 余额支付：直接完成充值。
   * 微信支付：返回预支付参数（wxPayParams），客户端使用其调用 wx.requestPayment()。
   */
  @Post('recharge')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'Create a recharge order' })
  @ApiCreatedResponse({ type: CreateRechargeResponseVo })
  async createRecharge(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: CreateRechargeRequestDto,
  ): Promise<CreateRechargeResponseVo> {
    return this.rechargeService.createRecharge(auth.sub, body);
  }

  /**
   * 查询当前用户的充值订单列表
   */
  @Get('recharges')
  @RequirePermission(Permission.CLIENT_WALLET)
  @ApiOperation({ summary: 'List current user recharge orders' })
  @ApiOkResponse({ type: RechargeOrderListResponseVo })
  async getRecharges(
    @CurrentAuth() auth: AuthTokenPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<RechargeOrderListResponseVo> {
    return this.rechargeService.getRechargeList(
      auth.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }
}
