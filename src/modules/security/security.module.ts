/**
 * 安全模块（插件）
 *
 * 负责用户登录设备与安全审计日志的实体注册及服务提供。
 * 插件化后改为 Global DynamicModule，包含自己的控制器与事件监听器。
 *
 * 通信方式：
 * - 通过 EventBus 接收用户注册/登录事件（由核心模块发布）
 * - 通过 CapabilityRegistry 注册 "security:devices" 查询能力
 * - 不引用任何核心模块或其他插件
 *
 * 通过 plugin.json 声明插件元数据，由 PluginModule 自动扫描并加载。
 */
import { DynamicModule, Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLoginDeviceEntity } from './entities/user-login-device.entity';
import { SecurityAuditLogEntity } from './entities/security-audit-log.entity';
import { SecurityService } from './security.service';
import { ClientSecurityController } from './controllers/client-security.controller';
import { SecurityEventListener } from './security-event.listener';
import { CapabilityRegistry } from '../../common/plugin/capability.registry';

/**
 * 安全模块（插件）
 *
 * 提供设备管理、安全审计日志等安全功能。
 * 通过事件总线与能力注册与核心模块通信，完全不依赖其他模块。
 */
@Global()
@Module({})
export class SecurityModule implements OnModuleInit {
  constructor(
    private readonly capabilityRegistry: CapabilityRegistry,
    private readonly securityService: SecurityService,
  ) {}

  /**
   * 模块初始化时注册查询能力
   *
   * 注册 "security:devices" 能力，供核心模块通过 CapabilityRegistry.invoke() 查询用户设备列表。
   * 当插件卸载时，该能力未注册，invoke() 返回 null，核心模块自动降级。
   */
  onModuleInit(): void {
    this.capabilityRegistry.register(
      'security:devices',
      (input: { userId: string }) => this.securityService.getDeviceList(input.userId),
    );
  }

  /**
   * 注册安全模块
   *
   * 注册实体、服务、控制器与事件监听器。
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
        SecurityEventListener,
      ],
      exports: [SecurityService],
    };
  }
}
