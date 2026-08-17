/**
 * @fileoverview 存储配置实体
 * 定义存储策略配置的表结构与 TypeORM 映射关系。
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 存储配置实体
 *
 * @description
 * 管理系统文件存储的全局配置，支持本地存储和阿里云 OSS 两种策略。
 * 表中仅有一条记录（id=1），通过更新该记录实现配置切换。
 */
@Entity('storage_config')
export class StorageConfigEntity {
  /** 配置 ID，固定为 1 */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 存储提供商：local 本地存储 / oss 阿里云 OSS */
  @Column({ type: 'varchar', length: 16, default: 'local' })
  provider!: string;

  /** 本地存储基础访问 URL */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'local_base_url' })
  localBaseUrl!: string | null;

  /** 本地存储文件保存目录 */
  @Column({ type: 'varchar', length: 256, nullable: true, name: 'local_storage_path' })
  localStoragePath!: string | null;

  /** OSS 地域节点 */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'oss_region' })
  ossRegion!: string | null;

  /** OSS 存储空间名称 */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'oss_bucket' })
  ossBucket!: string | null;

  /** OSS AccessKey ID */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'oss_access_key_id' })
  ossAccessKeyId!: string | null;

  /** OSS AccessKey Secret */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'oss_access_key_secret' })
  ossAccessKeySecret!: string | null;

  /** OSS Endpoint */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'oss_endpoint' })
  ossEndpoint!: string | null;

  /** OSS CDN 加速域名 */
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'oss_cdn_domain' })
  ossCdnDomain!: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
