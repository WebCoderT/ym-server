import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 会员档案实体
 * 对应数据库 member_profiles 表，存储用户的会员等级与成长信息
 */
@Entity('member_profiles')
@Index('IDX_member_user', ['userId'], { unique: true })
export class MemberProfileEntity {
  /** 档案记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 当前会员等级，默认 1 */
  @Column({ type: 'int', unsigned: true, default: 1 })
  level!: number;

  /** 当前成长值，默认 0 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'growth_value' })
  growthValue!: number;

  /** 累计积分，默认 0 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'total_points' })
  totalPoints!: number;

  /** 档案创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 档案最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * 任务类型枚举
 * 定义会员任务的周期类型
 */
export enum TaskType {
  /** 每日任务 */
  DAILY = 'daily',
  /** 每周任务 */
  WEEKLY = 'weekly',
  /** 周期任务 */
  PERIOD = 'period',
}

/**
 * 任务状态枚举
 * 描述会员任务的可用状态
 */
export enum TaskStatus {
  /** 有效任务 */
  ACTIVE = 'active',
  /** 无效任务 */
  INACTIVE = 'inactive',
}

/**
 * 会员任务实体
 * 对应数据库 member_tasks 表，存储系统定义的会员任务信息
 */
@Entity('member_tasks')
export class MemberTaskEntity {
  /** 任务唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 任务标题 */
  @Column({ type: 'varchar', length: 128 })
  title!: string;

  /** 任务描述，可能为空 */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** 任务类型：每日、每周、周期 */
  @Column({ type: 'enum', enum: TaskType })
  type!: TaskType;

  /** 完成任务获得的积分，默认 0 */
  @Column({ type: 'int', default: 0 })
  points!: number;

  /** 完成任务获得的成长值，默认 0 */
  @Column({ type: 'int', default: 0, name: 'growth_reward' })
  growthReward!: number;

  /** 任务状态，默认有效 */
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status!: TaskStatus;

  /** 任务创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 任务最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * 会员任务记录实体
 * 对应数据库 member_task_records 表，存储用户完成任务的历史记录
 */
@Entity('member_task_records')
@Index('IDX_task_record_user_task', ['userId', 'taskId'])
export class MemberTaskRecordEntity {
  /** 任务记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 任务唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'task_id' })
  taskId!: string;

  /** 是否已完成，默认 false */
  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  /** 任务完成时间，可能为空 */
  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt!: Date | null;

  /** 任务记录创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * 成长记录类型枚举
 * 定义成长记录的来源类型
 */
export enum GrowthRecordType {
  /** 任务奖励 */
  TASK = 'task',
  /** 消费奖励 */
  CONSUME = 'consume',
  /** 升级奖励 */
  UPGRADE = 'upgrade',
  /** 登录奖励 */
  LOGIN = 'login',
}

/**
 * 会员成长记录实体
 * 对应数据库 member_growth_records 表，存储用户成长值变动的历史记录
 */
@Entity('member_growth_records')
@Index('IDX_growth_user', ['userId'])
export class MemberGrowthRecordEntity {
  /** 成长记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户唯一标识 */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 成长记录类型：任务、消费、升级、登录 */
  @Column({ type: 'enum', enum: GrowthRecordType })
  type!: GrowthRecordType;

  /** 成长值变动量，默认 0 */
  @Column({ type: 'int', default: 0 })
  delta!: number;

  /** 变动后的成长值余额，默认 0 */
  @Column({ type: 'int', default: 0, name: 'balance_after' })
  balanceAfter!: number;

  /** 成长记录描述，可能为空 */
  @Column({ type: 'varchar', length: 256, nullable: true })
  description!: string | null;

  /** 成长记录创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
