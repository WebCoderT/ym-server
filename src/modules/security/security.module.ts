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
 * 注意：此模块不使用构造器参数属性（private readonly xxx），
 * 因为 PluginScanner 通过 await import() 加载插件时，
 * Node.js 22 的原生 TypeScript strip 模式不支持参数属性语法。
 * 能力注册改为通过 provider factory 实现，避免实例级 DI。
 *
 * 通过 plugin.json 声明插件元数据，由 PluginModule 自动扫描并加载。
 */
import { DynamicModule, Global, Module } from '@nestjs/common';
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
 *
 * 能力注册通过 SECURITY_CAPABILITY_INITIALIZER provider 实现：
 * 该 provider 在应用启动时注入 CapabilityRegistry 和 SecurityService，
 * 将 "security:devices" 查询能力注册到全局注册中心。
 */
@Global()
@Module({})
export class SecurityModule {
  /**
   * 注册安全模块
   *
   * 注册实体、服务、控制器与事件监听器。
   * 通过 SECURITY_CAPABILITY_INITIALIZER provider 工厂函数，
   * 在应用启动时将 "security:devices" 能力注册到 CapabilityRegistry。
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
        // 能力初始化器：在应用启动时注册 "security:devices" 查询能力
        // 使用工厂函数注入依赖，避免模块类使用参数属性语法
        {
          provide: 'SECURITY_CAPABILITY_INITIALIZER',
          inject: [CapabilityRegistry, SecurityService],
          useFactory: (registry: CapabilityRegistry, service: SecurityService) => {
            registry.register(
              'security:devices',
              (input: { userId: string }) => service.getDeviceList(input.userId),
            );
            return true;
          },
        },
      ],
      exports: [SecurityService],
    };
  }
}
