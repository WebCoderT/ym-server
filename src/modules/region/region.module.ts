import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from './entities/region.entity';
import { RegionService } from './region.service';

/**
 * 地区模块
 * 负责地区实体的注册及地区服务的提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([RegionEntity])],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
