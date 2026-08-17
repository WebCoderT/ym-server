/**
 * @fileoverview Redis 缓存配置模块
 * 负责从环境变量中读取 Redis 连接参数，并以 NestJS 命名空间配置的形式提供给缓存模块使用。
 */

import { registerAs } from '@nestjs/config';

/**
 * Redis 配置工厂
 * 使用 NestJS 的 registerAs 注册为命名空间配置，配置键为 'redis'。
 *
 * @description
 * 该配置对象包含 Redis 服务器的连接信息，所有字段均支持通过环境变量覆盖，
 * 若环境变量未设置则使用默认值，适用于本地开发环境快速启动。
 *
 * @property host - Redis 服务器主机地址
 * @property port - Redis 服务监听端口
 * @property password - Redis 认证密码
 * @property db - Redis 逻辑数据库编号
 */
export const redisConfig = registerAs('redis', () => ({
  // Redis 服务器主机地址
  host: process.env.REDIS_HOST,

  // Redis 服务端口
  // 注意：环境变量为字符串类型，需通过 Number() 转换为数值
  port: Number(process.env.REDIS_PORT),

  // Redis 认证密码
  password: process.env.REDIS_PASSWORD,

  // Redis 逻辑数据库编号
  // 通过编号切换可实现不同业务数据的隔离存储
  db: Number(process.env.REDIS_DB),
}));
