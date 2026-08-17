import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { SystemConfigEntity } from './entities/system-config.entity';
import { SystemConfigService } from './system-config.service';

/**
 * 系统配置模块
 * 负责系统配置实体的注册及系统配置服务的提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity]), StorageModule],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
