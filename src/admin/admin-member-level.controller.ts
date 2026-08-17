import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
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
import { PaginationRequestDto } from '../common/dto/pagination.dto';
import {
  CreateMemberLevelRequestDto,
  MemberLevelDto,
  MemberLevelListResponseDto,
  UpdateMemberLevelRequestDto,
} from '../modules/member-level/dto/member-level.dto';
import { MemberLevelService } from '../modules/member-level/member-level.service';

/**
 * 管理员会员等级管理控制器
 * 提供会员等级的增删改查接口，仅限管理员访问
 */
@ApiTags('admin-member-level')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/member-levels')
export class AdminMemberLevelController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  /**
   * 获取会员等级列表
   */
  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'List all member levels' })
  @ApiOkResponse({ type: MemberLevelListResponseDto })
  async list(@Query() pagination: PaginationRequestDto): Promise<MemberLevelListResponseDto> {
    return this.memberLevelService.getList(pagination);
  }

  /**
   * 创建会员等级
   */
  @Post()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Create member level' })
  @ApiOkResponse({ type: MemberLevelDto })
  async create(@Body() body: CreateMemberLevelRequestDto): Promise<MemberLevelDto> {
    return this.memberLevelService.create(body);
  }

  /**
   * 更新会员等级
   */
  @Put(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Update member level' })
  @ApiOkResponse({ type: MemberLevelDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMemberLevelRequestDto,
  ): Promise<MemberLevelDto> {
    return this.memberLevelService.update(id, body);
  }

  /**
   * 删除会员等级
   */
  @Delete(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Delete member level' })
  @ApiOkResponse({ description: 'Deleted successfully' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.memberLevelService.delete(id);
  }
}
