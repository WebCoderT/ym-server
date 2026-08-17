import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessLevel } from '../../access-level.enum';
import { AUTH_MESSAGES } from '../../auth.messages';
import {
  LoginRequestDto,
  PhoneLoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  SendCodeRequestDto,
  CodeLoginRequestDto,
  BindPhoneRequestDto,
  WechatBindPhoneRequestDto,
} from './auth.dto';
import {
  getJwtSecret,
  type AuthTokenPayload,
  verifyAuthToken,
} from '../../auth-token';
import { RefreshTokenStore } from './refresh-token.store';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/enums/user.enum';
import { USER_LOGGED_IN } from '../../common/events/domain-events';
import { UserInfoVo as UserInfoDto } from '../user/vo/user.vo';
import { AuthSessionVo as AuthSessionDto } from './vo/auth.vo';
import { WechatService } from './wechat.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { RoleService } from '../role/role.service';

/** 访问令牌有效期：2小时（单位：秒） */
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 2 * 60 * 60;

/** 刷新令牌有效期：7天（单位：秒） */
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

/**
 * 认证服务
 * 提供客户端登录、会话刷新、登出等核心认证能力
 */
/** 验证码存储：手机号 -> { code, expiresAt } */
const smsCodeStore = new Map<string, { code: string; expiresAt: number }>();

/** 验证码有效期：5 分钟（毫秒） */
const CODE_EXPIRES_IN_MS = 5 * 60 * 1000;

/** 验证码发送冷却：60 秒（毫秒） */
const CODE_COOLDOWN_MS = 60 * 1000;

/** 验证码发送冷却记录：手机号 -> 上次发送时间 */
const codeCooldownStore = new Map<string, number>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    /** 用户服务：用于查询与创建用户 */
    private readonly userService: UserService,
    /** 刷新令牌存储：管理 refreshToken 的生命周期 */
    private readonly refreshTokenStore: RefreshTokenStore,
    /** 事件总线：用于发布领域事件（插件通过订阅事件响应） */
    private readonly eventBus: EventEmitter2,
    /** 微信服务：用于调用微信 code2Session 等 API */
    private readonly wechatService: WechatService,
    /** 系统配置服务：用于读取强制绑定手机号等全局开关 */
    private readonly systemConfigService: SystemConfigService,
    /** 角色服务：登录时聚合用户权限写入 JWT */
    private readonly roleService: RoleService,
  ) {}

  /**
   * 客户端登录
   * 调用微信 code2Session 接口解析 openid，查找或创建用户，记录设备，并颁发会话令牌
   *
   * @param input - 登录请求参数
   * @returns 包含访问令牌、刷新令牌及用户信息的会话对象
   */
  async loginClient(input: LoginRequestDto): Promise<AuthSessionDto> {
    // 调用微信 API 将登录码解析为真实 openid
    const openid = await this.wechatService.resolveOpenId(input.code);

    // 查找或创建用户，并同步更新昵称、头像、设备信息
    const user = await this.userService.upsertClientUser({
      openid,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
    });

    // 校验用户账号状态：仅禁用（BANNED）用户不允许登录，冻结用户可登录但无法进行资金操作
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_BANNED);
    }

    // 发布用户登录事件（安全插件订阅后自动记录设备）
    this.eventBus.emit(USER_LOGGED_IN, {
      userId: user.id,
      deviceId: input.deviceId ?? 'wechat-miniapp',
      deviceName: input.deviceName ?? '微信小程序',
    });

    // 颁发新的访问令牌与刷新令牌
    return this.issueSession({
      userId: user.id,
      openid: user.openid,
      deviceId: input.deviceId,
    });
  }

  /**
   * 刷新客户端会话
   * 验证刷新令牌有效性后，撤销旧令牌并颁发新会话
   *
   * @param input - 刷新令牌请求参数
   * @returns 新的会话对象
   * @throws ForbiddenException 当刷新令牌无效、已撤销或与会话不匹配时抛出
   */
  async refreshClientSession(input: RefreshTokenRequestDto): Promise<AuthSessionDto> {
    // 校验刷新令牌的签名与基本结构
    const payload = verifyAuthToken(input.refreshToken, 'refresh');

    // 在内存存储中查找对应的刷新令牌记录
    const record = this.refreshTokenStore.find(input.refreshToken);

    // 验证记录存在且用户ID、会话ID均匹配
    if (
      !record ||
      record.userId !== payload.sub ||
      record.sessionId !== payload.sessionId
    ) {
      throw new ForbiddenException(
        AUTH_MESSAGES.REFRESH_TOKEN_INVALID_OR_REVOKED,
      );
    }

    // 撤销旧的刷新令牌，防止重复使用
    this.refreshTokenStore.revoke(input.refreshToken);

    // 基于原会话信息颁发新的令牌对
    return this.issueSession({
      userId: payload.sub,
      openid: payload.openid,
      sessionId: payload.sessionId,
    });
  }

  /**
   * 登出客户端会话
   * 撤销当前会话关联的所有刷新令牌，并可选择性地撤销指定刷新令牌
   *
   * @param payload - 当前访问令牌解析出的载荷信息
   * @param refreshToken - 可选的刷新令牌字符串
   * @returns 登出结果对象
   */
  logoutClientSession(payload: AuthTokenPayload, refreshToken?: string) {
    // 撤销与会话ID关联的所有刷新令牌
    this.refreshTokenStore.revokeBySession(payload.sessionId);

    // 若提供了具体刷新令牌，则单独撤销该令牌
    if (refreshToken) {
      this.refreshTokenStore.revoke(refreshToken);
    }

    return { success: true };
  }

  /**
   * 颁发会话
   * 生成访问令牌与刷新令牌，并将刷新令牌持久化到内存存储
   *
   * @param input - 包含用户ID、openid、可选会话ID与设备ID的参数
   * @returns 完整的会话信息对象
   */
  private async issueSession(input: {
    userId: string;
    openid?: string;
    sessionId?: string;
    deviceId?: string;
  }): Promise<AuthSessionDto> {
    // 若未提供会话ID，则生成新的唯一会话标识
    const sessionId = input.sessionId ?? `session_${randomUUID()}`;

    // 聚合用户所有角色的权限，写入 JWT 载荷
    // 若用户无任何角色，自动分配 REGULAR_USER 角色（保证所有用户至少有客户端基础权限）
    let permissions = await this.roleService
      .aggregateUserPermissions(input.userId)
      .catch((err) => {
        this.logger.warn(`聚合用户权限失败，降级为空权限：${(err as Error).message}`);
        return [];
      });

    if (permissions.length === 0) {
      try {
        const regularRole = await this.roleService.getByCode('REGULAR_USER');
        if (regularRole) {
          await this.roleService.assignRole(input.userId, regularRole.id, null);
          permissions = regularRole.permissions;
          this.logger.log(`为用户 ${input.userId} 自动分配 REGULAR_USER 角色`);
        }
      } catch (err) {
        this.logger.warn(`自动分配默认角色失败：${(err as Error).message}`);
      }
    }

    // 构建访问令牌载荷
    const accessPayload: AuthTokenPayload = {
      sub: input.userId,
      role: AccessLevel.CLIENT,
      openid: input.openid,
      sessionId,
      tokenType: 'access',
      deviceId: input.deviceId,
      permissions,
    };

    // 构建刷新令牌载荷（基于访问载荷，仅修改令牌类型）
    const refreshPayload: AuthTokenPayload = {
      ...accessPayload,
      tokenType: 'refresh',
    };

    // 使用 JWT 签名生成访问令牌
    const accessToken = jwt.sign(accessPayload, getJwtSecret(), {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    });

    // 使用 JWT 签名生成刷新令牌
    const refreshToken = jwt.sign(refreshPayload, getJwtSecret(), {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    });

    // 将刷新令牌记录保存到内存存储，用于后续校验与撤销
    this.refreshTokenStore.save({
      refreshToken,
      userId: input.userId,
      sessionId,
      expiresAt: Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    });

    // 查询用户 profile 信息，用于返回给客户端
    const user = await this.userService.getProfile(
      input.userId,
      input.deviceId,
    );

    // 读取系统配置中的强制绑定手机号 / 强制实名认证开关
    const config = await this.systemConfigService.getConfig();

    // 组装并返回完整会话信息
    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
      sessionId,
      user,
      requireRealNameAuth: config.requireRealNameAuth,
    };
  }

  /**
   * 客户端账号注册
   * 使用手机号和密码注册新账号
   *
   * @param input - 注册请求参数
   * @returns 包含访问令牌、刷新令牌及用户信息的会话对象
   */
  async registerClient(input: RegisterRequestDto): Promise<AuthSessionDto> {
    const phone = input.phone.trim();
    const password = input.password;

    // 创建新用户
    const user = await this.userService.createPhoneUser({
      phone,
      passwordHash: hashPassword(password),
      nickname: input.nickname,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
    });

    // 颁发会话
    return this.issueSession({
      userId: user.id,
      deviceId: input.deviceId,
    });
  }

  /**
   * 客户端手机号登录
   * 使用手机号和密码进行登录验证
   *
   * @param input - 手机号登录请求参数
   * @returns 包含访问令牌、刷新令牌及用户信息的会话对象
   * @throws ForbiddenException 当手机号或密码不正确时抛出
   */
  async loginClientByPhone(input: PhoneLoginRequestDto): Promise<AuthSessionDto> {
    const phone = input.phone.trim();

    // 根据手机号查找用户
    const user = await this.userService.findByPhone(phone);

    // 校验用户存在、密码正确、状态正常
    if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw new ForbiddenException('手机号或密码不正确');
    }

    // 校验用户账号状态：仅禁用（BANNED）用户不允许登录，冻结用户可登录但无法进行资金操作
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_BANNED);
    }

    // 发布用户登录事件（安全插件订阅后自动记录设备）
    this.eventBus.emit(USER_LOGGED_IN, {
      userId: user.id,
      deviceId: input.deviceId ?? 'phone-app',
      deviceName: input.deviceName ?? '手机号登录',
    });

    // 颁发新的访问令牌与刷新令牌
    return this.issueSession({
      userId: user.id,
      deviceId: input.deviceId,
    });
  }

  /**
   * 发送短信验证码
   * 生成 6 位数字验证码并存储到内存（5 分钟有效）
   *
   * @param input - 发送验证码请求参数
   * @returns 发送结果
   */
  async sendCode(input: SendCodeRequestDto): Promise<{ success: boolean; message: string }> {
    const phone = input.phone.trim();

    // 校验手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new ForbiddenException('手机号格式不正确');
    }

    // 校验发送冷却
    const lastSend = codeCooldownStore.get(phone);
    if (lastSend && Date.now() - lastSend < CODE_COOLDOWN_MS) {
      const remaining = Math.ceil((CODE_COOLDOWN_MS - (Date.now() - lastSend)) / 1000);
      throw new ForbiddenException(`请 ${remaining} 秒后重试`);
    }

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 存储验证码
    smsCodeStore.set(phone, {
      code,
      expiresAt: Date.now() + CODE_EXPIRES_IN_MS,
    });

    // 记录发送时间
    codeCooldownStore.set(phone, Date.now());

    // TODO: 接入真实短信服务商发送验证码
    // 开发环境下直接返回验证码（方便测试）
    return {
      success: true,
      message: `验证码已发送：${code}`,
    };
  }

  /**
   * 绑定手机号
   * 为已登录的微信用户绑定手机号，需要验证码验证
   *
   * @param userId - 当前登录用户ID
   * @param input - 绑定手机号请求参数
   * @returns 更新后的用户信息
   */
  async bindPhone(userId: string, input: BindPhoneRequestDto): Promise<UserInfoDto> {
    const phone = input.phone.trim();
    const code = input.code.trim();

    // 校验手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new ForbiddenException('手机号格式不正确');
    }

    // 校验验证码
    const record = smsCodeStore.get(phone);
    if (!record) {
      throw new ForbiddenException('验证码不存在，请先获取验证码');
    }
    if (Date.now() > record.expiresAt) {
      smsCodeStore.delete(phone);
      throw new ForbiddenException('验证码已过期，请重新获取');
    }
    if (record.code !== code) {
      throw new ForbiddenException('验证码不正确');
    }

    // 验证通过后删除验证码（一次性使用）
    smsCodeStore.delete(phone);

    // 检查手机号是否已被其他用户绑定
    const existingUser = await this.userService.findByPhone(phone);
    if (existingUser && existingUser.id !== userId) {
      throw new ForbiddenException('该手机号已被其他账号绑定');
    }

    // 更新当前用户的手机号
    const updatedUser = await this.userService.updateClientProfile(userId, { phone });

    // 全局唯一观演人：绑定手机完成后，若已有实名信息则自动同步观演人记录
    // 注意：audience 模块已移除，如需此功能请重新实现
    // const realNameInfo = await this.userService.getRealNameInfo(userId);
    // if (realNameInfo) {
    //   await this.audienceService.syncAudienceFromRealName(...);
    // }

    return updatedUser;
  }

  /**
   * 微信一键绑定手机号
   * 通过微信 getPhoneNumber 接口获取手机号并直接绑定，无需短信验证码
   *
   * @param userId - 当前登录用户 ID
   * @param input - 包含微信 code 的请求体
   * @returns 更新后的用户信息
   */
  async bindPhoneByWechat(userId: string, input: WechatBindPhoneRequestDto): Promise<UserInfoDto> {
    // 调用微信 API 获取手机号
    const phone = await this.wechatService.getPhoneNumber(input.code);

    // 检查手机号是否已被其他用户绑定
    const existingUser = await this.userService.findByPhone(phone);
    if (existingUser && existingUser.id !== userId) {
      throw new ForbiddenException('该手机号已被其他账号绑定');
    }

    // 更新当前用户的手机号
    const updatedUser = await this.userService.updateClientProfile(userId, { phone });

    // 全局唯一观演人：绑定手机完成后，若已有实名信息则自动同步观演人记录
    // 注意：audience 模块已移除，如需此功能请重新实现
    // const realNameInfo = await this.userService.getRealNameInfo(userId);
    // if (realNameInfo) {
    //   await this.audienceService.syncAudienceFromRealName(...);
    // }

    return updatedUser;
  }

  /**
   * 验证码登录
   * 使用手机号和验证码登录，如果用户不存在则自动注册
   *
   * @param input - 验证码登录请求参数
   * @returns 认证会话信息
   */
  async loginByCode(input: CodeLoginRequestDto): Promise<AuthSessionDto> {
    const phone = input.phone.trim();
    const code = input.code.trim();

    // 校验手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new ForbiddenException('手机号格式不正确');
    }

    // 校验验证码
    const record = smsCodeStore.get(phone);
    if (!record) {
      throw new ForbiddenException('验证码不存在，请先获取验证码');
    }
    if (Date.now() > record.expiresAt) {
      smsCodeStore.delete(phone);
      throw new ForbiddenException('验证码已过期，请重新获取');
    }
    if (record.code !== code) {
      throw new ForbiddenException('验证码不正确');
    }

    // 验证通过后删除验证码（一次性使用）
    smsCodeStore.delete(phone);

    // 查找用户，不存在则自动注册
    let user = await this.userService.findByPhone(phone);
    if (!user) {
      // 自动注册
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      user = await this.userService.createPhoneUser({
        phone,
        passwordHash: hashPassword(`${randomSuffix}`), // 随机密码
        nickname: `用户${phone.slice(-4)}`,
        deviceId: input.deviceId,
        deviceName: input.deviceName,
      });
    }

    // 校验用户账号状态：仅禁用（BANNED）用户不允许登录，冻结用户可登录但无法进行资金操作
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_BANNED);
    }

    // 发布用户登录事件（安全插件订阅后自动记录设备）
    this.eventBus.emit(USER_LOGGED_IN, {
      userId: user.id,
      deviceId: input.deviceId ?? 'code-login',
      deviceName: input.deviceName ?? '验证码登录',
    });

    // 颁发会话
    return this.issueSession({
      userId: user.id,
      deviceId: input.deviceId,
    });
  }

}

/**
 * 密码哈希函数
 * 使用 scrypt 算法对明文密码进行加密处理
 */
function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * 密码校验函数
 * 使用恒定时间比较算法验证密码是否匹配
 */
function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, derivedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !derivedKey) {
    return false;
  }
  const inputKey = scryptSync(password, salt, 64);
  const expectedKey = Buffer.from(derivedKey, 'hex');
  if (inputKey.length !== expectedKey.length) {
    return false;
  }
  return timingSafeEqual(inputKey, expectedKey);
}
