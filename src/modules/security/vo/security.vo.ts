import { ApiProperty } from '@nestjs/swagger';
import { AuditEventType } from '../enums/audit-event-type.enum';
import { AuditEventResult } from '../enums/audit-event-result.enum';

/**
 * 用户设备 VO
 * 用于展示用户某台登录设备的基本信息
 */
export class UserDeviceVo {
  @ApiProperty({ type: 'string', example: 'device-iphone-15' })
  id!: string;

  @ApiProperty({ type: 'string', example: 'device-iphone-15' })
  deviceId!: string;

  @ApiProperty({ type: 'string', example: 'iPhone 15 Pro' })
  deviceName!: string | null;

  @ApiProperty({ type: 'string', example: '192.168.1.1' })
  loginIp!: string | null;

  @ApiProperty({ type: 'string', example: '广州市' })
  loginCity!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  current!: boolean;

  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  lastLoginAt!: string;
}

/**
 * 用户设备列表响应 VO
 */
export class UserDeviceListResponseVo {
  @ApiProperty({ type: [UserDeviceVo] })
  items!: UserDeviceVo[];
}

/**
 * 注销设备响应 VO
 */
export class LogoutDeviceResponseVo {
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;
}

/**
 * 安全审计日志 VO
 */
export class SecurityAuditLogVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ enum: AuditEventType, example: AuditEventType.LOGIN })
  eventType!: AuditEventType;

  @ApiProperty({ enum: AuditEventResult, example: AuditEventResult.SUCCESS })
  eventResult!: AuditEventResult;

  @ApiProperty({ type: 'string', example: '192.168.1.1' })
  ip!: string | null;

  @ApiProperty({ type: 'string', example: 'device-iphone-15' })
  deviceId!: string | null;

  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * 安全审计日志列表响应 VO
 */
export class SecurityAuditLogListResponseVo {
  @ApiProperty({ type: [SecurityAuditLogVo] })
  items!: SecurityAuditLogVo[];
}
