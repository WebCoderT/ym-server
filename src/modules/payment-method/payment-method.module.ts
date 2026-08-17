import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { PaymentMethodService } from './payment-method.service';

/**
 * 支付方式模块
 * 注册支付方式实体和服务，支撑管理端和客户端的支付方式管理功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethodEntity]), StorageModule],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule implements OnModuleInit {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async onModuleInit() {
    await this.paymentMethodService.seedDefaults();
  }
}
