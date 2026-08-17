import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CapabilityRegistry } from '../../common/plugin/capability.registry';
import {
  USER_REGISTERED,
  USER_LOGGED_IN,
} from '../../common/events/domain-events';
import { StorageConfigService } from '../storage/storage-config.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { RoleService } from '../role/role.service';
import { WechatService } from '../auth/wechat.service';
import { UpdatePrivacySettingRequestDto } from './dto/privacy-setting.dto';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUpdateUserStatusDto,
  SubmitRealNameAuthRequestDto,
  UpdateClientProfileRequestDto,
} from './dto/user.dto';
import { UserStatus } from './enums/user.enum';
import { UserEntity } from './entities/user.entity';
import {
  UserInfoVo as UserInfoDto,
  UserPrivacySettingVo as UserPrivacySettingDto,
  AdminUserListItemVo as AdminUserListItemDto,
} from './vo/user.vo';
import {
  PhoneVisibility,
  ProfileVisibility,
  RewardVisibility,
  UserPrivacySettingEntity,
} from './entities/user-privacy-setting.entity';
import { MemberLevelService } from '@modules/member-level/member-level.service';
import { BUSINESS_MESSAGES } from '@common/messages/business.messages';

/**
 * 创建或更新用户时的输入参数类型
 */
type UpsertUserInput = {
  /** 微信 openid */
  openid: string;
  /** 用户昵称（可选） */
  nickname?: string;
  /** 用户头像 URL（可选） */
  avatarUrl?: string;
  /** 设备唯一标识（可选） */
  deviceId?: string;
  /** 设备名称（可选） */
  deviceName?: string;
};

/**
 * 手机号注册用户输入参数类型
 */
type CreatePhoneUserInput = {
  /** 手机号 */
  phone: string;
  /** 密码哈希 */
  passwordHash: string;
  /** 用户昵称（可选） */
  nickname?: string;
  /** 设备唯一标识（可选） */
  deviceId?: string;
  /** 设备名称（可选） */
  deviceName?: string;
};

/**
 * 用户服务
 * 提供用户信息的增删改查、隐私设置管理等核心功能
 */
@Injectable()
export class UserService {
  constructor(
    /** 用户实体仓储：用于操作用户表 */
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    /** 隐私设置实体仓储：用于操作用户隐私设置表 */
    @InjectRepository(UserPrivacySettingEntity)
    private readonly privacyRepo: Repository<UserPrivacySettingEntity>,
    /** 事件总线：用于发布领域事件（插件通过订阅事件响应） */
    private readonly eventBus: EventEmitter2,
    /** 能力注册中心：用于查询插件注册的查询能力 */
    private readonly capabilityRegistry: CapabilityRegistry,
    /** 存储配置服务：用于拼接文件资源的完整 URL */
    private readonly storageConfig: StorageConfigService,
    /** 系统配置服务：用于读取默认昵称/头像 */
    private readonly systemConfig: SystemConfigService,
    /** 角色服务：用于查询用户角色 */
    private readonly roleService: RoleService,
    /** 微信服务：用于解码微信手机号 code */
    private readonly wechatService: WechatService,
    /** 会员等级服务：用于获取用户会员等级完整信息 */
    private readonly memberLevelService: MemberLevelService,
  ) {}

  /**
   * 创建或更新客户端用户
   * 根据 openid 查找用户；若不存在则创建新用户并初始化隐私设置，否则更新现有用户信息
   *
   * @param input - 包含 openid、昵称、头像及设备信息的输入参数
   * @returns 创建或更新后的用户实体
   */
  async upsertClientUser(input: UpsertUserInput): Promise<UserEntity> {
    // 根据 openid 查询是否已存在该用户
    let user = await this.userRepo.findOne({
      where: { openid: input.openid },
    });

    const now = new Date();

    if (!user) {
      // 读取系统配置的默认昵称前缀和默认头像
      const config = await this.systemConfig.getConfig();

      // 用户不存在：创建新用户实体
      user = this.userRepo.create({
        openid: input.openid,
        nickname: input.nickname?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || config.defaultAvatar || null,
        balance: 0,
      });
      await this.userRepo.save(user);

      // 昵称为空时，使用"前缀+用户ID"作为默认昵称
      if (!user.nickname) {
        user.nickname = `${config.defaultNickname || '粉丝'}${user.id}`;
        await this.userRepo.save(user);
      }

      // 为新用户创建默认隐私设置
      const privacy = this.privacyRepo.create({
        userId: user.id,
        profileVisibility: ProfileVisibility.PUBLIC,
        phoneVisibility: PhoneVisibility.PRIVATE,
        rewardVisibility: RewardVisibility.FRIENDS_ONLY,
        allowStrangerMessage: 0,
      });
      await this.privacyRepo.save(privacy);
    } else {
      // 用户已存在：按需更新昵称与头像
      if (input.nickname?.trim()) {
        user.nickname = input.nickname.trim();
      }
      if (input.avatarUrl?.trim()) {
        user.avatarUrl = input.avatarUrl.trim();
      }
      user.updatedAt = now;
      await this.userRepo.save(user);
    }

    // 若提供了设备信息，发布用户注册事件（安全插件订阅后自动记录设备）
    if (input.deviceId) {
      this.eventBus.emit(USER_REGISTERED, {
        userId: user.id,
        openid: input.openid,
        deviceId: input.deviceId,
        deviceName: input.deviceName || '微信小程序',
      });
    }

    return user;
  }

  /**
   * 根据手机号查找用户
   *
   * @param phone - 手机号
   * @returns 用户实体，不存在时返回 null
   */
  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  /**
   * 获取用户的实名信息（手机号、姓名、证件类型、证件号）
   * 用于全局唯一观演人自动同步时读取认证数据
   */
  async getRealNameInfo(userId: string): Promise<{
    phone: string | null;
    realName: string | null;
    idCardType: string | null;
    idCard: string | null;
  } | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;
    return {
      phone: user.phone ?? null,
      realName: user.realName ?? null,
      idCardType: user.idCardType ?? null,
      idCard: user.idCard ?? null,
    };
  }

  /**
   * 创建手机号注册用户
   *
   * @param input - 包含手机号、密码哈希及昵称的输入参数
   * @returns 创建后的用户实体
   * @throws ForbiddenException 当手机号已被注册时抛出
   */
  async createPhoneUser(input: CreatePhoneUserInput): Promise<UserEntity> {
    const existing = await this.userRepo.findOne({
      where: { phone: input.phone },
    });

    if (existing) {
      throw new ForbiddenException('该手机号已被注册');
    }

    // 读取系统配置的默认昵称前缀和默认头像
    const config = await this.systemConfig.getConfig();

    const user = this.userRepo.create({
      openid: `phone_${input.phone}`,
      phone: input.phone,
      passwordHash: input.passwordHash,
      nickname: input.nickname?.trim() || null,
      avatarUrl: config.defaultAvatar || null,
      balance: 0,
    });

    await this.userRepo.save(user);

    // 昵称为空时，使用"前缀+用户ID"作为默认昵称
    if (!user.nickname) {
      user.nickname = `${config.defaultNickname || '粉丝'}${user.id}`;
      await this.userRepo.save(user);
    }

    // 为新用户创建默认隐私设置
    const privacy = this.privacyRepo.create({
      userId: user.id,
      profileVisibility: ProfileVisibility.PUBLIC,
      phoneVisibility: PhoneVisibility.PRIVATE,
      rewardVisibility: RewardVisibility.FRIENDS_ONLY,
      allowStrangerMessage: 0,
    });
    await this.privacyRepo.save(privacy);

    // 若提供了设备信息，发布用户注册事件（安全插件订阅后自动记录设备）
    if (input.deviceId) {
      this.eventBus.emit(USER_REGISTERED, {
        userId: user.id,
        phone: input.phone,
        deviceId: input.deviceId,
        deviceName: input.deviceName || '手机号注册',
      });
    }

    return user;
  }

  /**
   * 获取用户个人资料
   * 查询用户基本信息，并组装安全设备列表与风险提醒
   *
   * @param userId - 用户唯一标识
   * @param currentDeviceId - 当前设备标识（可选），用于标记当前设备
   * @returns 用户个人资料 DTO
   * @throws NotFoundException 当用户不存在时抛出
   */
  async getProfile(userId: string, _currentDeviceId?: string): Promise<UserInfoDto> {
    return this.getById(userId);
  }

  /**
   * 根据 ID 获取用户详细信息
   * 查询用户及其关联的隐私设置，并组装为 DTO
   *
   * @param userId - 用户唯一标识
   * @returns 用户详细信息 DTO
   * @throws NotFoundException 当用户不存在时抛出
   */
  async getById(userId: string): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });

    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    const privacy = user.privacySetting;

    // 查询角色列表、设备列表、会员等级
    const [userRoles, deviceList, memberLevelRes] =
      await Promise.all([
        this.roleService.getUserRoles(userId),
        // 通过能力注册中心查询安全插件的设备列表能力（插件未安装时返回 null，降级为空列表）
        this.capabilityRegistry
          .invoke<{ userId: string }, { items: any[] }>('security:devices', { userId })
          .then((result) => result ?? { items: [] }),
        this.memberLevelService.getUserLevel(userId),
      ]);

    // 取第一个角色代码作为用户的角色标识
    const roleCode = userRoles.length > 0 ? userRoles[0].roleCode : '';

    // 判断是否存在非当前设备且非微信小程序的登录记录，作为风险提醒依据
    const hasRiskReminder = deviceList.items.some(
      (d) => !d.current && d.deviceName !== '微信小程序',
    );

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: await this.storageConfig.resolveFileUrl(user.avatarUrl),
      phone: user.phone,
      qqOpenId: maskQqOpenId(user.qqOpenId),
      email: maskEmail(user.email),
      balance: Number(user.balance),
      totalSpending: Number(user.totalSpending),
      status: user.status,
      roleCode,
      isRealNameAuth: user.isRealNameAuth,
      createdAt: user.createdAt.toISOString(),
      growthValue: 0,
      lastLoginAt: user.updatedAt.toISOString(),
      security: {
        hasRiskReminder,
        riskMessage: hasRiskReminder
          ? '检测到新设备登录，请在个人中心确认设备安全。'
          : '当前设备安全，无异常登录提醒。',
        devices: deviceList.items.map((d) => ({
          deviceId: d.deviceId,
          deviceName: d.deviceName || '未知设备',
          current: d.current,
          lastLoginAt: d.lastLoginAt,
        })),
      },
      // 注意：followCount, ticketCount, cardCount 已移除
      privacySetting: privacy
        ? {
            profileVisibility: privacy.profileVisibility,
            phoneVisibility: privacy.phoneVisibility,
            rewardVisibility: privacy.rewardVisibility,
            allowStrangerMessage: privacy.allowStrangerMessage,
            updatedAt: privacy.updatedAt.toISOString(),
          }
        : null,
      // 注意：avatarFrame 和 wornMedals 已移除
    };
  }

  /**
   * 提交实名认证信息
   * 更新用户的实名认证信息并标记为已认证
   *
   * @param userId - 用户唯一标识
   * @param body - 实名认证表单数据
   * @returns 更新后的用户信息
   * @throws NotFoundException 当用户不存在时抛出
   */
  async submitRealNameAuth(
    userId: string,
    body: SubmitRealNameAuthRequestDto,
  ): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });

    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    // 通过微信 code 解码手机号
    const phone = await this.wechatService.getPhoneNumber(body.phoneWechatCode);

    user.realName = body.realName.trim();
    user.idCardType = body.idCardType.trim();
    user.idCard = body.idCard.trim();
    user.phone = phone;
    user.isRealNameAuth = true;
    user.realNameAuthAt = new Date();

    await this.userRepo.save(user);

    // 注意：audienceService 已移除，如需全局唯一观演人功能请重新实现
    // await this.audienceService.syncAudienceFromRealName(...);

    return this.getById(userId);
  }

  /**
   * 获取用户隐私设置
   * 若用户未设置过隐私配置，则返回默认隐私设置
   *
   * @param userId - 用户唯一标识
   * @returns 用户隐私设置 DTO
   */
  async getPrivacySetting(userId: string): Promise<UserPrivacySettingDto> {
    const privacy = await this.privacyRepo.findOne({ where: { userId } });

    if (!privacy) {
      return this.getDefaultPrivacySetting();
    }

    return this.toPrivacySettingDto(privacy);
  }

  /**
   * 更新用户隐私设置
   * 若用户尚未有隐私记录，则创建；否则按需更新字段
   *
   * @param userId - 用户唯一标识
   * @param body - 更新的隐私设置字段
   * @returns 更新后的隐私设置 DTO
   */
  async updatePrivacySetting(
    userId: string,
    body: UpdatePrivacySettingRequestDto,
  ): Promise<UserPrivacySettingDto> {
    let privacy = await this.privacyRepo.findOne({ where: { userId } });

    if (!privacy) {
      // 隐私记录不存在：使用传入值或默认值创建新记录
      privacy = this.privacyRepo.create({
        userId,
        profileVisibility: body.profileVisibility ?? ProfileVisibility.PUBLIC,
        phoneVisibility: body.phoneVisibility ?? PhoneVisibility.PRIVATE,
        rewardVisibility: body.rewardVisibility ?? RewardVisibility.FRIENDS_ONLY,
        allowStrangerMessage: body.allowStrangerMessage ?? 0,
      });
    } else {
      // 隐私记录存在：按需更新各字段
      if (body.profileVisibility !== undefined) {
        privacy.profileVisibility = body.profileVisibility;
      }
      if (body.phoneVisibility !== undefined) {
        privacy.phoneVisibility = body.phoneVisibility;
      }
      if (body.rewardVisibility !== undefined) {
        privacy.rewardVisibility = body.rewardVisibility;
      }
      if (body.allowStrangerMessage !== undefined) {
        privacy.allowStrangerMessage = body.allowStrangerMessage;
      }
    }

    await this.privacyRepo.save(privacy);

    return this.toPrivacySettingDto(privacy);
  }

  /**
   * 获取默认隐私设置
   * 当用户尚未配置隐私时返回的默认配置
   *
   * @returns 默认隐私设置 DTO
   */
  private getDefaultPrivacySetting(): UserPrivacySettingDto {
    return {
      profileVisibility: ProfileVisibility.PUBLIC,
      phoneVisibility: PhoneVisibility.PRIVATE,
      rewardVisibility: RewardVisibility.FRIENDS_ONLY,
      allowStrangerMessage: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 将隐私设置实体转换为 DTO
   *
   * @param privacy - 隐私设置实体
   * @returns 隐私设置 DTO
   */
  private toPrivacySettingDto(privacy: UserPrivacySettingEntity): UserPrivacySettingDto {
    return {
      profileVisibility: privacy.profileVisibility,
      phoneVisibility: privacy.phoneVisibility,
      rewardVisibility: privacy.rewardVisibility,
      allowStrangerMessage: privacy.allowStrangerMessage,
      updatedAt: privacy.updatedAt.toISOString(),
    };
  }

  /**
   * 更新客户端用户资料
   * 支持更新昵称、头像和手机号
   *
   * @param userId - 用户唯一标识
   * @param body - 更新的资料字段
   * @returns 更新后的用户详细信息
   * @throws NotFoundException 当用户不存在时抛出
   */
  async updateClientProfile(
    userId: string,
    body: UpdateClientProfileRequestDto,
  ): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });

    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    if (body.nickname !== undefined) {
      user.nickname = body.nickname?.trim() || null;
    }
    if (body.avatarUrl !== undefined) {
      user.avatarUrl = body.avatarUrl?.trim() || null;
    }
    if (body.phone !== undefined) {
      user.phone = body.phone?.trim() || null;
    }
    // 注意：avatarFrame 字段已移除，如需头像框功能请重新实现
    // if (body.avatarFrame !== undefined) {
    //   ...
    // }

    await this.userRepo.save(user);

    return this.getById(userId);
  }

  // ==================== 管理员专用方法 ====================

  /**
   * 管理员获取用户列表
   * 支持关键词搜索和状态筛选，返回分页结果
   */
  async adminGetUsers(query: {
    keyword?: string;
    status?: UserStatus;
    page: number;
    pageSize: number;
  }): Promise<{ items: AdminUserListItemDto[]; total: number }> {
    const qb = this.userRepo.createQueryBuilder('user');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;
      qb.where(
        '(user.nickname LIKE :keyword OR user.phone LIKE :keyword OR user.id LIKE :keyword)',
        { keyword },
      );
    }

    if (query.status !== undefined) {
      if (query.keyword) {
        qb.andWhere('user.status = :status', { status: query.status });
      } else {
        qb.where('user.status = :status', { status: query.status });
      }
    }

    // 先查总数
    const total = await qb.getCount();

    // 分页查询
    const items = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    return {
      items: await Promise.all(
        items.map(async (user) => ({
          id: user.id,
          nickname: user.nickname,
          avatarUrl: await this.storageConfig.resolveFileUrl(user.avatarUrl),
          phone: user.phone,
          balance: Number(user.balance),
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          openid: user.openid,
          memberLevelId: user.memberLevelId,
          totalSpending: Number(user.totalSpending),
          updatedAt: user.updatedAt.toISOString(),
        })),
      ),
      total,
    };
  }

  /**
   * 管理员获取用户详情
   */
  async adminGetUserById(userId: string): Promise<UserInfoDto> {
    return this.getById(userId);
  }

  /**
   * 管理员创建用户
   */
  async adminCreateUser(body: AdminCreateUserDto): Promise<UserInfoDto> {
    const openid = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = this.userRepo.create({
      openid,
      nickname: body.nickname?.trim() || null,
      phone: body.phone?.trim() || null,
      avatarUrl: body.avatarUrl?.trim() || null,
      balance: body.balance ?? 0,
      status: body.status ?? UserStatus.ACTIVE,
    });
    await this.userRepo.save(user);

    // 创建默认隐私设置
    const privacy = this.privacyRepo.create({
      userId: user.id,
      profileVisibility: ProfileVisibility.PUBLIC,
      phoneVisibility: PhoneVisibility.PRIVATE,
      rewardVisibility: RewardVisibility.FRIENDS_ONLY,
      allowStrangerMessage: 0,
    });
    await this.privacyRepo.save(privacy);

    return this.getById(user.id);
  }

  /**
   * 管理员更新用户
   */
  async adminUpdateUser(userId: string, body: AdminUpdateUserDto): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });
    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    if (body.nickname !== undefined) {
      user.nickname = body.nickname?.trim() || null;
    }
    if (body.phone !== undefined) {
      user.phone = body.phone?.trim() || null;
    }
    if (body.avatarUrl !== undefined) {
      user.avatarUrl = body.avatarUrl?.trim() || null;
    }
    if (body.balance !== undefined) {
      user.balance = body.balance;
    }

    await this.userRepo.save(user);
    return this.getById(userId);
  }

  /**
   * 管理员删除用户
   */
  async adminDeleteUser(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }
    await this.userRepo.remove(user);
  }

  /**
   * 管理员更新用户状态
   */
  async adminUpdateUserStatus(
    userId: string,
    body: AdminUpdateUserStatusDto,
  ): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });
    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    user.status = body.status;
    await this.userRepo.save(user);
    return this.getById(userId);
  }

  /**
   * 管理员手动设置用户会员等级
   */
  async adminUpdateUserMemberLevel(
    userId: string,
    memberLevelId: string | null,
  ): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['privacySetting'],
    });
    if (!user) {
      throw new NotFoundException(BUSINESS_MESSAGES.USER.NOT_FOUND(userId));
    }

    user.memberLevelId = memberLevelId;
    user.isManualMemberLevel = memberLevelId !== null;
    await this.userRepo.save(user);
    return this.getById(userId);
  }
}

/* ───────────────────── 脱敏工具函数 ───────────────────── */

/**
 * 脱敏 QQ OpenID
 * 规则：长度 >= 7 时保留前 2 位 + **** + 后 2 位；否则原样返回
 */
function maskQqOpenId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length < 7) return value;
  return value.slice(0, 2) + '****' + value.slice(-2);
}

/**
 * 脱敏邮箱
 * 规则：用户名部分保留首尾各 1 字符，中间用 *** 替换；域名完整保留
 * 例：abcdef@example.com → a***ef@example.com
 */
function maskEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const atIdx = value.indexOf('@');
  if (atIdx <= 0) return value;
  const local = value.slice(0, atIdx);
  const domain = value.slice(atIdx);
  if (local.length <= 2) return local + domain;
  return local[0] + '***' + local[local.length - 1] + domain;
}
