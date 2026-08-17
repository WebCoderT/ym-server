import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { WechatService } from './wechat.service';
import { RefreshTokenStore } from './refresh-token.store';
import { SystemConfigModule } from '../system-config/system-config.module';
import { RoleModule } from '../role/role.module';
import { PaymentConfigModule } from '../payment-config/payment-config.module';

/**
 * 认证模块
 * 负责用户登录、令牌刷新、登出等认证相关功能的模块聚合
 */
@Module({
  imports: [forwardRef(() => UserModule), SystemConfigModule, RoleModule, PaymentConfigModule],
  providers: [AuthService, WechatService, RefreshTokenStore],
  exports: [AuthService, WechatService],
})
export class AuthModule {}
