import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { RuleEntity } from './entities/rule.entity';
import { RuleService } from './rule.service';

/**
 * 规则模块
 * 提供规则实体的注册及规则服务的提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([RuleEntity]), StorageModule],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}
