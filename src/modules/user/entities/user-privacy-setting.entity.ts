import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * 资料可见性枚举
 * 控制用户资料页面对外的可见范围
 */
export enum ProfileVisibility {
  /** 公开：所有人可见 */
  PUBLIC = 1,
  /** 仅粉丝可见 */
  FANS_ONLY = 2,
  /** 私密：仅自己可见 */
  PRIVATE = 3,
}

/**
 * 手机号可见性枚举
 * 控制用户手机号的可见范围
 */
export enum PhoneVisibility {
  /** 公开：所有人可见 */
  PUBLIC = 1,
  /** 仅好友可见 */
  FRIENDS_ONLY = 2,
  /** 私密：仅自己可见 */
  PRIVATE = 3,
}

/**
 * 打赏记录可见性枚举
 * 控制用户打赏记录的可见范围
 */
export enum RewardVisibility {
  /** 公开：所有人可见 */
  PUBLIC = 1,
  /** 仅好友可见 */
  FRIENDS_ONLY = 2,
  /** 私密：仅自己可见 */
  PRIVATE = 3,
}

/**
 * 用户隐私设置实体
 * 对应数据库 user_privacy_setting 表，存储用户的隐私配置
 */
@Entity('user_privacy_setting')
export class UserPrivacySettingEntity {
  /** 隐私设置记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 关联的用户ID */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 资料可见性，默认公开 */
  @Column({
    type: 'tinyint',
    default: ProfileVisibility.PUBLIC,
    name: 'profile_visibility',
  })
  profileVisibility!: ProfileVisibility;

  /** 手机号可见性，默认私密 */
  @Column({
    type: 'tinyint',
    default: PhoneVisibility.PRIVATE,
    name: 'phone_visibility',
  })
  phoneVisibility!: PhoneVisibility;

  /** 打赏记录可见性，默认仅好友可见 */
  @Column({
    type: 'tinyint',
    default: RewardVisibility.FRIENDS_ONLY,
    name: 'reward_visibility',
  })
  rewardVisibility!: RewardVisibility;

  /** 是否允许陌生人私信：0-不允许，1-允许，默认 0 */
  @Column({
    type: 'tinyint',
    default: 0,
    name: 'allow_stranger_message',
  })
  allowStrangerMessage!: number;

  /** 隐私设置最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /** 关联的用户实体，一对一关系 */
  @OneToOne(() => UserEntity, (user) => user.privacySetting)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
