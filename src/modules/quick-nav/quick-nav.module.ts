import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { QuickNavEntity } from './entities/quick-nav.entity';
import { QuickNavService } from './quick-nav.service';

/**
 * 快捷导航模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([QuickNavEntity]), StorageModule],
  providers: [QuickNavService],
  exports: [QuickNavService],
})
export class QuickNavModule {}
