/**
 * @fileoverview 存储模块
 * 聚合存储配置、本地存储、OSS 存储服务以及 OSS 签名控制器。
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageConfigEntity } from './entities/storage-config.entity';
import { StorageConfigService } from './storage-config.service';
import { LocalStorageService } from './local-storage.service';
import { OssStorageService } from './oss-storage.service';
import { OssSignatureService } from './oss-signature.service';
import { OssController } from './controllers/oss.controller';

/**
 * 存储模块
 *
 * @description
 * 提供存储配置管理及两种存储实现（本地磁盘、阿里云 OSS），通过 StorageConfigService 动态切换。
 * 同时提供 OSS 直传签名服务及对应的 HTTP 接口。
 */
@Module({
  imports: [TypeOrmModule.forFeature([StorageConfigEntity])],
  providers: [StorageConfigService, LocalStorageService, OssStorageService, OssSignatureService],
  controllers: [OssController],
  exports: [StorageConfigService, LocalStorageService, OssStorageService, OssSignatureService],
})
export class StorageModule {}
