import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 地区实体
 * 对应数据库 regions 表，存储中国行政区划省市区数据
 */
@Entity('regions')
@Index('IDX_region_parent_id', ['parentId'])
@Index('IDX_region_level', ['level'])
@Index('IDX_region_is_active', ['isActive'])
export class RegionEntity {
  /** 地区唯一标识 */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  /** 行政区划代码 */
  @Column({ type: 'varchar', length: 20 })
  code!: string;

  /** 地区名称 */
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  /** 父级地区ID（0表示顶级） */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'parent_id' })
  parentId!: number;

  /** 层级：1省/直辖市，2市，3区/县 */
  @Column({ type: 'tinyint', unsigned: true })
  level!: number;

  /** 排序序号 */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'sort_order' })
  sortOrder!: number;

  /** 是否启用 */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  /** 是否偏远地区 */
  @Column({ type: 'boolean', default: false, name: 'is_remote' })
  isRemote!: boolean;
}
