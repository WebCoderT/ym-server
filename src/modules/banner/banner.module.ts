import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { BannerEntity } from './entities/banner.entity';
import { BannerService } from './banner.service';

/**
 * Banner模块
 * 负责Banner实体的注册及Banner服务的提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([BannerEntity]), StorageModule],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
