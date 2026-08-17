import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * 会话活跃跟踪服务
 *
 * 使用 Redis 滑动窗口机制跟踪用户会话活跃度：
 * - 每次请求刷新 Redis key 的 TTL
 * - TTL 过期 = 会话不活跃（即使 JWT 未过期）
 * - 管理端可查询剩余活跃时长
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  /** Redis key 前缀 */
  private readonly KEY_PREFIX = 'session:active:';

  /** 用户最新会话 key 前缀 */
  private readonly USER_SESSION_PREFIX = 'user:session:';

  /** 默认活跃窗口（秒），与 JWT access token 过期时间一致 */
  private readonly DEFAULT_TTL = 2 * 60 * 60; // 2 小时

  constructor(private readonly redis: RedisService) {}

  /** 构建 Redis key */
  private key(sessionId: string): string {
    return `${this.KEY_PREFIX}${sessionId}`;
  }

  /**
   * 记录会话活跃（每次请求时调用）
   * 如果 key 不存在则创建，存在则刷新 TTL
   */
  async touch(sessionId: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.DEFAULT_TTL;
    const k = this.key(sessionId);

    const exists = await this.redis.raw.exists(k);
    if (exists) {
      await this.redis.expire(k, ttl);
    } else {
      await this.redis.set(k, '1', ttl);
    }
  }

  /**
   * 查询会话剩余活跃时长（秒）
   * @returns 剩余秒数，-1 表示 key 存在但无过期，-2 表示会话已过期/不存在
   */
  async getRemainingSeconds(sessionId: string): Promise<number> {
    return this.redis.ttl(this.key(sessionId));
  }

  /**
   * 批量查询多个会话的剩余活跃时长
   * @param sessionIds 会话 ID 列表
   * @returns Map<sessionId, remainingSeconds>
   */
  async getRemainingSecondsBatch(
    sessionIds: string[],
  ): Promise<Map<string, number>> {
    if (sessionIds.length === 0) return new Map();

    const pipeline = this.redis.raw.pipeline();
    for (const id of sessionIds) {
      pipeline.ttl(this.key(id));
    }

    try {
      const results = await pipeline.exec();
      const map = new Map<string, number>();
      if (results) {
        for (let i = 0; i < sessionIds.length; i++) {
          const err = results[i][0];
          const ttl = err ? -2 : (results[i][1] as number);
          map.set(sessionIds[i], ttl);
        }
      }
      return map;
    } catch {
      return new Map();
    }
  }

  /** 手动清除会话（用户登出时调用） */
  async invalidate(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  /** 记录用户最新会话 ID（每次请求时更新，TTL 与活跃窗口同步） */
  async recordUserSession(userId: string, sessionId: string): Promise<void> {
    const k = `${this.USER_SESSION_PREFIX}${userId}`;
    // 先获取活跃 session 的剩余 TTL，同步到用户映射 key
    const remaining = await this.getRemainingSeconds(sessionId);
    const ttl = remaining > 0 ? remaining : this.DEFAULT_TTL;
    await this.redis.set(k, sessionId, ttl);
  }

  /**
   * 查询用户剩余活跃时长（秒）
   * 通过用户最新会话 ID 查询活跃窗口剩余时间
   * @returns 剩余秒数，-2 表示无活跃会话
   */
  async getUserRemainingSeconds(userId: string): Promise<number> {
    const k = `${this.USER_SESSION_PREFIX}${userId}`;
    const sessionId = await this.redis.get(k);
    if (!sessionId) return -2;
    return this.getRemainingSeconds(sessionId);
  }

  /**
   * 批量查询用户剩余活跃时长
   * @param userIds 用户 ID 列表
   * @returns Map<userId, remainingSeconds>
   */
  async getUserRemainingSecondsBatch(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    // 第一步：批量获取所有用户的 sessionId
    const pipeline1 = this.redis.raw.pipeline();
    for (const id of userIds) {
      pipeline1.get(`${this.USER_SESSION_PREFIX}${id}`);
    }

    let sessionIds: (string | null)[];
    try {
      const results = await pipeline1.exec();
      sessionIds = results ? results.map((r) => (r[0] ? null : (r[1] as string | null))) : userIds.map(() => null);
    } catch {
      return new Map();
    }

    // 第二步：批量获取 session TTL
    const pipeline2 = this.redis.raw.pipeline();
    for (const sid of sessionIds) {
      if (sid) {
        pipeline2.ttl(this.key(sid));
      } else {
        // 占位，稍后填充 -2
        pipeline2.get('__placeholder__');
      }
    }

    try {
      const results = await pipeline2.exec();
      const map = new Map<string, number>();
      if (results) {
        for (let i = 0; i < userIds.length; i++) {
          const sid = sessionIds[i];
          if (!sid) {
            map.set(userIds[i], -2);
          } else {
            const err = results[i][0];
            const ttl = err ? -2 : (results[i][1] as number);
            map.set(userIds[i], ttl);
          }
        }
      }
      return map;
    } catch {
      return new Map();
    }
  }
}
