/**
 * @fileoverview 图片分组实体
 * 定义图片分组的表结构与 TypeORM 映射关系。
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 图片分组实体
 *
 * @description
 * 用于对上传的图片进行分类管理，例如按业务模块划分为明星、商品、活动等分组。
 * 分组按 sort 字段升序排列，支持自定义排序。
 */
@Entity('image_groups')
export class ImageGroupEntity {
  /** 分组 ID */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 分组名称 */
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  /** 排序序号，数值越小越靠前 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'sort_order' })
  sortOrder!: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
