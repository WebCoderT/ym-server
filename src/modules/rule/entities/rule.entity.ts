import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * 规则实体
 * 对应数据库 rules 表，存储系统中固定的规则配置（如粉丝团榜单规则、抽卡规则）
 * 不允许新增/删除，只允许修改内容
 */
@Entity('rules')
export class RuleEntity {
  /** 规则唯一标识，自增 bigint */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 规则编码，唯一标识，如 fan_club_ranking / card_draw */
  @Column({ type: 'varchar', length: 64, unique: true })
  @Index('IDX_rule_code', { unique: true })
  code!: string;

  /** 规则标题（文字） */
  @Column({ type: 'varchar', length: 128 })
  title!: string;

  /** 规则标题图片 URL，与文字标题二选一，优先展示图片标题 */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'title_image' })
  titleImage!: string | null;

  /** 规则内容（富文本 HTML） */
  @Column({ type: 'text' })
  content!: string;

  /** 背景图 URL，可能为空 */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'background_image' })
  backgroundImage!: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 最后更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
