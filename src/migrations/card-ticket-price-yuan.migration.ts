/**
 * @fileoverview 卡券销售方案价格单位迁移：分 → 元
 *
 * 背景：
 * card_ticket_plans.price 原先以"分"为单位（int），现改为以"元"为单位（decimal(10,2)）。
 * 存量数据需要将原值除以 100 转换为元。
 *
 * 时机：
 * 必须在 NestJS 启动、TypeORM synchronize 完成之后执行，
 * 此时列类型已由 int 变为 decimal(10,2)，除法才能得到精确的小数结果。
 *
 * 幂等性：
 * 通过列类型判断是否已迁移：
 * - 列仍为 int → 说明 migrateCardTicketPriceUnit 尚未完成或 synchronize 未生效，跳过
 * - 列已为 decimal → 检查是否有 >= 100 的值（即"分"单位的残留），有则执行迁移
 * - 所有值均 < 100 → 说明已迁移完成，跳过
 */

import { createConnection } from 'mysql2/promise';

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
 * 将 card_ticket_plans 表中的价格从"分"转换为"元"（除以 100）
 *
 * @returns 受影响的行数（0 表示无需迁移或尚未满足执行条件）
 */
export async function migrateCardTicketPriceUnit(): Promise<number> {
  const config = getDbConfig();
  let connection;

  try {
    connection = await createConnection(config);

    // 检查表是否存在
    const [tables] = await connection.execute(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'card_ticket_plans'",
      [config.database],
    );
    if ((tables as any[]).length === 0) return 0;

    // 检查列类型：必须为 decimal（即 TypeORM synchronize 已将 int 改为 decimal）
    const [cols] = await connection.execute(
      "SELECT DATA_TYPE FROM information_schema.columns WHERE table_schema = ? AND table_name = 'card_ticket_plans' AND column_name = 'price'",
      [config.database],
    );
    const dataType = (cols as any[])?.[0]?.DATA_TYPE;
    if (dataType !== 'decimal') {
      // 列仍为 int，等待 TypeORM synchronize 完成后再执行
      return 0;
    }

    // 检查是否有 >= 100 的值（说明仍是分单位）
    const [check] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM `card_ticket_plans` WHERE `price` >= 100',
    );
    const count = (check as any[])?.[0]?.cnt ?? 0;
    if (count === 0) return 0;

    // 将所有价格除以 100，从分转为元
    const [result] = await connection.execute(
      'UPDATE `card_ticket_plans` SET `price` = `price` / 100',
    );
    return (result as any).affectedRows ?? 0;
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return 0;
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}
