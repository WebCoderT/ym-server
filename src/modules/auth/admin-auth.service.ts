/**
 * 管理员认证服务模块
 * 本模块提供管理员账户的认证相关业务逻辑，
 * 包括登录验证、密码加密与校验、初始管理员账户创建等功能。
 */
import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import jwt from 'jsonwebtoken';
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { Repository } from 'typeorm';
import { AccessLevel } from '../../access-level.enum';
import { getJwtSecret, type AuthTokenPayload } from '../../auth-token';
import { AdminLoginRequestDto } from './dto/admin-auth.dto';
import {
  AdminAuthSessionVo as AdminAuthSessionDto,
  AdminProfileVo as AdminProfileDto,
} from './vo/admin-auth.vo';
import { AdminAccountEntity } from '../admin/entities/admin-account.entity';
import { ADMIN_AUTH_MESSAGES } from './admin-auth.messages';

/**
 * 管理员访问令牌有效期（秒）
 * 默认设置为 8 小时，即 28800 秒。
 */
const ADMIN_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 8 * 60 * 60;

/**
 * 管理员认证服务类
 * 实现 OnModuleInit 接口，在模块初始化时自动检查并创建初始管理员账户。
 */
@Injectable()
export class AdminAuthService implements OnModuleInit {
  /**
   * 构造函数
   * 注入管理员账户的数据库仓储实例，用于执行数据库操作。
   * @param adminAccountRepository - 管理员账户实体的 TypeORM 仓储
   */
  constructor(
    @InjectRepository(AdminAccountEntity)
    private readonly adminAccountRepository: Repository<AdminAccountEntity>,
  ) {}

  /**
   * 模块初始化生命周期钩子
   * 在服务启动时自动调用，确保系统中至少存在一个初始管理员账户。
   */
  async onModuleInit() {
    // 调用初始管理员账户创建方法
    await this.ensureInitialAdminAccount();
  }

  /**
   * 管理员登录方法
   * 验证管理员提交的用户名和密码，验证成功后生成并返回访问令牌。
   * @param input - 登录请求数据传输对象，包含用户名和密码
   * @returns 返回管理员会话数据传输对象，包含访问令牌和资料信息
   * @throws ForbiddenException - 当凭证无效或账户被禁用时抛出该异常
   */
  async login(input: AdminLoginRequestDto): Promise<AdminAuthSessionDto> {
    // 去除用户名首尾空白字符，避免输入误差
    const username = input.username.trim();

    // 根据用户名查询对应的管理员账户记录
    const admin = await this.adminAccountRepository.findOne({
      where: { username },
    });

    // 检查账户是否存在、是否激活、密码是否正确
    if (
      !admin ||
      !admin.isActive ||
      !verifyPassword(input.password, admin.passwordHash)
    ) {
      // 任一条件不满足则抛出禁止访问异常，提示凭证无效
      throw new ForbiddenException(ADMIN_AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // 生成唯一的会话标识符
    const sessionId = `admin_session_${randomUUID()}`;

    // 构建 JWT 令牌载荷，包含用户 ID、角色、会话 ID 和令牌类型
    const payload: AuthTokenPayload = {
      sub: admin.id,
      role: AccessLevel.ADMIN,
      sessionId,
      tokenType: 'access',
    };

    // 使用 JWT 库签发访问令牌，设置过期时间
    const accessToken = jwt.sign(payload, getJwtSecret(), {
      expiresIn: ADMIN_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    });

    // 返回包含令牌信息和管理员资料的会话对象
    return {
      tokenType: 'Bearer',
      accessToken,
      accessTokenExpiresIn: ADMIN_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      sessionId,
      admin: this.toAdminProfile(admin),
    };
  }

  /**
   * 确保初始管理员账户存在（私有方法）
   * 检查数据库中是否已存在指定用户名的管理员账户，
   * 若不存在则使用环境变量或默认值创建一个新的管理员账户。
   */
  private async ensureInitialAdminAccount() {
    // 从环境变量读取初始管理员用户名，默认为 'admin'
    const username = (process.env.ADMIN_INIT_USERNAME ?? 'admin').trim();

    // 如果用户名为空，则跳过创建逻辑
    if (!username) {
      return;
    }

    // 查询数据库中是否已存在该用户名的管理员账户
    const existingAdmin = await this.adminAccountRepository.findOne({
      where: { username },
    });

    // 如果已存在，则无需重复创建
    if (existingAdmin) {
      return;
    }

    // 从环境变量读取初始密码和显示名称，使用默认值作为后备
    const password = process.env.ADMIN_INIT_PASSWORD ?? 'Admin@123456';
    const displayName =
      (process.env.ADMIN_INIT_DISPLAY_NAME ?? '系统管理员').trim() ||
      '系统管理员';

    // 创建新的管理员账户实体并保存到数据库
    await this.adminAccountRepository.save(
      this.adminAccountRepository.create({
        username,
        displayName,
        passwordHash: hashPassword(password),
        isActive: true,
      }),
    );
  }

  /**
   * 转换为管理员资料 DTO（私有方法）
   * 将 AdminAccountEntity 实体对象转换为 AdminProfileDto 数据传输对象。
   * @param admin - 管理员账户实体对象
   * @returns 返回管理员资料数据传输对象
   */
  private toAdminProfile(admin: AdminAccountEntity): AdminProfileDto {
    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
    };
  }
}

/**
 * 密码哈希函数
 * 使用 scrypt 算法对明文密码进行加密处理，生成包含盐值和派生密钥的哈希字符串。
 * @param password - 明文密码字符串
 * @returns 返回格式为 "scrypt$盐值$派生密钥" 的哈希字符串
 */
function hashPassword(password: string) {
  // 生成 16 字节的随机盐值，并转换为十六进制字符串
  const salt = randomBytes(16).toString('hex');

  // 使用 scryptSync 算法结合盐值生成 64 字节的派生密钥
  const derivedKey = scryptSync(password, salt, 64).toString('hex');

  // 返回包含算法标识、盐值和派生密钥的格式化字符串
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * 密码校验函数
 * 使用恒定时间比较算法验证用户输入的密码是否与存储的哈希值匹配，
 * 防止时序攻击。
 * @param password - 用户输入的明文密码
 * @param storedHash - 数据库中存储的密码哈希字符串
 * @returns 返回布尔值，密码匹配返回 true，否则返回 false
 */
function verifyPassword(password: string, storedHash: string) {
  // 将存储的哈希字符串按 "$" 分隔为算法标识、盐值和派生密钥三部分
  const [algorithm, salt, derivedKey] = storedHash.split('$');

  // 检查算法是否为 scrypt，以及盐值和派生密钥是否存在
  if (algorithm !== 'scrypt' || !salt || !derivedKey) {
    return false;
  }

  // 使用相同的盐值对用户输入的密码进行 scrypt 运算
  const inputKey = scryptSync(password, salt, 64);

  // 将存储的派生密钥从十六进制字符串转换为 Buffer
  const expectedKey = Buffer.from(derivedKey, 'hex');

  // 比较两个密钥的长度是否一致，长度不同则直接返回不匹配
  if (inputKey.length !== expectedKey.length) {
    return false;
  }

  // 使用 timingSafeEqual 进行恒定时间比较，防止时序攻击
  return timingSafeEqual(inputKey, expectedKey);
}
