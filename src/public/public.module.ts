/**
 * 公共模块（PublicModule）
 * 负责注册并暴露面向公众的接口控制器及相关依赖模块
 * 该模块下的接口无需登录即可访问
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { PublicController } from './public.controller';
import { PublicAuthController } from './public-auth.controller';
import { SystemConfigModule } from '../modules/system-config/system-config.module';
import { QuickNavModule } from '../modules/quick-nav/quick-nav.module';
import { PublicSystemConfigController } from './public-system-config.controller';
import { RegionModule } from '../modules/region/region.module';
import { PublicRegionController } from './public-region.controller';
import { BannerModule } from '../modules/banner/banner.module';
import { PublicBannerController } from './public-banner.controller';
import { PublicSearchController } from './public-search.controller';
import { PaymentMethodModule } from '../modules/payment-method/payment-method.module';
import { PublicPaymentMethodController } from './public-payment-method.controller';
import { WalletModule } from '../modules/wallet/wallet.module';
import { PaymentNotifyModule } from '../modules/payment-notify/payment-notify.module';
import { RuleModule } from '../modules/rule/rule.module';
import { PublicRuleController } from './public-rule.controller';

@Module({
  imports: [
    AuthModule,
    SystemConfigModule,
    QuickNavModule,
    RegionModule,
    BannerModule,
    PaymentMethodModule,
    WalletModule,
    PaymentNotifyModule,
    RuleModule,
  ],
  controllers: [
    PublicController,
    PublicAuthController,
    PublicSystemConfigController,
    PublicRegionController,
    PublicBannerController,
    PublicSearchController,
    PublicPaymentMethodController,
    PublicRuleController,
  ],
})
export class PublicModule {}
