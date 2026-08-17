/**
 * @fileoverview 活动状态枚举预同步迁移
 *
 * 背景：
 * EventStatus 枚举从 {upcoming, ongoing, ended, cancelled} 变更为 {selling, ended, cancelled}，
 * TypeORM synchronize: true 在修改 ENUM 列定义时，如果数据库中已有旧枚举值（upcoming / ongoing）的行，
 * MySQL 会报 "Data truncated for column 'status'" 错误，导致应用启动失败。
 *
 * 解决：
 * 在 NestJS 启动（TypeORM 连接并 synchronize）之前，使用原生 MySQL 连接将旧值统一迁移为 selling，
 * 保证 TypeORM synchronize 时不会因数据不合法而失败。
 *
 * 幂等性：
 * 该迁移是幂等的——如果没有旧值数据，UPDATE 语句影响 0 行，无任何副作用，可安全每次启动都执行。
 */

import { createConnection } from 'mysql2/promise';

/**
 * 从环境变量读取数据库连接配置
 * 默认值与 database.config.ts 保持一致，确保读取同一个数据库
 */
function getDbConfig() {
  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '123456',
    database: process.env.DB_NAME ?? 'star_app',
  };
}

/**
 * 执行活动状态枚举预同步迁移
 * 将 events 表中所有 upcoming / ongoing 状态更新为 selling，
 * 使 TypeORM synchronize 修改 ENUM 定义时不会因旧值而失败
 *
 * @returns 受影响的行数（0 表示无需迁移）
 */
export async function migrateEventStatus(): Promise<number> {
  const config = getDbConfig();
  let connection;

  try {
    connection = await createConnection(config);

    // 将旧枚举值 upcoming / ongoing 统一迁移为 selling
    const [result] = await connection.execute(
      "UPDATE `events` SET `status` = 'selling' WHERE `status` IN ('upcoming', 'ongoing')",
    );

    const affectedRows = result.affectedRows ?? 0;
    return affectedRows;
  } catch (error: any) {
    // 如果 events 表不存在（全新安装），静默跳过
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return 0;
    }
    // 其他错误向上抛出，让调用方决定是否继续启动
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
