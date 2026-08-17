import { ApiProperty } from '@nestjs/swagger';

/**
 * 认证会话 VO
 * 登录或刷新成功后返回给客户端的完整会话信息
 */
export class AuthSessionVo {
  /** 令牌类型，通常为 Bearer */
  @ApiProperty({ type: 'string', example: 'Bearer' })
  tokenType!: string;

  /** 访问令牌字符串 */
  @ApiProperty({ type: String })
  accessToken!: string;

  /** 刷新令牌字符串 */
  @ApiProperty({ type: String })
  refreshToken!: string;

  /** 访问令牌过期时间（秒） */
  @ApiProperty({ type: Number, example: 7200 })
  accessTokenExpiresIn!: number;

  /** 刷新令牌过期时间（秒） */
  @ApiProperty({ type: Number, example: 604800 })
  refreshTokenExpiresIn!: number;

  /** 会话唯一标识 */
  @ApiProperty({ type: 'string', example: 'session_550e8400-e29b-41d4-a716-446655440000' })
  sessionId!: string;

  /** 当前登录用户信息 */
  @ApiProperty({ type: () => require('../../user/vo/user.vo').UserInfoVo })
  user!: import('../../user/vo/user.vo').UserInfoVo;

  /**
   * 是否强制实名认证（来自系统配置，开启后未认证用户登录后必须完成实名认证，含手机号绑定）
   */
  @ApiProperty({ type: Boolean, example: false })
  requireRealNameAuth!: boolean;
}

/**
 * 登出响应 VO
 * 登出操作成功后返回的简单结果
 */
export class LogoutResponseVo {
  /** 是否登出成功 */
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;
}
