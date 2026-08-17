import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { RoleModule } from '../role/role.module';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from './entities/user.entity';
import { UserPrivacySettingEntity } from './entities/user-privacy-setting.entity';
import { UserService } from './user.service';
import { MemberLevelModule } from '@modules/member-level/member-level.module';

/**
 * 用户模块（全局模块）
 *
 * 负责用户实体、隐私设置及用户服务的注册与导出。
 * 通过 @Global() 装饰器标记为全局模块，使得 UserService 在整个应用中可用，
 * 无需在每个模块中显式导入 UserModule。
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserPrivacySettingEntity]),
    StorageModule,
    SystemConfigModule,
    RoleModule,
    MemberLevelModule,
    forwardRef(() => AuthModule),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
