/**
 * 角色模块
 *
 * 注册角色相关实体与业务服务，对外导出 RoleService 与 RoleSeedService
 * 供其他模块（如 AuthModule）使用。
 *
 * @module RoleModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleService } from './role.service';
import { RoleSeedService } from './role-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, UserRoleEntity])],
  providers: [RoleService, RoleSeedService],
  exports: [RoleService, RoleSeedService],
})
export class RoleModule {}
