import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditEventResult,
  AuditEventType,
  SecurityAuditLogEntity,
} from './entities/security-audit-log.entity';
import { UserLoginDeviceEntity } from './entities/user-login-device.entity';
import { LogoutDeviceRequestDto } from './dto/security.dto';
import {
  LogoutDeviceResponseVo as LogoutDeviceResponseDto,
  SecurityAuditLogVo as SecurityAuditLogDto,
  SecurityAuditLogListResponseVo as SecurityAuditLogListResponseDto,
  UserDeviceVo as UserDeviceDto,
  UserDeviceListResponseVo as UserDeviceListResponseDto,
} from './vo/security.vo';
import { SECURITY_MESSAGES } from './security.messages';

/**
 * 安全服务
 * 提供用户登录设备管理、设备注销及安全审计日志记录等核心安全功能
 */
@Injectable()
export class SecurityService {
  constructor(
    /** 用户登录设备实体仓储：用于操作 user_login_device 表 */
    @InjectRepository(UserLoginDeviceEntity)
    private readonly deviceRepo: Repository<UserLoginDeviceEntity>,
    /** 安全审计日志实体仓储：用于操作 security_audit_log 表 */
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditRepo: Repository<SecurityAuditLogEntity>,
  ) {}

  /**
   * 获取用户设备列表
   * 查询指定用户的全部登录设备，并按最后登录时间降序排列
   *
   * @param userId - 用户唯一标识
   * @param currentDeviceId - 当前设备标识（可选），用于标记当前设备
   * @returns 用户设备列表响应 DTO
   */
  async getDeviceList(
    userId: string,
    currentDeviceId?: string,
  ): Promise<UserDeviceListResponseDto> {
    // 查询该用户的所有登录设备，按最后登录时间从新到旧排序
    const devices = await this.deviceRepo.find({
      where: { userId },
      order: { lastLoginAt: 'DESC' },
    });

    // 将设备实体转换为 DTO，并标记当前设备
    return {
      items: devices.map((device) => this.toDeviceDto(device, currentDeviceId)),
    };
  }

  /**
   * 注销指定设备
   * 删除用户的某台登录设备记录，并写入设备注销审计日志
   *
   * @param userId - 用户唯一标识
   * @param deviceId - 待注销的设备标识
   * @param currentDeviceId - 当前设备标识（可选），用于判断是否为当前设备
   * @returns 注销结果 DTO
   * @throws NotFoundException 当设备不存在时抛出
   * @throws BadRequestException 当尝试注销当前设备时抛出
   */
  async logoutDevice(
    userId: string,
    deviceId: string,
    currentDeviceId?: string,
  ): Promise<LogoutDeviceResponseDto> {
    // 根据用户ID与设备ID查询设备记录
    const device = await this.deviceRepo.findOne({
      where: { userId, deviceId },
    });

    if (!device) {
      throw new NotFoundException(SECURITY_MESSAGES.DEVICE_NOT_FOUND(deviceId));
    }

    // 判断待注销设备是否为当前正在使用的设备
    const isCurrentDevice = currentDeviceId ? deviceId === currentDeviceId : device.isCurrent === 1;

    // 禁止注销当前设备，防止误操作导致自身被踢出
    if (isCurrentDevice) {
      throw new BadRequestException(SECURITY_MESSAGES.CANNOT_LOGOUT_CURRENT_DEVICE);
    }

    // 从数据库中移除该设备记录
    await this.deviceRepo.remove(device);

    // 记录设备注销的安全审计日志
    await this.addAuditLog(userId, {
      eventType: AuditEventType.DEVICE_LOGOUT,
      eventResult: AuditEventResult.SUCCESS,
      ip: null,
      deviceId,
      detail: { action: 'logout_device', targetDeviceId: deviceId },
    });

    return { success: true };
  }

  /**
   * 添加或更新登录设备
   * 若设备已存在则更新信息，否则创建设备记录，并写入登录审计日志
   *
   * @param userId - 用户唯一标识
   * @param input - 包含设备信息的对象
   * @returns 添加/更新后的设备 DTO
   */
  async addDevice(
    userId: string,
    input: {
      deviceId: string;
      deviceName: string | null;
      loginIp: string | null;
      loginCity: string | null;
      isCurrent?: number;
    },
  ): Promise<UserDeviceDto> {
    // 查询该用户是否已存在相同 deviceId 的记录
    let device = await this.deviceRepo.findOne({
      where: { userId, deviceId: input.deviceId },
    });

    if (device) {
      // 设备已存在：更新设备名称、IP、城市及当前状态
      device.deviceName = input.deviceName ?? device.deviceName;
      device.loginIp = input.loginIp ?? device.loginIp;
      device.loginCity = input.loginCity ?? device.loginCity;
      device.isCurrent = input.isCurrent ?? device.isCurrent;
      device.lastLoginAt = new Date();
    } else {
      // 设备不存在：创建新的设备记录
      device = this.deviceRepo.create({
        userId,
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        loginIp: input.loginIp,
        loginCity: input.loginCity,
        isCurrent: input.isCurrent ?? 0,
        lastLoginAt: new Date(),
      });
    }

    // 保存设备记录到数据库
    await this.deviceRepo.save(device);

    // 记录登录成功的安全审计日志
    await this.addAuditLog(userId, {
      eventType: AuditEventType.LOGIN,
      eventResult: AuditEventResult.SUCCESS,
      ip: input.loginIp,
      deviceId: input.deviceId,
      detail: {
        deviceName: input.deviceName,
        loginCity: input.loginCity,
      },
    });

    return this.toDeviceDto(device, input.deviceId);
  }

  /**
   * 获取用户安全审计日志列表
   * 查询指定用户的全部安全审计日志，并按创建时间降序排列
   *
   * @param userId - 用户唯一标识
   * @returns 审计日志列表响应 DTO
   */
  async getAuditLogs(userId: string): Promise<SecurityAuditLogListResponseDto> {
    const logs = await this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      items: logs.map((log) => this.toAuditLogDto(log)),
    };
  }

  /**
   * 添加安全审计日志
   * 将安全相关事件记录到审计日志表中，便于后续追溯
   *
   * @param userId - 用户唯一标识
   * @param input - 包含事件类型、结果、IP、设备及详情的事件对象
   */
  async addAuditLog(
    userId: string,
    input: {
      eventType: AuditEventType;
      eventResult: AuditEventResult;
      ip: string | null;
      deviceId: string | null;
      detail: Record<string, unknown>;
    },
  ): Promise<void> {
    // 创建审计日志实体
    const log = this.auditRepo.create({
      userId,
      eventType: input.eventType,
      eventResult: input.eventResult,
      ip: input.ip,
      deviceId: input.deviceId,
      detail: input.detail,
    });

    // 保存审计日志到数据库
    await this.auditRepo.save(log);
  }

  /**
   * 将设备实体转换为 DTO
   *
   * @param device - 用户登录设备实体
   * @param currentDeviceId - 当前设备标识（可选）
   * @returns 用户设备 DTO
   */
  private toDeviceDto(device: UserLoginDeviceEntity, currentDeviceId?: string): UserDeviceDto {
    return {
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      loginIp: device.loginIp,
      loginCity: device.loginCity,
      // 若传入了 currentDeviceId 则直接比对，否则使用数据库中的 isCurrent 字段
      current: currentDeviceId ? device.deviceId === currentDeviceId : device.isCurrent === 1,
      lastLoginAt: device.lastLoginAt.toISOString(),
    };
  }

  /**
   * 将审计日志实体转换为 DTO
   *
   * @param log - 安全审计日志实体
   * @returns 安全审计日志 DTO
   */
  private toAuditLogDto(log: SecurityAuditLogEntity): SecurityAuditLogDto {
    return {
      id: log.id,
      eventType: log.eventType,
      eventResult: log.eventResult,
      ip: log.ip,
      deviceId: log.deviceId,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
