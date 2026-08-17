import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberProfileEntity } from './entities/member.entity';
import { MemberTaskEntity } from './entities/member.entity';
import { MemberTaskRecordEntity } from './entities/member.entity';
import { MemberGrowthRecordEntity } from './entities/member.entity';
import { MemberService } from './member.service';

/**
 * 会员模块
 * 负责会员档案、任务、任务记录及成长记录等实体的注册及会员服务的提供
 */
@Module({
  // 导入 TypeORM 特性模块，注册会员相关实体
  imports: [
    TypeOrmModule.forFeature([
      MemberProfileEntity,
      MemberTaskEntity,
      MemberTaskRecordEntity,
      MemberGrowthRecordEntity,
    ]),
  ],
  // 注册会员服务为提供者
  providers: [MemberService],
  // 导出会员服务，供控制器或其他模块使用
  exports: [MemberService],
})
export class MemberModule {}
