import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BannerLinkType } from '../enums/banner-link-type.enum';
import { BannerStatus } from '../enums/banner-status.enum';

// Re-export enums for backward compatibility
export { BannerStatus } from '../enums/banner-status.enum';
export { BannerLinkType } from '../enums/banner-link-type.enum';

/**
 * Banner实体
 * 对应数据库 banners 表
 */
@Entity('banners')
@Index('IDX_banner_status', ['status'])
@Index('IDX_banner_priority', ['priority'])
export class BannerEntity {
  /** Banner唯一标识 */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Banner标题 */
  @Column({ type: 'varchar', length: 128 })
  title!: string;

  /** Banner图片URL */
  @Column({ type: 'varchar', length: 512 })
  image!: string;

  /** 跳转类型 */
  @Column({ type: 'enum', enum: BannerLinkType, name: 'link_type' })
  linkType!: BannerLinkType;

  /** 跳转目标 */
  @Column({ type: 'varchar', length: 128, name: 'link_target' })
  linkTarget!: string;

  /** 介绍 */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** 标签列表，以逗号分隔存储 */
  @Column({ type: 'simple-array', nullable: true })
  tags!: string[] | null;

  /** 生效开始时间 */
  @Column({ type: 'date', name: 'start_time' })
  startTime!: Date;

  /** 生效结束时间 */
  @Column({ type: 'date', name: 'end_time' })
  endTime!: Date;

  /** 状态 */
  @Column({ type: 'enum', enum: BannerStatus, default: BannerStatus.ACTIVE })
  status!: BannerStatus;

  /** 优先级，数字越小越靠前 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  priority!: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
