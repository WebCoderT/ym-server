/**
 * 应用程序入口文件
 *
 * 本文件是 NestJS 应用的启动入口，负责创建应用实例、注册全局管道、配置 Swagger 文档以及启动 HTTP 服务。
 * 所有启动前的初始化逻辑（如全局中间件、异常过滤器、拦截器等）均可在此文件中扩展。
 *
 * @module main
 */

// Node.js 文件系统模块，用于读取 HTTPS 证书与私钥文件
import { readFileSync } from 'fs';
// Node.js 路径模块，用于将环境变量中的相对路径解析为绝对路径
import { resolve } from 'path';
// NestJS 全局验证管道，用于自动校验和转换请求数据
import { ValidationPipe } from '@nestjs/common';
// NestJS 应用工厂，用于创建 Nest 应用实例
import { NestFactory } from '@nestjs/core';
// NestJS Express 平台接口，用于配置 raw body 等 Express 特有选项
import type { NestExpressApplication } from '@nestjs/platform-express';
// 应用程序根模块
import { AppModule } from './app.module';
// 应用配置函数，负责注册 Swagger 文档等附加配置
import { configureApplication } from './configure-app';
// 全局异常过滤器，统一格式化所有异常响应
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
// 全局日志拦截器，统一记录请求进入和响应返回
import { LoggingInterceptor } from './interceptors/logging.interceptor';
// 预同步数据迁移：活动状态枚举迁移（需在 TypeORM synchronize 之前执行）
import { migrateEventStatus } from './migrations/event-status.migration';

/**
 * 启动 NestJS 应用的异步引导函数
 *
 * 该函数按照以下顺序执行启动流程：
 * 1. 使用 NestFactory 创建基于 AppModule 的应用实例（根据环境变量决定是否启用 HTTPS）
 * 2. 注册全局 ValidationPipe，对入参进行白名单校验与自动转换
 * 3. 调用 configureApplication 配置 Swagger 文档
 * 4. 监听环境变量 PORT 指定的端口（默认 3000）
 *
 * HTTPS 启用规则：
 * - 当环境变量 HTTPS_ENABLE=true 时启用 HTTPS
 * - HTTPS_KEY_PATH 与 HTTPS_CERT_PATH 分别指向私钥和证书文件
 * - 若未启用 HTTPS，则回退到普通 HTTP 服务
 */
async function bootstrap() {
  // ── 预同步数据迁移 ──
  // 在 TypeORM synchronize 修改表结构之前，先迁移不兼容的旧枚举值，
  // 避免 "Data truncated for column" 导致启动失败
  try {
    const migrated = await migrateEventStatus();
    if (migrated > 0) {
      console.log(`[migration] 已将 ${migrated} 条活动的旧状态(upcoming/ongoing)迁移为 selling`);
    }
  } catch (err: any) {
    // 迁移失败不阻塞启动（例如开发环境无数据库时），仅打印警告
    console.warn(`[migration] 活动状态预迁移跳过：${err}`);
  }

  // 根据环境变量判断是否启用 HTTPS
  const httpsEnable = process.env.HTTPS_ENABLE === 'true';
  let app: NestExpressApplication;

  // 公共创建选项：启用 rawBody 以支持微信支付回调查验签名
  // rawBody 会在每个请求上附加 req.rawBody（Buffer），用于回调的 RSA 签名验证
  const commonOptions = { rawBody: true };

  if (httpsEnable) {
    // HTTPS 模式：从环境变量读取私钥与证书文件路径，构造 httpsOptions 传给底层 Node HTTPS 服务器
    const keyPath = process.env.HTTPS_KEY_PATH;
    const certPath = process.env.HTTPS_CERT_PATH;
    if (!keyPath || !certPath) {
      throw new Error('启用 HTTPS 时必须配置 HTTPS_KEY_PATH 和 HTTPS_CERT_PATH 环境变量');
    }
    const httpsOptions = {
      key: readFileSync(resolve(keyPath)),
      cert: readFileSync(resolve(certPath)),
    };
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      ...commonOptions,
      httpsOptions,
    });
  } else {
    // HTTP 模式：使用默认配置创建应用实例
    app = await NestFactory.create<NestExpressApplication>(AppModule, commonOptions);
  }

  // 注册全局验证管道，确保所有入站请求的数据格式符合 DTO 定义
  app.useGlobalPipes(
    new ValidationPipe({
      // 白名单模式：自动剔除 DTO 中未定义的属性，防止非法字段注入
      whitelist: true,
      // 自动将请求数据转换为 DTO 实例的类型（如字符串转数字）
      transform: true,
      // 当请求中包含 DTO 未定义的属性时，是否抛出异常（false 表示仅剔除不报错）
      forbidNonWhitelisted: false,
    }),
  );

  // 注册全局异常过滤器，捕获所有未处理异常并返回标准化错误响应
  app.useGlobalFilters(new AllExceptionsFilter());

  // 注册全局日志拦截器，统一记录请求进入和响应返回
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 启动服务器，监听指定端口；若未配置 PORT 环境变量，则默认监听 3000 端口
  // 根据 HTTPS_ENABLE 环境变量决定使用 HTTPS 或 HTTP 协议
  const port = process.env.PORT ?? 3000;
  const protocol = httpsEnable ? 'https' : 'http';
  await app.listen(port);
  // 打印启动日志
  console.log(`服务已启动：${protocol}://localhost:${port}`);

  // 配置 Swagger API 文档、全局中间件等附加功能
  configureApplication(app);
}

// 执行启动函数，开始监听请求
bootstrap();
