import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { CurrentAuth } from '../current-auth.decorator';
import type { AuthTokenPayload } from '../auth-token';
import { WithdrawalService } from '../modules/wallet/withdrawal.service';
import { WithdrawalStatus } from '../modules/wallet/entities/withdrawal-request.entity';
import { DecideWithdrawalRequestDto } from '../modules/wallet/dto/withdrawal.dto';
import {
  AdminWithdrawalRequestVo,
  AdminWithdrawalRequestListResponseVo,
} from '../modules/wallet/vo/withdrawal.vo';

/**
 * 管理端提现审核控制器
 * 提供提现申请的查看、通过、驳回功能
 */
@ApiTags('admin-withdrawal')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/withdrawals')
export class AdminWithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  /**
   * 查询提现申请列表
   * 支持按状态过滤，默认按创建时间倒序
   */
  @Get()
  @RequirePermission(Permission.ADMIN_WITHDRAWAL)
  @ApiOperation({ summary: 'List withdrawal requests (with optional status filter)' })
  @ApiOkResponse({ type: AdminWithdrawalRequestListResponseVo })
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: WithdrawalStatus,
  ): Promise<AdminWithdrawalRequestListResponseVo> {
    return this.withdrawalService.adminListRequests(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      status,
    );
  }

  /**
   * 审核通过提现申请
   */
  @Post(':id/approve')
  @RequirePermission(Permission.ADMIN_WITHDRAWAL)
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  @ApiOkResponse({ type: AdminWithdrawalRequestVo })
  async approve(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthTokenPayload,
  ): Promise<AdminWithdrawalRequestVo> {
    return this.withdrawalService.adminApprove(id, auth.sub);
  }

  /**
   * 驳回提现申请（金额退回用户余额）
   */
  @Post(':id/reject')
  @RequirePermission(Permission.ADMIN_WITHDRAWAL)
  @ApiOperation({ summary: 'Reject a withdrawal request (refund to user balance)' })
  @ApiOkResponse({ type: AdminWithdrawalRequestVo })
  async reject(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: DecideWithdrawalRequestDto,
  ): Promise<AdminWithdrawalRequestVo> {
    return this.withdrawalService.adminReject(id, auth.sub, body.rejectReason);
  }
}
