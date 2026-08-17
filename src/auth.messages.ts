/**
 * 认证错误消息常量模块
 *
 * 本模块集中定义了与身份认证和权限校验相关的所有错误提示消息。
 * 将错误消息抽取为常量对象，便于统一维护、国际化扩展以及测试时的断言匹配。
 * 所有消息均使用中文，面向国内开发者和终端用户。
 *
 * @module auth.messages
 */

// 访问级别枚举，用于在动态消息中拼接角色名称
import { AccessLevel } from './access-level.enum';
// 认证令牌类型，用于区分访问令牌和刷新令牌
import { type AuthTokenType } from './auth-token';

/**
 * 认证相关错误消息常量对象
 *
 * 该对象包含两类消息：
 * 1. 静态字符串消息：用于固定的错误场景，如配置缺失、格式无效等
 * 2. 动态函数消息：接收参数并返回拼接后的错误字符串，用于需要展示具体变量值的场景
 *
 * 使用 `as const` 断言确保对象属性为只读，防止运行时被意外修改。
 */
export const AUTH_MESSAGES = {
  /** JWT 签名密钥未在环境变量中配置时的提示 */
  JWT_SECRET_NOT_CONFIGURED: 'JWT_SECRET 未配置',

  /** 令牌签名无效或已过期时的提示 */
  TOKEN_INVALID_OR_EXPIRED: '登录状态无效或已过期',

  /** JWT 载荷格式不是对象时的提示 */
  TOKEN_PAYLOAD_MUST_BE_OBJECT: '令牌载荷格式无效',

  /** 令牌中角色字段缺失或不在 AccessLevel 枚举范围内时的提示 */
  TOKEN_ROLE_MISSING_OR_INVALID: '令牌角色信息无效',

  /** 令牌中用户标识（sub）缺失时的提示 */
  TOKEN_SUBJECT_MISSING: '令牌用户标识缺失',

  /** 令牌中会话标识（sessionId）缺失时的提示 */
  TOKEN_SESSION_ID_MISSING: '令牌会话标识缺失',

  /** 请求头中未携带 Authorization 令牌时的提示 */
  AUTHORIZATION_TOKEN_REQUIRED: '请求缺少 Bearer 令牌',

  /** Authorization 头格式不符合 "Bearer {token}" 规范时的提示 */
  AUTHORIZATION_HEADER_MUST_USE_BEARER:
    'Authorization 请求头必须使用 Bearer Token',

  /** 路由处理器或控制器上未找到访问级别元数据时的提示 */
  ACCESS_LEVEL_METADATA_MISSING: '路由缺少访问级别配置',

  /** 刷新令牌无效或已被撤销时的提示 */
  REFRESH_TOKEN_INVALID_OR_REVOKED: '刷新令牌无效或已失效',

  /** 账号被禁用时的提示（触发客户端强制登出） */
  ACCOUNT_BANNED: '账号已被禁用，请联系客服',

  /** 微信登录时未提供 code 参数时的提示 */
  WECHAT_LOGIN_CODE_REQUIRED: '微信登录 code 不能为空',

  /**
   * 令牌类型不匹配时的动态消息生成函数
   *
   * @param expectedTokenType - 期望的令牌类型（'access' 或 'refresh'）
   * @returns 包含令牌类型中文描述的错误提示字符串
   */
  TOKEN_TYPE_MISMATCH: (expectedTokenType: AuthTokenType) =>
    `当前令牌不是有效的${expectedTokenType === 'refresh' ? '刷新' : '访问'}令牌`,

  /**
   * 访问级别不匹配时的动态消息生成函数
   *
   * @param requestLevel - 请求令牌中携带的实际角色
   * @param requiredLevel - 目标接口所需的期望角色
   * @returns 包含实际角色和期望角色的错误提示字符串
   */
  ACCESS_LEVEL_MISMATCH: (
    requestLevel: AccessLevel,
    requiredLevel: AccessLevel,
  ) => `当前角色 ${requestLevel} 无权访问 ${requiredLevel} 接口`,
} as const;
