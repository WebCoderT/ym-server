import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 服务
 * 全局单例，提供 Redis 连接和常用操作
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db'),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis 连接成功');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis 错误: ${err.message}`);
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis 连接失败（非致命）: ${err.message}`);
    });
  }

  get raw(): Redis {
    return this.client;
  }

  async isReady(): Promise<boolean> {
    try {
      const status = this.client.status;
      return status === 'ready' || status === 'connect';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // 静默失败，Redis 不可用时不影响主流程
    }
  }

  /** 刷新 key 的 TTL（不改变值） */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch {
      return false;
    }
  }

  /** 获取 key 的剩余 TTL（秒），-1 表示无过期，-2 表示不存在 */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch {
      return -2;
    }
  }

  /** 删除 key */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      // 静默
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
