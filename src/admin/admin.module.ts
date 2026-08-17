/**
 * 管理员模块（AdminModule）
 * 本模块是 NestJS 中管理后台相关功能的核心模块，
 * 负责整合管理员认证、用户管理、会员、内容管理、系统设置等各个子模块的控制器和服务。
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminMemberController } from './admin-member.controller';
import { AdminMemberLevelController } from './admin-member-level.controller';
import { AdminAccountEntity } from '../modules/admin/entities/admin-account.entity';
import { AdminAuthService } from '../modules/auth/admin-auth.service';
import { MemberModule } from '../modules/member/member.module';
import { MemberLevelModule } from '../modules/member-level/member-level.module';
import { ImageModule } from '../modules/image/image.module';
import { AdminImageController } from './admin-image.controller';
import { StorageModule } from '../modules/storage/storage.module';
import { AdminStorageController } from './admin-storage.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminBannerController } from './admin-banner.controller';
import { AdminSystemConfigController } from './admin-system-config.controller';
import { BannerModule } from '../modules/banner/banner.module';
import { SystemConfigModule } from '../modules/system-config/system-config.module';
import { QuickNavModule } from '../modules/quick-nav/quick-nav.module';
import { MemberTaskEntity } from '../modules/member/entities/member.entity';
import { UserEntity } from '../modules/user/entities/user.entity';
import { UserModule } from '../modules/user/user.module';
import { ImageEntity } from '../modules/image/entities/image.entity';
import { SecurityAuditLogEntity } from '../modules/security/entities/security-audit-log.entity';
import { RechargeOrderEntity } from '../modules/wallet/entities/recharge-order.entity';
import { WithdrawalRequestEntity } from '../modules/wallet/entities/withdrawal-request.entity';
import { BannerEntity } from '../modules/banner/entities/banner.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entity';
import { CourierCompanyEntity } from '../modules/courier-company/entities/courier-company.entity';
import { RegionModule } from '../modules/region/region.module';
import { AdminRegionController } from './admin-region.controller';
import { PaymentMethodModule } from '../modules/payment-method/payment-method.module';
import { AdminPaymentMethodController } from './admin-payment-method.controller';
import { ApiMonitorModule } from '../modules/api-monitor/api-monitor.module';
import { AdminApiMonitorController } from './admin-api-monitor.controller';
import { SessionModule } from '../modules/session/session.module';
import { AdminSessionController } from './admin-session.controller';
import { AdminRoleController, AdminUserRoleController } from './admin-role.controller';
import { RoleModule } from '../modules/role/role.module';
import { WalletModule } from '../modules/wallet/wallet.module';
import { AdminWithdrawalController } from './admin-withdrawal.controller';
import { PaymentTransactionModule } from '../modules/payment-transaction/payment-transaction.module';
import { AdminPaymentTransactionController } from './admin-payment-transaction.controller';
import { PaymentNotifyModule } from '../modules/payment-notify/payment-notify.module';
import { AdminPaymentNotifyController } from './admin-payment-notify.controller';
import { PaymentConfigModule } from '../modules/payment-config/payment-config.module';
import { AdminPaymentConfigController } from './admin-payment-config.controller';
import { NotificationModule } from '../modules/notification/notification.module';
import { AdminNotificationController } from './admin-notification.controller';
import { CourierCompanyModule } from '../modules/courier-company/courier-company.module';
import { AdminCourierCompanyController } from './admin-courier-company.controller';
import { RuleModule } from '../modules/rule/rule.module';

/**
 * AdminModule 模块定义
 * 通过 imports 引入各业务模块和 TypeORM 实体，
 * 通过 controllers 注册所有管理员相关的控制器，
 * 通过 providers 注册管理员认证服务。
 */
@Module({
  // 引入各业务功能模块和管理员账户实体
  imports: [
    MemberModule,
    MemberLevelModule,
    ImageModule,
    StorageModule,
    BannerModule,
    SystemConfigModule,
    QuickNavModule,
    UserModule,
    RegionModule,
    PaymentMethodModule,
    ApiMonitorModule,
    SessionModule,
    RoleModule,
    WalletModule,
    PaymentTransactionModule,
    PaymentNotifyModule,
    PaymentConfigModule,
    NotificationModule,
    CourierCompanyModule,
    RuleModule,
    TypeOrmModule.forFeature([
      AdminAccountEntity,
      MemberTaskEntity,
      UserEntity,
      ImageEntity,
      SecurityAuditLogEntity,
      RechargeOrderEntity,
      WithdrawalRequestEntity,
      BannerEntity,
      NotificationEntity,
      CourierCompanyEntity,
    ]),
  ],
  // 注册所有管理员相关的控制器，处理 HTTP 请求
  controllers: [
    AdminController,
    AdminAuthController,
    AdminMemberController,
    AdminMemberLevelController,
    AdminImageController,
    AdminStorageController,
    AdminDashboardController,
    AdminBannerController,
    AdminSystemConfigController,
    AdminRegionController,
    AdminPaymentMethodController,
    AdminApiMonitorController,
    AdminSessionController,
    AdminRoleController,
    AdminUserRoleController,
    AdminWithdrawalController,
    AdminPaymentTransactionController,
    AdminPaymentNotifyController,
    AdminPaymentConfigController,
    AdminNotificationController,
    AdminCourierCompanyController,
  ],
  // 注册管理员认证服务，提供登录验证等业务逻辑
  providers: [AdminAuthService],
})
export class AdminModule {}
