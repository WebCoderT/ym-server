import { ApiProperty } from '@nestjs/swagger';

/**
 * 管理员资料 VO
 * 用于描述管理员的基本信息，通常在登录成功后返回给客户端。
 */
export class AdminProfileVo {
  /**
   * 管理员唯一标识符
   * 示例值为 UUID 格式的字符串。
   */
  @ApiProperty({ type: String, example: '9c151ad0-bcac-4517-aad9-9ff29ffedfe7' })
  id!: string;

  /**
   * 管理员登录用户名
   * 示例值为 'admin'。
   */
  @ApiProperty({ type: String, example: 'admin' })
  username!: string;

  /**
   * 管理员显示名称
   * 示例值为 '系统管理员'，用于在界面中展示。
   */
  @ApiProperty({ type: String, example: '系统管理员' })
  displayName!: string;
}

/**
 * 管理员认证会话 VO
 * 登录成功后返回给客户端的会话信息，包含访问令牌及其元数据。
 */
export class AdminAuthSessionVo {
  /**
   * 令牌类型
   * 示例值为 'Bearer'，表示使用 Bearer Token 认证方式。
   */
  @ApiProperty({ type: String, example: 'Bearer' })
  tokenType!: string;

  /**
   * 访问令牌字符串
   * 用于后续请求的认证凭据，客户端需在请求头中携带该令牌。
   */
  @ApiProperty({ type: String })
  accessToken!: string;

  /**
   * 访问令牌有效期（秒）
   * 示例值为 28800，表示令牌将在 8 小时后过期。
   */
  @ApiProperty({ type: Number, example: 28800 })
  accessTokenExpiresIn!: number;

  /**
   * 会话唯一标识符
   * 示例值为 'admin_session_550e8400-e29b-41d4-a716-446655440000'，
   * 用于标识当前登录会话。
   */
  @ApiProperty({
    type: String,
    example: 'admin_session_550e8400-e29b-41d4-a716-446655440000',
  })
  sessionId!: string;

  /**
   * 管理员资料信息
   * 包含当前登录管理员的详细资料，类型为 AdminProfileVo。
   */
  @ApiProperty({ type: AdminProfileVo })
  admin!: AdminProfileVo;
}
