/**
 * 管理员会员任务管理控制器模块
 * 本模块提供管理员对会员任务进行管理操作的接口，
 * 包括查询任务列表、创建任务、更新任务信息以及删除任务等功能。
 */
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
import {
  AdminTaskListResponseDto,
  CreateTaskRequestDto,
  MemberTaskDto,
  UpdateTaskRequestDto,
} from '../modules/member/dto/member.dto';
import { PaginationRequestDto } from '../common/dto/pagination.dto';
import { MemberService } from '../modules/member/member.service';

/**
 * 管理员会员任务管理控制器
 * 所有接口需要管理员权限（ADMIN）才能访问，
 * 路由前缀为 /admin/member。
 */
@ApiTags('admin-member')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/member')
export class AdminMemberController {
  /**
   * 构造函数
   * 注入 MemberService 实例，用于处理会员相关的业务逻辑。
   * @param memberService - 会员服务实例
   */
  constructor(private readonly memberService: MemberService) {}

  /**
   * 获取会员任务列表
   * 查询系统中所有的会员任务信息，仅供管理员查看。
   * @returns 返回管理员视角的会员任务列表响应对象
   */
  @Get('tasks')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'List all tasks for admin' })
  @ApiOkResponse({ type: AdminTaskListResponseDto })
  async listTasks(
    @Query() pagination: PaginationRequestDto,
  ): Promise<AdminTaskListResponseDto> {
    // 调用会员服务查询所有会员任务数据
    return this.memberService.listAdminTasks(pagination);
  }

  /**
   * 创建新会员任务
   * 接收管理员提交的任务创建请求，在系统中新增一个会员任务。
   * @param body - 创建任务请求数据传输对象
   * @returns 返回新创建的会员任务信息
   */
  @Post('tasks')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Create new task' })
  @ApiOkResponse({ type: MemberTaskDto })
  async createTask(@Body() body: CreateTaskRequestDto): Promise<MemberTaskDto> {
    // 调用会员服务执行任务创建逻辑
    return this.memberService.createTask(body);
  }

  /**
   * 更新会员任务信息
   * 根据任务 ID 更新指定会员任务的信息。
   * @param taskId - 会员任务唯一标识符
   * @param body - 更新任务请求数据传输对象
   * @returns 返回更新后的会员任务信息
   */
  @Put('tasks/:taskId')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Update task' })
  @ApiOkResponse({ type: MemberTaskDto })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskRequestDto,
  ): Promise<MemberTaskDto> {
    // 调用会员服务更新指定任务的数据
    return this.memberService.updateTask(taskId, body);
  }

  /**
   * 删除指定会员任务
   * 根据任务 ID 删除系统中的会员任务记录。
   * @param taskId - 待删除会员任务的唯一标识符
   */
  @Delete('tasks/:taskId')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Delete task' })
  @ApiOkResponse({ description: 'Deleted successfully' })
  async deleteTask(@Param('taskId') taskId: string): Promise<void> {
    // 调用会员服务执行任务删除操作
    return this.memberService.deleteTask(taskId);
  }
}
