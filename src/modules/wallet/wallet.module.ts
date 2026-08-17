import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceTransactionEntity } from './entities/balance-transaction.entity';
import { WithdrawalRequestEntity } from './entities/withdrawal-request.entity';
import { RechargeOrderEntity } from './entities/recharge-order.entity';
import { UserEntity } from '../user/entities/user.entity';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';
import { RechargeService } from './recharge.service';
import { RechargeExpiryCronService } from './recharge-expiry-cron.service';

/**
 * 钱包模块
 * 负责余额变动、提现申请、充值订单的实体注册与服务提供
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BalanceTransactionEntity,
      WithdrawalRequestEntity,
      RechargeOrderEntity,
      UserEntity,
    ]),
  ],
  providers: [
    WalletService,
    WithdrawalService,
    RechargeService,
    RechargeExpiryCronService,
  ],
  exports: [WalletService, WithdrawalService, RechargeService],
})
export class WalletModule {}
