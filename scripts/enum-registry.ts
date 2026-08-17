/**
 * 枚举注册表
 * 将服务端所有枚举统一注册，用于在导出 OpenAPI 时注入为独立 schema，
 * 使前端 SDK 能生成干净的枚举类型。
 */

import { UserStatus } from '../src/modules/user/enums/user.enum';
import { TaskType, TaskStatus } from '../src/modules/member/entities/member.entity';
import { AuditEventType } from '../src/modules/security/enums/audit-event-type.enum';
import { AuditEventResult } from '../src/modules/security/enums/audit-event-result.enum';
import { BannerStatus } from '../src/modules/banner/enums/banner-status.enum';
import { BannerLinkType } from '../src/modules/banner/enums/banner-link-type.enum';

export interface EnumDef {
  /** 枚举在 OpenAPI schema 中的名称 */
  name: string;
  /** 枚举值列表 */
  values: (string | number)[];
  /** JSON Schema 类型 */
  type: 'string' | 'number';
}

export const enumRegistry: EnumDef[] = [
  // ── 用户 ──
  { name: 'UserStatus', values: Object.values(UserStatus).filter(v => typeof v === 'number'), type: 'number' },

  // ── 会员 ──
  { name: 'TaskType', values: Object.values(TaskType), type: 'string' },
  { name: 'TaskStatus', values: Object.values(TaskStatus), type: 'string' },

  // ── 安全审计 ──
  { name: 'AuditEventType', values: Object.values(AuditEventType), type: 'string' },
  { name: 'AuditEventResult', values: Object.values(AuditEventResult).filter(v => typeof v === 'number'), type: 'number' },

  // ── Banner ──
  { name: 'BannerStatus', values: Object.values(BannerStatus), type: 'string' },
  { name: 'BannerLinkType', values: Object.values(BannerLinkType), type: 'string' },
];
