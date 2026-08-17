/**
 * 角色种子服务
 *
 * 负责在应用启动时确保系统内置角色存在。
 * 若数据库中没有这些角色，则自动种入；若已存在则不覆盖。
 *
 * @module role-seed.service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { Permission, PERMISSION_WILDCARD_ALL } from '../../permission.enum';

/**
 * 系统内置角色代码常量
 */
export const SYSTEM_ROLE_CODES = {
  REGULAR_USER: 'REGULAR_USER',
  USER_MANAGER: 'USER_MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

/**
 * 系统内置角色定义
 *
 * 应用启动时按此定义种入数据库，已存在则跳过。
 */
const SYSTEM_ROLE_SEEDS = [
  {
    code: SYSTEM_ROLE_CODES.REGULAR_USER,
    name: '普通用户',
    description: '所有小程序用户默认角色，拥有客户端基础权限',
    permissions: ['client:*'],
    sortOrder: 0,
  },
  {
    code: SYSTEM_ROLE_CODES.USER_MANAGER,
    name: '用户管理员',
    description: '拥有普通用户所有权限，并可管理部分后台功能',
    permissions: [
      'client:*',
      Permission.ADMIN_USER,
      Permission.ADMIN_CONTENT,
    ],
    sortOrder: 1,
  },
  {
    code: SYSTEM_ROLE_CODES.SUPER_ADMIN,
    name: '超级管理员',
    description: '拥有系统所有权限（为未来 admin 账户角色化预留）',
    permissions: [PERMISSION_WILDCARD_ALL],
    sortOrder: 999,
  },
];

@Injectable()
export class RoleSeedService {
  private readonly logger = new Logger('RoleSeed');
  private seeded = false;

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  /**
   * 若系统角色不存在则种入
   * 应用生命周期内仅执行一次
   */
  async seedIfMissing(): Promise<void> {
    if (this.seeded) return;

    try {
      const existingCodes = await this.roleRepo
        .find({
          where: { code: In(SYSTEM_ROLE_SEEDS.map((s) => s.code)) },
          select: ['code'],
        })
        .then((roles) => new Set(roles.map((r) => r.code)));

      const toSeed = SYSTEM_ROLE_SEEDS.filter((s) => !existingCodes.has(s.code));

      if (toSeed.length === 0) {
        this.seeded = true;
        return;
      }

      const entities = toSeed.map((seed) =>
        this.roleRepo.create({
          ...seed,
          isSystem: 1,
        }),
      );

      await this.roleRepo.save(entities);
      this.logger.log(
        `已种入 ${toSeed.length} 个系统角色：${toSeed.map((s) => s.name).join('、')}`,
      );

      this.seeded = true;
    } catch (err) {
      // 种子失败不阻塞应用启动，仅打印警告
      this.logger.warn(`系统角色种入失败：${(err as Error).message}`);
    }
  }
}
