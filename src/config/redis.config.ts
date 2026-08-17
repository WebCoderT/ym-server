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
 * @property host - Redis 服务器主机地址，默认本地回环地址
 * @property port - Redis 服务监听端口，默认 Redis 标准端口 6379
 * @property password - Redis 认证密码，默认空字符串表示无密码
 * @property db - Redis 逻辑数据库编号，默认使用 0 号库
 */
export const redisConfig = registerAs('redis', () => ({
  // Redis 服务器主机地址：优先读取环境变量 REDIS_HOST，未设置时使用本地回环地址 127.0.0.1
  host: process.env.REDIS_HOST ?? '192.168.1.103',

  // Redis 服务端口：优先读取环境变量 REDIS_PORT，未设置时使用 Redis 默认端口 6379
  // 注意：环境变量为字符串类型，需通过 Number() 转换为数值
  port: Number(process.env.REDIS_PORT ?? 6379),

  // Redis 认证密码：优先读取环境变量 REDIS_PASSWORD，未设置时默认为空字符串（无密码）
  password: process.env.REDIS_PASSWORD ?? '123456',

  // Redis 逻辑数据库编号：优先读取环境变量 REDIS_DB，未设置时使用 0 号数据库
  // 通过编号切换可实现不同业务数据的隔离存储
  db: Number(process.env.REDIS_DB ?? 9),
}));
