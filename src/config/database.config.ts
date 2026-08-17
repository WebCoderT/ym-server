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
 * @property host - 数据库服务器主机地址
 * @property port - 数据库服务监听端口
 * @property username - 数据库登录用户名
 * @property password - 数据库登录密码
 * @property database - 目标数据库名称
 * @property synchronize - 是否自动同步实体到数据库表结构，开发环境建议开启
 */
export const databaseConfig = registerAs('database', () => ({
  // 数据库主机地址
  host: process.env.DB_HOST,

  // 数据库端口
  // 注意：环境变量为字符串类型，需通过 Number() 转换为数值
  port: Number(process.env.DB_PORT),

  // 数据库用户名
  username: process.env.DB_USERNAME,

  // 数据库密码
  password: process.env.DB_PASSWORD,

  // 数据库名称
  database: process.env.DB_NAME,

  // 是否自动同步实体
  // 生产环境建议关闭此选项，避免意外修改表结构
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
}));
