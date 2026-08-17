/**
 * 地区数据初始化脚本
 * 将中国行政区划数据导入 regions 表
 *
 * 使用方式：
 *   npx ts-node src/modules/region/init-regions.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RegionService } from './region.service';
import { REGION_DATA } from './region-data';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const regionService = app.get(RegionService);

  console.log('开始导入地区数据...');

  // 将 code 转换为 parentId
  const codeToId = new Map<string, number>();

  // 1. 插入省级（level=1）
  const level1 = REGION_DATA.filter((r) => r.level === 1);
  for (const r of level1) {
    const entity = await regionService['regionRepo'].save(
      regionService['regionRepo'].create({
        code: r.code,
        name: r.name,
        parentId: 0,
        level: r.level,
        sortOrder: parseInt(r.code.slice(0, 2)),
        isActive: true,
      }),
    );
    codeToId.set(r.code, entity.id);
  }

  // 2. 插入市级（level=2）
  const level2 = REGION_DATA.filter((r) => r.level === 2);
  for (const r of level2) {
    const parentId = codeToId.get(r.parentCode) || 0;
    const entity = await regionService['regionRepo'].save(
      regionService['regionRepo'].create({
        code: r.code,
        name: r.name,
        parentId,
        level: r.level,
        sortOrder: parseInt(r.code.slice(2, 4)) || 0,
        isActive: true,
      }),
    );
    codeToId.set(r.code, entity.id);
  }

  // 3. 插入区县级（level=3）
  const level3 = REGION_DATA.filter((r) => r.level === 3);
  for (const r of level3) {
    const parentId = codeToId.get(r.parentCode) || 0;
    await regionService['regionRepo'].save(
      regionService['regionRepo'].create({
        code: r.code,
        name: r.name,
        parentId,
        level: r.level,
        sortOrder: parseInt(r.code.slice(4, 6)) || 0,
        isActive: true,
      }),
    );
  }

  console.log(`地区数据导入完成，共 ${REGION_DATA.length} 条`);
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('导入失败:', err);
  process.exit(1);
});
