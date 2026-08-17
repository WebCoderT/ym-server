import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserPrivacySettingEntity } from './user-privacy-setting.entity';
import { UserStatus } from '../enums/user.enum';

// 重新导出枚举，保持外部 import 路径兼容
export { UserStatus };

/**
 * 用户实体
 * 对应数据库 user 表，存储用户核心信息
 */
@Entity('user')
@Index('IDX_user_openid', ['openid'], { unique: true })
export class UserEntity {
  /** 用户唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 微信 openid，全局唯一 */
  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  openid!: string;

  /** 用户昵称，可为空 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  nickname!: string | null;

  /** 用户头像 URL，可为空 */
  @Column({ type: 'varchar', length: 512, name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  /** 用户手机号，全局唯一，可为空 */
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone!: string | null;

  /** QQ OpenID，绑定 QQ 后填入 */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'qq_open_id' })
  qqOpenId!: string | null;

  /** 邮箱地址，绑定邮箱后填入 */
  @Column({ type: 'varchar', length: 128, nullable: true })
  email!: string | null;

  /** 账户余额，decimal(10,2)，默认 0 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: number;

  /** 用户状态：1-正常，0-禁用 */
  @Column({ type: 'tinyint', default: UserStatus.ACTIVE })
  status!: UserStatus;

  /** 密码哈希，账号密码登录时使用 */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash!: string | null;

  /** 累计消费金额，decimal(10,2)，默认 0 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_spending' })
  totalSpending!: number;

  /** 会员等级ID，null 表示无等级 */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'member_level_id' })
  memberLevelId!: string | null;

  /** 会员等级是否手动设置，true 表示手动设置（只升不降），false 表示自动计算 */
  @Column({ type: 'boolean', default: false, name: 'is_manual_member_level' })
  isManualMemberLevel!: boolean;

  /** 真实姓名 */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'real_name' })
  realName!: string | null;

  /** 证件类型 */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'id_card_type' })
  idCardType!: string | null;

  /** 证件号码 */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'id_card' })
  idCard!: string | null;

  /** 是否已实名认证 */
  @Column({ type: 'boolean', default: false, name: 'is_real_name_auth' })
  isRealNameAuth!: boolean;

  /** 实名认证时间 */
  @Column({ type: 'datetime', nullable: true, name: 'real_name_auth_at' })
  realNameAuthAt!: Date | null;

  /** 用户创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 用户最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /** 关联的隐私设置，级联操作 */
  @OneToOne(() => UserPrivacySettingEntity, (privacy) => privacy.user, {
    cascade: true,
  })
  privacySetting!: UserPrivacySettingEntity | null;
}
