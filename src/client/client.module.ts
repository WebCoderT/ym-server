/**
 * @fileoverview 客户端模块
 * 定义客户端模块的依赖导入、控制器注册和提供者配置
 * 客户端模块聚合所有需要登录的客户端业务功能控制器
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { MemberModule } from '../modules/member/member.module';
import { MemberLevelModule } from '../modules/member-level/member-level.module';
import { ClientController } from './client.controller';
import { ClientAuthController } from './client-auth.controller';
import { ClientUserController } from './client-user.controller';
import { ClientMemberController } from './client-member.controller';
import { ClientMemberLevelController } from './client-member-level.controller';
import { BannerModule } from '../modules/banner/banner.module';
import { UserModule } from '../modules/user/user.module';
import { StorageModule } from '../modules/storage/storage.module';
import { ClientStorageController } from './client-storage.controller';
import { PaymentMethodModule } from '../modules/payment-method/payment-method.module';
import { ClientPaymentMethodController } from './client-payment-method.controller';
import { WalletModule } from '../modules/wallet/wallet.module';
import { ClientWalletController } from './client-wallet.controller';
import { NotificationModule } from '../modules/notification/notification.module';
import { ClientNotificationController } from './client-notification.controller';
import { CourierCompanyModule } from '../modules/courier-company/courier-company.module';
import { ClientCourierCompanyController } from './client-courier-company.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    MemberModule,
    MemberLevelModule,
    BannerModule,
    StorageModule,
    PaymentMethodModule,
    WalletModule,
    NotificationModule,
    CourierCompanyModule,
  ],
  controllers: [
    ClientController,
    ClientAuthController,
    ClientUserController,
    ClientMemberController,
    ClientMemberLevelController,
    ClientStorageController,
    ClientPaymentMethodController,
    ClientWalletController,
    ClientNotificationController,
    ClientCourierCompanyController,
  ],
})
export class ClientModule {}
