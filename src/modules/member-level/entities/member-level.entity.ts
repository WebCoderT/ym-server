import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 会员特权配置
 * 每个等级可配置商品折扣、提前购票、急速退款三种特权
 */
export interface MemberPrivileges {
  /** 商品折扣比例，如 0.95 表示 95 折；null 表示不启用 */
  goodsDiscount: number | null;
  /** 是否开启提前购票 */
  earlyTicket: boolean;
  /** 是否开启急速退款 */
  fastRefund: boolean;
}

/**
 * 会员等级实体
 * 对应数据库 member_levels 表，存储会员等级配置
 */
@Entity('member_levels')
export class MemberLevelEntity {
  /** 等级唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 等级名称，如"白银会员" */
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  /** 等级序号，用于排序（1,2,3...） */
  @Column({ type: 'int', unsigned: true })
  level!: number;

  /** 累计消费金额阈值，达到此金额可升级 */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_spending' })
  minSpending!: number;

  /** 等级图标 URL */
  @Column({ type: 'varchar', length: 512, nullable: true })
  icon!: string | null;

  /** 特权配置 JSON */
  @Column({ type: 'json' })
  privileges!: MemberPrivileges;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
