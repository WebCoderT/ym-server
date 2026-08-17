/**
 * 用户-角色关联实体模块
 *
 * 定义 user_roles 表，实现用户与角色的多对多关系。
 * 一个用户可以拥有多个角色，角色的权限取并集。
 *
 * @module user-role.entity
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 用户-角色关联实体
 *
 * 对应数据库 user_roles 表，每条记录代表某用户被分配了某角色。
 */
@Entity('user_roles')
@Index('IDX_user_role_user', ['userId'])
@Index('IDX_user_role_role', ['roleId'])
@Index('IDX_user_role_unique', ['userId', 'roleId'], { unique: true })
export class UserRoleEntity {
  /** 关联记录唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 用户 ID，关联 user 表 */
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  /** 角色 ID，关联 roles 表 */
  @Column({ type: 'varchar', length: 64, name: 'role_id' })
  roleId!: string;

  /**
   * 分配人 ID，关联 admin_accounts 表
   * 记录是哪位管理员执行的角色分配操作，便于审计
   */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'assigned_by' })
  assignedBy!: string | null;

  /** 角色分配时间 */
  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
