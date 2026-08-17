import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { SessionService } from '../modules/session/session.service';

@ApiTags('admin-session')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/sessions')
export class AdminSessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * 批量查询用户剩余活跃时长
   * @param userIds 逗号分隔的用户 ID 列表
   */
  @Get('remaining')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '批量查询用户剩余活跃时长' })
  @ApiOkResponse()
  async getRemainingTime(@Query('userIds') userIds?: string) {
    if (!userIds) return { remaining: {} };

    const ids = userIds.split(',').map((s) => s.trim()).filter(Boolean);
    const map = await this.sessionService.getUserRemainingSecondsBatch(ids);

    const remaining: Record<string, number> = {};
    map.forEach((v, k) => {
      remaining[k] = v;
    });

    return { remaining };
  }
}
