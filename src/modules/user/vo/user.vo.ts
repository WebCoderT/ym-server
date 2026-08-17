import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PhoneVisibility,
  ProfileVisibility,
  RewardVisibility,
} from '../entities/user-privacy-setting.entity';

/**
 * 用户隐私设置 VO
 * 用于展示用户当前的隐私配置详情
 */
export class UserPrivacySettingVo {
  /** 资料可见性：公开/仅粉丝/私密 */
  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.PUBLIC })
  profileVisibility!: ProfileVisibility;

  /** 手机号可见性：公开/仅好友/私密 */
  @ApiProperty({ enum: PhoneVisibility, example: PhoneVisibility.PRIVATE })
  phoneVisibility!: PhoneVisibility;

  /** 打赏记录可见性：公开/仅好友/私密 */
  @ApiProperty({
    enum: RewardVisibility,
    example: RewardVisibility.FRIENDS_ONLY,
  })
  rewardVisibility!: RewardVisibility;

  /** 是否允许陌生人私信：0-不允许，1-允许 */
  @ApiProperty({ type: Number, example: 0 })
  allowStrangerMessage!: number;

  /** 隐私设置最后更新时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  updatedAt!: string;
}

/**
 * 用户设备信息 VO
 *
 * 描述用户已登录设备的基本信息，包括设备标识、设备名称、是否当前设备以及最后登录时间。
 */
export class UserDeviceVo {
  /** 设备唯一标识，用于区分不同终端设备 */
  @ApiProperty({ type: String, example: 'device-iphone-15' })
  deviceId!: string;

  /** 设备显示名称，便于用户在界面上识别设备（如 "iPhone 15 Pro"） */
  @ApiProperty({ type: String, example: 'iPhone 15 Pro' })
  deviceName!: string;

  /** 是否为当前正在使用的设备，true 表示当前会话所在的设备 */
  @ApiProperty({ type: Boolean, example: true })
  current!: boolean;

  /** 该设备最后一次登录的时间戳，ISO 8601 格式字符串 */
  @ApiProperty({ type: String, example: '2026-05-26T10:00:00.000Z' })
  lastLoginAt!: string;
}

/**
 * 用户安全信息 VO
 *
 * 汇总与用户账号安全相关的状态信息，包括风险提醒标志、风险描述消息以及已登录设备列表。
 */
export class UserSecurityVo {
  /** 是否存在安全风险提醒，true 表示检测到异常登录或其他安全事件 */
  @ApiProperty({ type: Boolean, example: false })
  hasRiskReminder!: boolean;

  /** 安全风险的具体描述消息，用于展示在用户界面的安全中心页面 */
  @ApiProperty({ type: String, example: '当前设备安全，无异常登录提醒。' })
  riskMessage!: string;

  /** 用户已登录的所有设备列表，包含每个设备的详细信息和登录时间 */
  @ApiProperty({ type: [UserDeviceVo] })
  devices!: UserDeviceVo[];
}

/**
 * 用户信息 VO
 *
 * 用户模块的统一响应对象，涵盖基础信息、账户信息、会员体系、安全状态和隐私设置。
 */
export class UserInfoVo {
  /** 用户唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 微信 openid */
  @ApiProperty({ type: 'string', example: 'wx_8d3b1ec2a1a2' })
  openid!: string;

  /** 用户昵称，可能为空 */
  @ApiProperty({ type: 'string', example: '星愿旅人' })
  nickname!: string | null;

  /** 用户头像 URL，可能为空 */
  @ApiProperty({ type: 'string', example: 'https://cdn.example.com/avatar/default.png' })
  avatarUrl!: string | null;

  /** 用户手机号，可能为空 */
  @ApiProperty({ type: 'string', example: '138****8888', nullable: true })
  phone!: string | null;

  /** QQ OpenID（脱敏后），未绑定则为空 */
  @ApiPropertyOptional({ type: 'string', example: '12****89' })
  qqOpenId!: string | null;

  /** 邮箱（脱敏后），未绑定则为空 */
  @ApiPropertyOptional({ type: 'string', example: 'ab***@example.com' })
  email!: string | null;

  /** 账户余额 */
  @ApiProperty({ type: Number, example: 0 })
  balance!: number;

  /** 累计消费金额 */
  @ApiProperty({ type: Number, example: 0 })
  totalSpending!: number;

  /** 用户状态：1-正常，0-禁用 */
  @ApiProperty({ type: Number, example: 1 })
  status!: number;

  /** 用户角色代码（如 REGULAR_USER、USER_MANAGER），无角色时为空字符串 */
  @ApiPropertyOptional({ type: 'string', example: 'USER_MANAGER' })
  roleCode!: string;

  /** 用户注册时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;

  /** 是否已实名认证 */
  @ApiProperty({ type: Boolean, example: false })
  isRealNameAuth!: boolean;

  /** 成长值，反映用户在平台上的活跃度和贡献度 */
  @ApiProperty({ type: Number, example: 0 })
  growthValue!: number;

  /** 用户最后一次登录时间，ISO 8601 格式 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  lastLoginAt!: string;

  /** 用户账号安全状态信息，包含设备列表和风险提醒 */
  @ApiProperty({ type: UserSecurityVo })
  security!: UserSecurityVo;

  /** 用户隐私设置，可能为空 */
  @ApiProperty({ type: () => UserPrivacySettingVo, nullable: true })
  privacySetting!: UserPrivacySettingVo | null;
}

/**
 * 管理员用户列表响应项 VO
 */
export class AdminUserListItemVo {
  /** 用户唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 用户昵称 */
  @ApiProperty({ type: 'string', example: '星愿旅人' })
  nickname!: string | null;

  /** 用户头像 URL */
  @ApiProperty({ type: 'string', example: 'https://cdn.example.com/avatar/default.png' })
  avatarUrl!: string | null;

  /** 用户手机号 */
  @ApiProperty({ type: 'string', example: '138****8888', nullable: true })
  phone!: string | null;

  /** 账户余额 */
  @ApiProperty({ type: Number, example: 0 })
  balance!: number;

  /** 用户状态 */
  @ApiProperty({ type: Number, example: 1 })
  status!: number;

  /** 用户注册时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;

  /** 用户 openid */
  @ApiProperty({ type: 'string', example: 'wx_8d3b1ec2a1a2' })
  openid!: string;

  /** 会员等级ID */
  @ApiProperty({ type: 'string', example: '1', nullable: true })
  memberLevelId!: string | null;

  /** 累计消费金额 */
  @ApiProperty({ type: Number, example: 150 })
  totalSpending!: number;

  /** 最后更新时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  updatedAt!: string;
}

/**
 * 管理员用户列表响应 VO
 */
export class AdminUserListResponseVo {
  /** 受众级别 */
  @ApiProperty({ type: 'string', example: 'admin' })
  audience!: string;

  /** 用户列表 */
  @ApiProperty({ type: [AdminUserListItemVo] })
  items!: AdminUserListItemVo[];

  /** 分页信息 */
  @ApiProperty({
    example: { total: 100, page: 1, pageSize: 10, totalPages: 10 },
  })
  pagination!: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
