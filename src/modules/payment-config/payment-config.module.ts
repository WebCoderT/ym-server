import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentConfigEntity } from './entities/payment-config.entity';
import { PaymentConfigService } from './payment-config.service';

/**
 * 支付配置模块
 * 负责支付参数的数据库存储与服务提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentConfigEntity])],
  providers: [PaymentConfigService],
  exports: [PaymentConfigService],
})
export class PaymentConfigModule {}
