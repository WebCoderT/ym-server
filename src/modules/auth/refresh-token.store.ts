import { Injectable } from '@nestjs/common';

/**
 * 刷新令牌记录类型
 * 描述一条刷新令牌在内存中的存储结构
 */
type RefreshTokenRecord = {
  /** 刷新令牌字符串本身 */
  refreshToken: string;
  /** 关联的用户ID */
  userId: string;
  /** 关联的会话ID */
  sessionId: string;
  /** 令牌过期时间戳（毫秒） */
  expiresAt: number;
};

/**
 * 刷新令牌存储服务
 * 基于内存 Map 实现刷新令牌的保存、查找与撤销，用于会话管理
 */
@Injectable()
export class RefreshTokenStore {
  /** 内存中的刷新令牌记录映射表，键为 refreshToken 字符串 */
  private readonly records = new Map<string, RefreshTokenRecord>();

  /**
   * 保存刷新令牌记录
   * 将新的刷新令牌写入内存映射表
   *
   * @param record - 刷新令牌记录对象
   */
  save(record: RefreshTokenRecord) {
    this.records.set(record.refreshToken, record);
  }

  /**
   * 查找刷新令牌记录
   * 根据令牌字符串查询对应记录，若已过期则自动清理
   *
   * @param refreshToken - 刷新令牌字符串
   * @returns 对应的记录对象；若不存在或已过期则返回 undefined
   */
  find(refreshToken: string) {
    const record = this.records.get(refreshToken);

    // 若记录不存在，直接返回 undefined
    if (!record) {
      return undefined;
    }

    // 若记录已过期，则从映射表中删除并返回 undefined
    if (record.expiresAt <= Date.now()) {
      this.records.delete(refreshToken);
      return undefined;
    }

    return record;
  }

  /**
   * 撤销指定刷新令牌
   * 从内存映射表中删除单条刷新令牌记录
   *
   * @param refreshToken - 待撤销的刷新令牌字符串
   */
  revoke(refreshToken: string) {
    this.records.delete(refreshToken);
  }

  /**
   * 按会话ID撤销刷新令牌
   * 遍历所有记录，删除与会话ID匹配的全部刷新令牌
   *
   * @param sessionId - 会话唯一标识
   */
  revokeBySession(sessionId: string) {
    // 遍历映射表中的所有键值对
    for (const [token, record] of this.records.entries()) {
      // 若记录的会话ID匹配，则删除该令牌
      if (record.sessionId === sessionId) {
        this.records.delete(token);
      }
    }
  }
}
