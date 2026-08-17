/**
 * 管理员角色权限控制器
 *
 * 提供角色 CRUD 与用户角色分配接口，仅限管理员访问。
 * 角色是权限的集合，用户可通过分配角色获得对应的细粒度权限。
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { AssignRoleRequestDto, CreateRoleRequestDto, UpdateRoleRequestDto } from '../modules/role/dto/role.dto';
import { RoleVo, RoleListResponseVo, UserRoleVo, UserRoleListResponseVo } from '../modules/role/vo/role.vo';
import { RoleService } from '../modules/role/role.service';
import { resolveAuthPayloadFromRequest } from '../auth-token';

@ApiTags('admin-role')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/roles')
export class AdminRoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 查询全部角色列表
   * 首次调用会触发系统角色的自动种入
   */
  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'List all roles' })
  @ApiOkResponse({ type: RoleListResponseVo })
  async list(): Promise<RoleListResponseVo> {
    const items = await this.roleService.listAll();
    return { audience: AccessLevel.ADMIN, items };
  }

  /**
   * 查询单个角色详情
   */
  @Get(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiOkResponse({ type: RoleVo })
  async getById(@Param('id') id: string): Promise<RoleVo> {
    return this.roleService.getById(id);
  }

  /**
   * 创建自定义角色
   */
  @Post()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiOkResponse({ type: RoleVo })
  async create(@Body() body: CreateRoleRequestDto): Promise<RoleVo> {
    return this.roleService.create(body);
  }

  /**
   * 更新角色（名称、描述、权限、排序）
   * 系统角色的 code 不可修改
   */
  @Put(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Update a role' })
  @ApiOkResponse({ type: RoleVo })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRoleRequestDto,
  ): Promise<RoleVo> {
    return this.roleService.update(id, body);
  }

  /**
   * 删除自定义角色
   * 系统内置角色不可删除
   */
  @Delete(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a non-system role' })
  @ApiNoContentResponse({ description: 'Role deleted successfully' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.roleService.delete(id);
  }
}

/**
 * 用户角色分配控制器
 *
 * 提供查询与操作用户角色的接口，用于在管理端给用户分配/移除角色。
 */
@ApiTags('admin-user-role')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/users/:userId/roles')
export class AdminUserRoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 查询用户已分配的角色列表
   */
  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'List user roles' })
  @ApiOkResponse({ type: UserRoleListResponseVo })
  async listUserRoles(
    @Param('userId') userId: string,
  ): Promise<UserRoleListResponseVo> {
    const items = await this.roleService.getUserRoles(userId);
    return { audience: AccessLevel.ADMIN, items };
  }

  /**
   * 为用户分配角色
   */
  @Post()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @HttpCode(204)
  @ApiOperation({ summary: 'Assign a role to user' })
  @ApiNoContentResponse({ description: 'Role assigned successfully' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: AssignRoleRequestDto,
  ): Promise<void> {
    // TODO: 从请求上下文中获取操作管理员 ID
    await this.roleService.assignRole(userId, body.roleId, null);
  }

  /**
   * 移除用户的指定角色
   */
  @Delete(':roleId')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a role from user' })
  @ApiNoContentResponse({ description: 'Role removed successfully' })
  async removeUserRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    await this.roleService.removeUserRole(userId, roleId);
  }
}
