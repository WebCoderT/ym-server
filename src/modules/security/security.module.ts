/**
 * 安全模块
 *
 * 负责用户登录设备与安全审计日志的实体注册及服务提供。
 * 插件化后改为 Global DynamicModule，包含自己的控制器，
 * 通过 forRoot() 方法注册所有组件。
 *
 * 通过 plugin.json 声明插件元数据，由 PluginModule 自动扫描并加载。
 */
import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLoginDeviceEntity } from './entities/user-login-device.entity';
import { SecurityAuditLogEntity } from './entities/security-audit-log.entity';
import { SecurityService } from './security.service';
import { ClientSecurityController } from './controllers/client-security.controller';
import { SECURITY_SERVICE } from './security.constants';

/**
 * 安全模块（插件）
 *
 * 提供设备管理、安全审计日志等安全功能。
 * 使用 @Global() 标记为全局模块，使 SecurityService 在整个应用中可注入。
 */
@Global()
@Module({})
export class SecurityModule {
  /**
   * 注册安全模块
   *
   * 注册实体、服务与控制器，并通过 SECURITY_SERVICE Token 导出服务，
   * 使核心模块可通过 @Inject(SECURITY_SERVICE) + @Optional() 实现优雅降级。
   *
   * @returns 配置完成的 DynamicModule
   */
  static forRoot(): DynamicModule {
    return {
      module: SecurityModule,
      global: true,
      imports: [
        TypeOrmModule.forFeature([UserLoginDeviceEntity, SecurityAuditLogEntity]),
      ],
      controllers: [ClientSecurityController],
      providers: [
        SecurityService,
        // 通过字符串 Token 别名导出，支持核心模块的可选注入
        { provide: SECURITY_SERVICE, useExisting: SecurityService },
      ],
      exports: [SecurityService, SECURITY_SERVICE],
    };
  }
}
