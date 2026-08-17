/**
 * 权限枚举模块
 *
 * 定义系统中所有的细粒度权限标识符，供角色分配与权限校验使用。
 * 权限采用 `<模块>:<资源>:<操作>` 的三段式命名约定，支持通配符匹配。
 *
 * 通配符规则：
 * - `client:*` 匹配所有以 `client:` 开头的权限
 * - `*` 匹配所有权限（超级管理员）
 * - 精确匹配优先于通配符
 *
 * @module permission.enum
 */

export enum Permission {
  // ══════════════════════════════════════════════
  // 客户端权限（client:* 通配）
  // 普通用户默认通过 REGULAR_USER 角色拥有
  // ══════════════════════════════════════════════

  /** 个人资料管理 */
  CLIENT_PROFILE = 'client:profile',
  /** 钱包余额相关 */
  CLIENT_WALLET = 'client:wallet',
  /** 安全审计（查看自己的登录记录） */
  CLIENT_SECURITY = 'client:security',
  /** 会员相关 */
  CLIENT_MEMBER = 'client:member',
  /** 通知确认 */
  CLIENT_NOTIFICATION = 'client:notification',

  // ══════════════════════════════════════════════
  // 员工权限（staff:* 通配）
  // 需通过特殊角色（如 USER_MANAGER）授予
  // ══════════════════════════════════════════════

  // 暂无员工特定权限，可扩展

  // ══════════════════════════════════════════════
  // 管理员权限（admin:* 通配）
  // 为未来 admin 账户角色化预留
  // ══════════════════════════════════════════════

  /** 用户管理 */
  ADMIN_USER = 'admin:user',
  /** 内容管理（轮播图、图片、通知等） */
  ADMIN_CONTENT = 'admin:content',
  /** 系统管理（配置、角色、监控） */
  ADMIN_SYSTEM = 'admin:system',
  /** 会员等级管理 */
  ADMIN_MEMBER = 'admin:member',
  /** 提现审核 */
  ADMIN_WITHDRAWAL = 'admin:withdrawal',
  /** 支付流水与回调管理 */
  ADMIN_PAYMENT = 'admin:payment',
  /** 快递公司管理 */
  ADMIN_COURIER = 'admin:courier',
  /** 地区管理 */
  ADMIN_REGION = 'admin:region',
}

/**
 * 通配符：匹配所有权限，仅供 SUPER_ADMIN 系统角色使用
 */
export const PERMISSION_WILDCARD_ALL = '*';

/**
 * 权限分组定义，供前端渲染权限矩阵使用
 */
export const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  client: {
    label: '客户端',
    permissions: [
      Permission.CLIENT_PROFILE,
      Permission.CLIENT_WALLET,
      Permission.CLIENT_SECURITY,
      Permission.CLIENT_MEMBER,
      Permission.CLIENT_NOTIFICATION,
    ],
  },
  staff: {
    label: '员工',
    permissions: [],
  },
  admin: {
    label: '管理员',
    permissions: [
      Permission.ADMIN_USER,
      Permission.ADMIN_CONTENT,
      Permission.ADMIN_SYSTEM,
      Permission.ADMIN_MEMBER,
      Permission.ADMIN_WITHDRAWAL,
      Permission.ADMIN_PAYMENT,
      Permission.ADMIN_COURIER,
      Permission.ADMIN_REGION,
    ],
  },
};
