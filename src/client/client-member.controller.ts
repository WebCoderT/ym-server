/**
 * @fileoverview 客户端会员控制器
 * 提供客户端用户的会员资料查询、任务列表查询、任务完成和成长记录查询功能
 */

// 引入 NestJS 控制器相关装饰器
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

// 引入 Swagger 文档装饰器，用于生成 API 文档
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

// 引入访问级别装饰器，用于控制接口访问权限
import { RequireAccessLevel } from '../access-level.decorator';

// 引入访问级别枚举，定义不同角色的访问权限
import { AccessLevel } from '../access-level.enum';

// 引入权限装饰器
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';

// 引入当前认证信息装饰器，用于获取当前登录用户信息
import { CurrentAuth } from '../current-auth.decorator';

// 引入认证令牌载荷类型，定义 JWT 令牌的数据结构
import type { AuthTokenPayload } from '../auth-token';

// 引入会员相关的 DTO，定义会员业务的数据结构
import {
  GrowthRecordListResponseDto,
  MemberProfileResponseDto,
  MemberTaskListResponseDto,
  MemberTaskRecordListResponseDto,
} from '../modules/member/dto/member.dto';

// 引入会员服务，处理会员相关的业务逻辑
import { MemberService } from '../modules/member/member.service';

/**
 * 客户端会员控制器
 * 负责处理客户端用户的会员相关请求，包括会员资料、任务和成长记录
 * 所有接口都需要客户端级别的访问权限
 */
@ApiTags('client-member')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/member')
export class ClientMemberController {
  /**
   * 构造函数
   * @param memberService - 会员服务实例，用于处理会员相关的业务逻辑
   */
  constructor(private readonly memberService: MemberService) {}

  /**
   * 获取会员资料
   * 返回当前用户的会员等级、积分等会员资料信息
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的会员资料
   */
  @Get('profile')
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Get member profile' })
  @ApiOkResponse({ type: MemberProfileResponseDto })
  async getProfile(
    @CurrentAuth() auth: AuthTokenPayload,
  ): Promise<MemberProfileResponseDto> {
    // 调用会员服务，根据用户 ID 获取会员资料
    return this.memberService.getProfile(auth.sub);
  }

  /**
   * 获取可用任务列表
   * 返回当前用户可以完成的会员任务列表
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回可用任务列表
   */
  @Get('tasks')
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Get available tasks' })
  @ApiOkResponse({ type: MemberTaskListResponseDto })
  async getTasks(
    @CurrentAuth() auth: AuthTokenPayload,
  ): Promise<MemberTaskListResponseDto> {
    // 调用会员服务，根据用户 ID 获取可用任务列表
    return this.memberService.getTaskList(auth.sub);
  }

  /**
   * 完成任务
   * 提交指定任务的完成请求，获取相应的会员积分或奖励
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @param taskId - 任务 ID，路径参数，标识需要完成的任务
   * @returns 返回任务完成后的任务记录列表
   */
  @Post('tasks/:taskId/complete')
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Complete a task' })
  @ApiOkResponse({ type: MemberTaskRecordListResponseDto })
  async completeTask(
    @CurrentAuth() auth: AuthTokenPayload,
    @Param('taskId') taskId: string,
  ): Promise<MemberTaskRecordListResponseDto> {
    // 调用会员服务，根据用户 ID 和任务 ID 完成任务
    return this.memberService.completeTask(auth.sub, taskId);
  }

  /**
   * 获取成长记录
   * 返回当前用户的会员成长历史记录，包括等级变化和积分获取记录
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回成长记录列表
   */
  @Get('records')
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Get growth records' })
  @ApiOkResponse({ type: GrowthRecordListResponseDto })
  async getRecords(
    @CurrentAuth() auth: AuthTokenPayload,
  ): Promise<GrowthRecordListResponseDto> {
    // 调用会员服务，根据用户 ID 获取成长记录
    return this.memberService.getGrowthRecords(auth.sub);
  }
}
