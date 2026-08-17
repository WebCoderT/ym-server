import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { UserEntity } from '../user/entities/user.entity';
import { MemberLevelEntity } from './entities/member-level.entity';
import { MemberLevelService } from './member-level.service';

/**
 * 会员等级模块
 * 提供会员等级配置的管理及用户等级计算服务
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MemberLevelEntity, UserEntity]),
    StorageModule,
  ],
  providers: [MemberLevelService],
  exports: [MemberLevelService],
})
export class MemberLevelModule {}
