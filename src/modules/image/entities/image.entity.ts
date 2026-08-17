/**
 * @fileoverview 图片实体
 * 定义图片资源的表结构与 TypeORM 映射关系。
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 图片实体
 *
 * @description
 * 存储所有通过管理端上传到阿里云 OSS 的图片元数据，包括访问 URL、原始文件名、所属分组和文件大小。
 * 实际文件存储在 OSS，本表仅保留元数据便于管理和检索。
 */
@Entity('images')
@Index('IDX_image_group_id', ['groupId'])
@Index('IDX_image_created_at', ['createdAt'])
export class ImageEntity {
  /** 图片 ID */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 阿里云 OSS 访问 URL */
  @Column({ type: 'varchar', length: 512, name: 'url' })
  url!: string;

  /** OSS 存储路径（key） */
  @Column({ type: 'varchar', length: 256, name: 'oss_key' })
  ossKey!: string;

  /** 原始文件名 */
  @Column({ type: 'varchar', length: 128, name: 'file_name' })
  fileName!: string;

  /** 文件大小（字节） */
  @Column({ type: 'int', unsigned: true, default: 0, name: 'file_size' })
  fileSize!: number;

  /** 所属分组 ID */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'group_id' })
  groupId!: string | null;

  /** 上传者管理员 ID（可选） */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'uploader_id' })
  uploaderId!: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
