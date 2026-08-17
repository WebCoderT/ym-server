import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentNotifyEntity } from './entities/payment-notify.entity';
import { PaymentNotifyService } from './payment-notify.service';

/**
 * 支付回调记录模块
 * 负责支付回调记录的实体注册与服务提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentNotifyEntity])],
  providers: [PaymentNotifyService],
  exports: [PaymentNotifyService],
})
export class PaymentNotifyModule {}
