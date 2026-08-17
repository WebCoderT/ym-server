/**
 * 应用程序根模块
 *
 * 本模块是整个 NestJS 应用的入口模块，负责全局配置加载、数据库连接初始化、子模块聚合以及全局守卫注册。
 * 通过 imports 数组引入配置模块、TypeORM 模块以及各业务子模块；通过 providers 数组注册全局守卫。
 *
 * @module AppModule
 */

// NestJS 核心装饰器与常量，用于定义模块和注册全局守卫
import { Module } from '@nestjs/common';
// NestJS 静态文件服务模块
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
// NestJS TypeORM 模块
import { TypeOrmModule } from '@nestjs/typeorm';
// NestJS 配置模块，用于加载环境变量和自定义配置文件
import { ConfigModule } from '@nestjs/config';
// 配置服务，用于在运行时读取已加载的配置项
import { ConfigService } from '@nestjs/config';
// APP_GUARD 是 NestJS 提供的令牌，用于注册全局守卫
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// 全局访问级别守卫，控制接口的访问权限
import { AccessLevelGuard } from './access-level.guard';
// 用户状态守卫，校验客户端用户账号是否被禁用
import { UserStatusGuard } from './user-status.guard';
// 用户实体，用于用户状态守卫的数据库查询
import { UserEntity } from './modules/user/entities/user.entity';
// 后台管理模块，提供管理员相关的业务接口
import { AdminModule } from './admin/admin.module';
// 客户端模块，提供 C 端用户相关的业务接口
import { ClientModule } from './client/client.module';
// 公共模块，提供无需鉴权的公共业务接口
import { PublicModule } from './public/public.module';

// 数据库配置文件，定义 MySQL 连接参数
import { databaseConfig } from './config/database.config';
// Redis 缓存配置文件，定义缓存服务器连接参数
import { redisConfig } from './config/redis.config';
// 注意：微信配置已迁移至数据库 payment_config 表，通过管理后台维护

// 用户模块，提供用户基础信息服务
import { UserModule } from './modules/user/user.module';
import { ApiMonitorModule } from './modules/api-monitor/api-monitor.module';
import { ApiMonitorInterceptor } from './interceptors/api-monitor.interceptor';
import { RedisModule } from './modules/redis/redis.module';
import { SessionModule } from './modules/session/session.module';
import { ScheduleModule } from '@nestjs/schedule';
// 角色模块，提供角色管理与用户权限聚合
import { RoleModule } from './modules/role/role.module';
// 权限守卫，基于细粒度权限校验
import { PermissionGuard } from './permission.guard';
// 活跃账户守卫，冻结用户禁止访问资金相关接口
import { ActiveAccountGuard } from './active-account.guard';
import { NotificationModule } from './modules/notification/notification.module';
// 插件系统：全局加载所有已安装插件
import { PluginModule } from './common/plugin/plugin.module';
// 事件总线：核心模块发布领域事件，插件订阅处理
import { EventsModule } from './common/events/events.module';
// 能力注册中心：插件注册查询能力，核心模块按需调用
import { CapabilityModule } from './common/plugin/capability.module';

/**
 * AppModule 使用 @Module 装饰器声明为 NestJS 根模块
 *
 * imports: 导入其他模块，使其服务与控制器在当前模块中可用
 * providers: 注册服务提供者，此处使用 APP_GUARD 注册全局访问级别守卫
 */
@Module({
  imports: [
    // 全局配置模块，加载数据库、Redis 配置，并读取环境变量文件
    ConfigModule.forRoot({
      // 将配置模块设为全局可用，避免在每个子模块中重复导入
      isGlobal: true,
      // 加载自定义配置文件数组
      load: [databaseConfig, redisConfig],
      // 根据当前 NODE_ENV 加载对应的环境变量文件，默认使用 .env.development
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),

    // TypeORM 异步初始化模块，通过 ConfigService 动态读取数据库连接信息
    TypeOrmModule.forRootAsync({
      // 注入 ConfigService，用于获取配置项
      inject: [ConfigService],
      // 使用工厂函数返回 TypeORM 连接配置对象
      useFactory: (configService: ConfigService) => ({
        // 数据库类型为 MySQL
        type: 'mysql',
        // 从配置服务中获取数据库主机地址
        host: configService.get<string>('database.host'),
        // 从配置服务中获取数据库端口号
        port: configService.get<number>('database.port'),
        // 从配置服务中获取数据库用户名
        username: configService.get<string>('database.username'),
        // 从配置服务中获取数据库密码
        password: configService.get<string>('database.password'),
        // 从配置服务中获取数据库名称
        database: configService.get<string>('database.database'),
        // 是否根据实体自动同步数据库结构（生产环境建议关闭）
        synchronize: configService.get<boolean>('database.synchronize'),
        // 自动加载所有已注册的实体，无需手动导入
        autoLoadEntities: true,
      }),
    }),

    // 静态文件服务：提供 uploads/ 目录下文件的 HTTP 访问
    // URL /images/managed/xxx.jpg 映射到 uploads/images/managed/xxx.jpg
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveStaticOptions: {
        index: false,
      },
    }),

    // 事件总线（全局，核心模块通过 emit 发布领域事件）
    EventsModule,
    // 能力注册中心（全局，插件注册查询能力，核心模块通过 invoke 调用）
    CapabilityModule,
    // 插件系统（全局，自动扫描 src/modules/*/plugin.json 并加载所有插件）
    PluginModule.forRoot(),

    // 用户模块，提供用户相关服务与控制器
    UserModule,
    // 后台管理模块，提供管理员相关服务与控制器
    AdminModule,
    // 客户端模块，提供 C 端业务服务与控制器
    ClientModule,
    // 公共模块，提供无需鉴权的公共接口
    PublicModule,
    ApiMonitorModule,
    RedisModule,
    SessionModule,
    // 角色模块，提供角色 CRUD 与用户角色分配
    RoleModule,
    // 通知模块，提供管理端通知发布与客户端通知确认功能
    NotificationModule,
    // 定时任务模块，提供 @Interval / @Cron 等装饰器支持
    ScheduleModule.forRoot(),
    // 注册 UserEntity 的 Repository，供全局守卫使用
    TypeOrmModule.forFeature([UserEntity]),
  ],

  providers: [
    // 注册全局守卫：AccessLevelGuard
    // 该守卫会根据接口上的访问级别元数据，校验当前请求的令牌角色是否匹配
    {
      provide: APP_GUARD,
      useClass: AccessLevelGuard,
    },
    // 注册全局守卫：UserStatusGuard
    // 在 AccessLevelGuard 之后执行，校验客户端用户账号是否被禁用
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
    // 注册全局守卫：ActiveAccountGuard
    // 在 UserStatusGuard 之后执行，冻结用户禁止访问资金相关接口
    {
      provide: APP_GUARD,
      useClass: ActiveAccountGuard,
    },
    // 注册全局守卫：PermissionGuard
    // 在 AccessLevelGuard、UserStatusGuard、ActiveAccountGuard 之后执行，校验细粒度权限
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    // 注册全局 API 监控拦截器，记录所有请求到数据库
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiMonitorInterceptor,
    },
  ],
})
export class AppModule {}
