import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLoginDeviceEntity } from './entities/user-login-device.entity';
import { SecurityAuditLogEntity } from './entities/security-audit-log.entity';
import { SecurityService } from './security.service';

/**
 * 安全模块
 * 负责用户登录设备与安全审计日志的实体注册及服务提供
 */
@Module({
  // 导入 TypeORM 特性模块，注册 UserLoginDeviceEntity 与 SecurityAuditLogEntity
  imports: [
    TypeOrmModule.forFeature([UserLoginDeviceEntity, SecurityAuditLogEntity]),
  ],
  // 注册安全服务为提供者
  providers: [SecurityService],
  // 导出安全服务，供用户模块、认证模块等使用
  exports: [SecurityService],
})
export class SecurityModule {}
