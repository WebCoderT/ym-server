import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentTransactionService } from './payment-transaction.service';

/**
 * 支付流水模块
 * 负责支付流水的实体注册与服务提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransactionEntity])],
  providers: [PaymentTransactionService],
  exports: [PaymentTransactionService],
})
export class PaymentTransactionModule {}
