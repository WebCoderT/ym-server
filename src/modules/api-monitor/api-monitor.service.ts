import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ApiLogEntity } from './entities/api-log.entity';

/**
 * API 监控服务
 * 提供日志写入、查询、统计和自动清理功能
 */
@Injectable()
export class ApiMonitorService {
  private readonly logger = new Logger(ApiMonitorService.name);

  /** 批量写入缓冲区 */
  private buffer: Partial<ApiLogEntity>[] = [];

  /** 缓冲区大小阈值，达到后批量写入 */
  private readonly FLUSH_SIZE = 50;

  /** 定时 flush 间隔（ms） */
  private readonly FLUSH_INTERVAL = 5000;

  /** 日志保留天数 */
  private readonly RETENTION_DAYS = 30;

  private flushTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(ApiLogEntity)
    private readonly logRepo: Repository<ApiLogEntity>,
  ) {
    // 启动定时 flush
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);

    // 启动每日清理（凌晨 3 点）
    this.scheduleCleanup();
  }

  /** 记录一条请求日志（先放入缓冲区） */
  record(entry: Partial<ApiLogEntity>) {
    this.buffer.push(entry);
    if (this.buffer.length >= this.FLUSH_SIZE) {
      this.flush();
    }
  }

  /** 立即将缓冲区写入数据库 */
  async flush() {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await this.logRepo.save(batch);
    } catch (err) {
      this.logger.error(`批量写入 API 日志失败: ${(err as Error).message}`);
    }
  }

  /** 分页查询日志 */
  async findLogs(params: {
    page?: number;
    pageSize?: number;
    method?: string;
    statusCode?: number;
    userId?: string;
    accessLevel?: string;
    urlKeyword?: string;
    success?: boolean;
    slowOnly?: boolean;
    from?: Date;
    to?: Date;
  }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 50, 200);

    const qb = this.logRepo.createQueryBuilder('log');

    if (params.method) qb.andWhere('log.method = :method', { method: params.method });
    if (params.statusCode) qb.andWhere('log.statusCode = :statusCode', { statusCode: params.statusCode });
    if (params.userId) qb.andWhere('log.userId = :userId', { userId: params.userId });
    if (params.accessLevel) qb.andWhere('log.accessLevel = :accessLevel', { accessLevel: params.accessLevel });
    if (params.urlKeyword) qb.andWhere('log.url LIKE :urlKeyword', { urlKeyword: `%${params.urlKeyword}%` });
    if (params.success !== undefined) qb.andWhere('log.success = :success', { success: params.success });
    if (params.slowOnly) qb.andWhere('log.duration >= :slowThreshold', { slowThreshold: 2000 });
    if (params.from) qb.andWhere('log.createdAt >= :from', { from: params.from });
    if (params.to) qb.andWhere('log.createdAt <= :to', { to: params.to });

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /** 获取统计摘要 */
  async getSummary(from?: Date, to?: Date) {
    const qb = this.logRepo.createQueryBuilder('log');
    if (from) qb.andWhere('log.createdAt >= :from', { from });
    if (to) qb.andWhere('log.createdAt <= :to', { to });

    const result = await qb
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN log.success = 1 THEN 1 ELSE 0 END) as successCount',
        'SUM(CASE WHEN log.success = 0 THEN 1 ELSE 0 END) as failureCount',
        'AVG(log.duration) as avgDuration',
        'SUM(log.requestSize) as totalRequestBytes',
        'SUM(log.responseSize) as totalResponseBytes',
        'SUM(CASE WHEN log.duration >= 2000 THEN 1 ELSE 0 END) as slowCount',
      ])
      .getRawOne();

    const total = Number(result.total) || 0;
    const successCount = Number(result.successCount) || 0;
    const failureCount = Number(result.failureCount) || 0;

    return {
      total,
      success: successCount,
      failure: failureCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
      avgDuration: Math.round(Number(result.avgDuration) || 0),
      slowCount: Number(result.slowCount) || 0,
      totalRequestBytes: Number(result.totalRequestBytes) || 0,
      totalResponseBytes: Number(result.totalResponseBytes) || 0,
    };
  }

  /** 按状态码分组统计 */
  async getStatusDistribution(from?: Date, to?: Date) {
    const qb = this.logRepo.createQueryBuilder('log');
    if (from) qb.andWhere('log.createdAt >= :from', { from });
    if (to) qb.andWhere('log.createdAt <= :to', { to });

    const rows = await qb
      .select(['log.statusCode as statusCode', 'COUNT(*) as count'])
      .groupBy('log.statusCode')
      .orderBy('count', 'DESC')
      .getRawMany();

    const distribution: Record<string, number> = {};
    for (const row of rows) {
      distribution[String(row.statusCode)] = Number(row.count);
    }
    return distribution;
  }

  /** 按端点聚合统计 */
  async getEndpointStats(from?: Date, to?: Date) {
    const qb = this.logRepo.createQueryBuilder('log');
    if (from) qb.andWhere('log.createdAt >= :from', { from });
    if (to) qb.andWhere('log.createdAt <= :to', { to });

    const rows = await qb
      .select([
        'log.method as method',
        'log.requestPath as url',
        'COUNT(*) as total',
        'SUM(CASE WHEN log.success = 1 THEN 1 ELSE 0 END) as success',
        'SUM(CASE WHEN log.success = 0 THEN 1 ELSE 0 END) as failure',
        'AVG(log.duration) as avgDuration',
        'MAX(log.duration) as maxDuration',
      ])
      .groupBy('log.method')
      .addGroupBy('log.requestPath')
      .orderBy('total', 'DESC')
      .limit(100)
      .getRawMany();

    return rows.map((r) => ({
      method: r.method,
      url: r.url,
      total: Number(r.total),
      success: Number(r.success),
      failure: Number(r.failure),
      avgDuration: Math.round(Number(r.avgDuration)),
      maxDuration: Number(r.maxDuration),
    }));
  }

  /** 清理过期日志 */
  async cleanup() {
    const cutoff = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.logRepo.delete({
      createdAt: LessThan(cutoff),
    });
    if (result.affected && result.affected > 0) {
      this.logger.log(`清理了 ${result.affected} 条过期 API 日志`);
    }
  }

  private scheduleCleanup() {
    const now = new Date();
    const next3am = new Date(now);
    next3am.setHours(3, 0, 0, 0);
    if (next3am <= now) next3am.setDate(next3am.getDate() + 1);

    const delay = next3am.getTime() - now.getTime();

    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      // 每天执行一次
      this.cleanupTimer = setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000);
    }, delay);
  }

  /** 模块销毁时清理定时器 */
  async onModuleDestroy() {
    await this.flush();
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
  }
}
