import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 快捷导航项实体
 * 对应数据库 quick_navs 表
 */
@Entity('quick_navs')
export class QuickNavEntity {
  /** 导航项唯一标识 */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 图标 URL */
  @Column({ type: 'varchar', length: 512, default: '' })
  icon!: string;

  /** 显示文字 */
  @Column({ type: 'varchar', length: 32, default: '' })
  label!: string;

  /** 跳转地址 */
  @Column({ type: 'varchar', length: 512, default: '' })
  url!: string;

  /** 跳转方式：对应 uni-app 的跳转方式 */
  @Column({ type: 'varchar', length: 32, default: 'navigate', name: 'open_type' })
  openType!: string;

  /** 排序号，数字越小越靠前 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  sort!: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
