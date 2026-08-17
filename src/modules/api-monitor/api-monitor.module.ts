import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLogEntity } from './entities/api-log.entity';
import { ApiMonitorService } from './api-monitor.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLogEntity])],
  providers: [ApiMonitorService],
  exports: [ApiMonitorService],
})
export class ApiMonitorModule {}
