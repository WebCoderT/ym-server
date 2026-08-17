/**
 * 认证令牌工具模块
 *
 * 本模块提供与 JWT 令牌相关的所有工具函数和类型定义，包括：
 * - 令牌载荷类型定义
 * - JWT 密钥获取
 * - 令牌校验与解析
 * - 从 HTTP 请求中提取 Bearer 令牌
 * - 从请求中解析认证载荷和访问级别
 *
 * 所有函数均围绕 Express Request 对象和 jsonwebtoken 库展开，是系统认证体系的核心支撑模块。
 *
 * @module auth-token
 */

// NestJS 异常类，用于在认证失败时抛出对应状态码
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
// Express 请求类型，用于类型安全的请求对象操作
import { Request } from 'express';
// JWT 库，用于令牌签名验证与解析
import jwt from 'jsonwebtoken';

// 访问级别枚举，定义系统支持的角色类型
import { AccessLevel } from './access-level.enum';
// 认证错误消息常量
import { AUTH_MESSAGES } from './auth.messages';

/**
 * 认证令牌类型
 *
 * 区分访问令牌（access）和刷新令牌（refresh）两种类型，
 * 用于在令牌校验时确认令牌用途是否匹配。
 */
export type AuthTokenType = 'access' | 'refresh';

/**
 * 认证令牌载荷接口
 *
 * 定义了 JWT 令牌解码后的数据结构，包含用户标识、角色、会话标识等核心字段。
 * 所有字段均在令牌生成时写入，在后续请求中通过解析获取以识别用户身份和权限。
 */
export type AuthTokenPayload = {
  /** 用户唯一标识（subject），对应数据库中的用户主键 */
  sub: string;

  /** 用户角色，决定其可访问的接口范围 */
  role: AccessLevel;

  /** 微信用户的 openid，用于关联微信账号（可选） */
  openid?: string;

  /** 会话唯一标识，用于支持多设备登录管理和会话失效 */
  sessionId: string;

  /** 令牌类型，区分访问令牌与刷新令牌 */
  tokenType: AuthTokenType;

  /** 设备唯一标识，用于设备管理和安全风控（可选） */
  deviceId?: string;

  /**
   * 用户聚合权限列表（可选）
   * 登录时由 RoleService 聚合用户所有角色的 permissions 写入，
   * 后续请求由 PermissionGuard 读取以进行细粒度权限校验。
   * 旧令牌可能没有此字段，此时视为无额外权限。
   */
  permissions?: string[];
};

/**
 * 获取 JWT 签名密钥
 *
 * 从环境变量 `JWT_SECRET` 中读取签名密钥。若未配置，则抛出异常阻止应用继续运行，
 * 避免因密钥缺失导致令牌校验被绕过。
 *
 * @returns 环境变量中的 JWT_SECRET 字符串
 * @throws ForbiddenException 当 JWT_SECRET 未配置时抛出
 */
export function getJwtSecret() {
  // 从进程环境变量中读取 JWT 密钥
  const secret = process.env.JWT_SECRET;

  // 若密钥未定义或为空字符串，抛出异常提示开发者配置环境变量
  if (!secret) {
    throw new ForbiddenException(AUTH_MESSAGES.JWT_SECRET_NOT_CONFIGURED);
  }

  // 返回有效的密钥字符串
  return secret;
}

/**
 * 校验并解析认证令牌
 *
 * 该函数使用 JWT 密钥验证令牌的签名和有效期，并对载荷中的必填字段进行业务层校验，
 * 确保令牌未被篡改且包含完整的用户身份信息。
 *
 * @param token - 从请求头中提取的 JWT 字符串
 * @param expectedTokenType - 期望的令牌类型，默认为 'access'
 * @returns 解析后的 AuthTokenPayload 对象
 * @throws ForbiddenException 当令牌无效、过期、格式错误或类型不匹配时抛出
 */
export function verifyAuthToken(
  token: string,
  expectedTokenType: AuthTokenType = 'access',
): AuthTokenPayload {
  // 声明载荷变量，初始类型为 string 或 AuthTokenPayload，因为 jwt.verify 可能返回字符串
  let payload: string | AuthTokenPayload;

  try {
    // 使用 JWT 密钥验证令牌签名和有效期
    payload = jwt.verify(token, getJwtSecret()) as string | AuthTokenPayload;
  } catch {
    // 若验证失败（签名错误、令牌过期等），抛出 401 未认证
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_INVALID_OR_EXPIRED);
  }

  // JWT 规范允许载荷为字符串，但本系统要求载荷必须是对象，否则无法读取字段
  if (typeof payload === 'string') {
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_PAYLOAD_MUST_BE_OBJECT);
  }

  // 校验角色字段是否存在且属于系统定义的 AccessLevel 枚举值
  if (!payload.role || !Object.values(AccessLevel).includes(payload.role)) {
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_ROLE_MISSING_OR_INVALID);
  }

  // 校验用户标识字段是否存在，sub 是识别用户身份的核心字段
  if (!payload.sub) {
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_SUBJECT_MISSING);
  }

  // 校验会话标识字段是否存在，sessionId 用于支持多端登录管理和主动失效会话
  if (!payload.sessionId) {
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_SESSION_ID_MISSING);
  }

  // 校验令牌类型是否与期望类型一致，防止用刷新令牌冒充访问令牌
  if (payload.tokenType !== expectedTokenType) {
    throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_TYPE_MISMATCH(expectedTokenType));
  }

  // 所有校验通过，返回解析后的载荷对象
  return payload;
}

/**
 * 从 HTTP 请求中提取 Bearer 令牌
 *
 * 解析请求头中的 Authorization 字段，提取格式为 "Bearer {token}" 的令牌字符串。
 * 若请求头缺失或格式不正确，则抛出异常。
 *
 * @param request - Express 请求对象
 * @returns 提取到的 JWT 令牌字符串
 * @throws ForbiddenException 当 Authorization 头缺失或格式错误时抛出
 */
function getBearerTokenFromRequest(request: Request) {
  // 从请求头中获取 authorization 字段（大小写不敏感）
  const authorization = request.header('authorization');

  // 若请求头中不存在 authorization，提示缺少令牌（401）
  if (!authorization) {
    throw new UnauthorizedException(AUTH_MESSAGES.AUTHORIZATION_TOKEN_REQUIRED);
  }

  // 按空格分割 authorization 字符串，期望得到 [scheme, token] 两部分
  const [scheme, token] = authorization.split(' ');

  // 校验 scheme 是否为 "bearer"（不区分大小写）且 token 部分非空
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedException(AUTH_MESSAGES.AUTHORIZATION_HEADER_MUST_USE_BEARER);
  }

  // 返回提取到的令牌字符串
  return token;
}

/**
 * 从 HTTP 请求中解析认证载荷
 *
 * 组合调用 getBearerTokenFromRequest 和 verifyAuthToken，
 * 一步到位地从请求中提取并校验令牌，返回完整的认证载荷。
 *
 * @param request - Express 请求对象
 * @param expectedTokenType - 期望的令牌类型，默认为 'access'
 * @returns 解析后的 AuthTokenPayload 对象
 * @throws UnauthorizedException 当令牌缺失、无效或类型不匹配时抛出
 */
export function resolveAuthPayloadFromRequest(
  request: Request,
  expectedTokenType: AuthTokenType = 'access',
) {
  // 先提取 Bearer 令牌，再对其进行校验和解析
  return verifyAuthToken(getBearerTokenFromRequest(request), expectedTokenType);
}

/**
 * 从 HTTP 请求中解析访问级别（角色）
 *
 * 该函数是 resolveAuthPayloadFromRequest 的便捷封装，
 * 在仅需获取用户角色而不需要完整载荷的场景下使用。
 *
 * @param request - Express 请求对象
 * @returns 请求令牌中携带的 AccessLevel 角色值
 * @throws ForbiddenException 当令牌缺失或无效时抛出
 */
export function resolveAccessLevelFromRequest(request: Request): AccessLevel {
  // 解析完整载荷后，仅返回其中的 role 字段
  return resolveAuthPayloadFromRequest(request).role;
}

/**
 * 安全地从请求中提取 Bearer 令牌（不抛异常）
 * 用于监控拦截器等场景，令牌缺失或无效时返回 null
 */
export function getBearerTokenFromRequestSafe(request: Request): string | null {
  const authorization = request.header('authorization');
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
