/**
 * 角色实体模块
 *
 * 定义系统角色表 `roles`，存储角色的基本信息和权限列表。
 * 角色可通过 user_roles 关联表分配给普通用户，
 * 用户登录时聚合所有角色的权限写入 JWT 载荷。
 *
 * @module role.entity
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 角色实体
 *
 * 对应数据库 roles 表，每条记录代表一个可分配给用户的角色。
 * 系统内置角色（is_system = 1）不可被删除，但名称和权限可修改。
 */
@Entity('roles')
@Index('IDX_role_code', ['code'], { unique: true })
export class RoleEntity {
  /** 角色唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 角色显示名称，如"普通用户"、"用户管理员" */
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  /**
   * 角色代码，系统标识，如"REGULAR_USER"、"USER_MANAGER"
   * 唯一，一旦设定不建议修改
   */
  @Column({ type: 'varchar', length: 64, name: 'code' })
  code!: string;

  /** 角色描述，可选 */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /**
   * 权限列表，JSON 数组存储 Permission 枚举值
   * 支持通配符：`client:*` 表示所有客户端权限，`*` 表示所有权限
   */
  @Column({ type: 'json', nullable: false })
  permissions!: string[];

  /**
   * 是否为系统内置角色
   * 1 = 系统角色（不可删除，可修改）
   * 0 = 自定义角色（可删除）
   */
  @Column({ type: 'tinyint', unsigned: true, default: 0, name: 'is_system' })
  isSystem!: number;

  /** 排序权重，越小越靠前 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'sort_order' })
  sortOrder!: number;

  /** 角色创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 角色最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
