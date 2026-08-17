/**
 * @fileoverview 图片管理模块
 * 聚合图片实体、服务与数据访问层。
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { ImageEntity } from './entities/image.entity';
import { ImageGroupEntity } from './entities/image-group.entity';
import { ImageService } from './image.service';

/**
 * 图片模块
 *
 * @description
 * 提供图片元数据和分组的持久化能力，通过 exports 暴露 ImageService 供管理端控制器使用。
 */
@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity, ImageGroupEntity]), StorageModule],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
