/**
 * @fileoverview 数据库配置模块
 * 负责从环境变量中读取数据库连接参数，并以 NestJS 配置工厂的形式提供给 TypeORM 使用。
 */

import { registerAs } from '@nestjs/config';

/**
 * 数据库配置工厂
 * 使用 NestJS 的 registerAs 注册为命名空间配置，配置键为 'database'。
 *
 * @description
 * 该配置对象包含 MySQL 数据库的连接信息，所有字段均支持通过环境变量覆盖，
 * 若环境变量未设置则使用默认值，确保开发环境开箱即用。
 *
 * @property host - 数据库服务器主机地址，默认本地回环地址
 * @property port - 数据库服务监听端口，默认 MySQL 标准端口 3306
 * @property username - 数据库登录用户名，默认 root
 * @property password - 数据库登录密码，默认 123456
 * @property database - 目标数据库名称，默认 star_app
 * @property synchronize - 是否自动同步实体到数据库表结构，开发环境建议开启
 */
export const databaseConfig = registerAs('database', () => ({
  // 数据库主机地址：优先读取环境变量 DB_HOST，未设置时使用本地回环地址
  host: process.env.DB_HOST ?? '127.0.0.1',

  // 数据库端口：优先读取环境变量 DB_PORT，未设置时使用 MySQL 默认端口 3306
  // 注意：环境变量为字符串类型，需通过 Number() 转换为数值
  port: Number(process.env.DB_PORT ?? 3306),

  // 数据库用户名：优先读取环境变量 DB_USERNAME，未设置时使用 root
  username: process.env.DB_USERNAME ?? 'root',

  // 数据库密码：优先读取环境变量 DB_PASSWORD，未设置时使用默认密码 123456
  password: process.env.DB_PASSWORD ?? '123456',

  // 数据库名称：优先读取环境变量 DB_NAME，未设置时使用默认库名 star_app
  database: process.env.DB_NAME ?? 'default',

  // 是否自动同步实体：优先读取环境变量 DB_SYNCHRONIZE，未设置时默认启用同步
  // 生产环境建议关闭此选项，避免意外修改表结构
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
}));
