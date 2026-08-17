/**
 * 角色服务
 *
 * 提供角色 CRUD、用户角色分配、权限聚合等核心业务逻辑。
 *
 * @module role.service
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { CreateRoleRequestDto, UpdateRoleRequestDto } from './dto/role.dto';
import { RoleVo, UserRoleVo } from './vo/role.vo';
import { mergePermissions } from '../../permissions.matcher';
import { RoleSeedService, SYSTEM_ROLE_CODES } from './role-seed.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
    private readonly roleSeedService: RoleSeedService,
  ) {}

  /* ─────────── 角色 CRUD ─────────── */

  /**
   * 查询全部角色列表
   */
  async listAll(): Promise<RoleVo[]> {
    // 确保系统角色已种入
    await this.roleSeedService.seedIfMissing();

    const roles = await this.roleRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
    return roles.map((r) => this.toDto(r));
  }

  /**
   * 查询单个角色详情
   */
  async getById(roleId: string): Promise<RoleVo> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`角色不存在：${roleId}`);
    return this.toDto(role);
  }

  /**
   * 通过 code 查询角色
   */
  async getByCode(code: string): Promise<RoleEntity | null> {
    return this.roleRepo.findOne({ where: { code } });
  }

  /**
   * 创建自定义角色
   * 系统角色 code 不可重复创建
   */
  async create(body: CreateRoleRequestDto): Promise<RoleVo> {
    await this.roleSeedService.seedIfMissing();

    const existing = await this.roleRepo.findOne({ where: { code: body.code } });
    if (existing) {
      throw new ConflictException(`角色代码已存在：${body.code}`);
    }

    const role = this.roleRepo.create({
      name: body.name,
      code: body.code,
      description: body.description ?? null,
      permissions: body.permissions,
      isSystem: 0,
      sortOrder: body.sortOrder ?? 0,
    });

    await this.roleRepo.save(role);
    return this.toDto(role);
  }

  /**
   * 更新角色
   * 系统角色不可修改 code，其他字段可改
   */
  async update(roleId: string, body: UpdateRoleRequestDto): Promise<RoleVo> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`角色不存在：${roleId}`);

    if (body.name !== undefined) role.name = body.name;
    if (body.description !== undefined) role.description = body.description;
    if (body.permissions !== undefined) role.permissions = body.permissions;
    if (body.sortOrder !== undefined) role.sortOrder = body.sortOrder;

    await this.roleRepo.save(role);
    return this.toDto(role);
  }

  /**
   * 删除角色
   * 系统角色不可删除
   */
  async delete(roleId: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`角色不存在：${roleId}`);
    if (role.isSystem === 1) {
      throw new BadRequestException(`系统内置角色不可删除：${role.name}`);
    }

    // 同时清理关联的用户角色记录
    await this.userRoleRepo.delete({ roleId });
    await this.roleRepo.remove(role);
  }

  /* ─────────── 用户角色分配 ─────────── */

  /**
   * 查询用户的已分配角色
   */
  async getUserRoles(userId: string): Promise<UserRoleVo[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      order: { assignedAt: 'ASC' },
    });

    if (userRoles.length === 0) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    return userRoles.map((ur) => {
      const role = roleMap.get(ur.roleId);
      return {
        roleId: ur.roleId,
        roleName: role?.name ?? '未知角色',
        roleCode: role?.code ?? 'UNKNOWN',
        permissions: role?.permissions ?? [],
        assignedAt: ur.assignedAt.toISOString(),
      };
    });
  }

  /**
   * 为用户分配角色
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string | null,
  ): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`角色不存在：${roleId}`);

    const existing = await this.userRoleRepo.findOne({
      where: { userId, roleId },
    });
    if (existing) {
      throw new ConflictException(`用户已拥有角色：${role.name}`);
    }

    const userRole = this.userRoleRepo.create({
      userId,
      roleId,
      assignedBy,
    });
    await this.userRoleRepo.save(userRole);
  }

  /**
   * 移除用户的角色
   */
  async removeUserRole(userId: string, roleId: string): Promise<void> {
    const result = await this.userRoleRepo.delete({ userId, roleId });
    if (result.affected === 0) {
      throw new NotFoundException(`用户未拥有该角色`);
    }
  }

  /* ─────────── 权限聚合 ─────────── */

  /**
   * 聚合用户所有角色的权限列表（用于写入 JWT 载荷）
   */
  async aggregateUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({ where: { userId } });
    if (userRoles.length === 0) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });

    return mergePermissions(...roles.map((r) => r.permissions));
  }

  /* ─────────── 工具方法 ─────────── */

  private toDto(role: RoleEntity): RoleVo {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: role.permissions ?? [],
      isSystem: role.isSystem === 1,
      sortOrder: role.sortOrder,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
