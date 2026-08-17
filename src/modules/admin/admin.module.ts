/**
 * @fileoverview 管理员账户模块
 * 提供管理员账户实体的注册和导出。
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAccountEntity } from './entities/admin-account.entity';

/**
 * 管理员账户模块
 *
 * @description
 * 注册管理员账户实体，供认证模块使用。
 */
@Module({
  imports: [TypeOrmModule.forFeature([AdminAccountEntity])],
  exports: [TypeOrmModule],
})
export class AdminAccountModule {}
