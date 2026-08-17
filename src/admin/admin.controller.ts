/**
 * 管理员通用控制器模块
 * 本模块提供管理员专属的基础管理接口，
 * 用于查询仅管理员可见的用户列表等管理操作。
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { UserService } from '../modules/user/user.service';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUpdateUserMemberLevelDto,
  AdminUpdateUserStatusDto,
} from '../modules/user/dto/user.dto';
import { AdminUserListResponseVo, UserInfoVo } from '../modules/user/vo/user.vo';

/**
 * 管理员通用控制器
 * 所有接口需要管理员权限（ADMIN）才能访问，
 * 路由前缀为 /admin/users。
 */
@ApiTags('admin')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/users')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户列表
   */
  @Get()
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '获取用户列表' })
  @ApiOkResponse({ type: AdminUserListResponseVo })
  async getUsers(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.userService.adminGetUsers({
      keyword,
      status: status !== undefined ? Number(status) : undefined,
      page: page ?? 1,
      pageSize: pageSize ?? 10,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: result.items,
      pagination: {
        total: result.total,
        page: page ?? 1,
        pageSize: pageSize ?? 10,
        totalPages: Math.ceil(result.total / (pageSize ?? 10)),
      },
    };
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '获取用户详情' })
  @ApiOkResponse({ type: UserInfoVo })
  async getUserById(@Param('id') id: string) {
    return this.userService.adminGetUserById(id);
  }

  /**
   * 创建用户
   */
  @Post()
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '创建用户' })
  @ApiOkResponse({ type: UserInfoVo })
  async createUser(@Body() body: AdminCreateUserDto) {
    return this.userService.adminCreateUser(body);
  }

  /**
   * 更新用户
   */
  @Patch(':id')
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '更新用户' })
  @ApiOkResponse({ type: UserInfoVo })
  async updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto) {
    return this.userService.adminUpdateUser(id, body);
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @RequirePermission(Permission.ADMIN_USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.adminDeleteUser(id);
  }

  /**
   * 更新用户状态（禁用/冻结/恢复）
   */
  @Patch(':id/status')
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '更新用户状态' })
  @ApiOkResponse({ type: UserInfoVo })
  async updateUserStatus(@Param('id') id: string, @Body() body: AdminUpdateUserStatusDto) {
    return this.userService.adminUpdateUserStatus(id, body);
  }

  /**
   * 更新用户会员等级（手动设置）
   */
  @Patch(':id/member-level')
  @RequirePermission(Permission.ADMIN_USER)
  @ApiOperation({ summary: '更新用户会员等级' })
  @ApiOkResponse({ type: UserInfoVo })
  async updateUserMemberLevel(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserMemberLevelDto,
  ) {
    return this.userService.adminUpdateUserMemberLevel(id, body.memberLevelId ?? null);
  }
}
