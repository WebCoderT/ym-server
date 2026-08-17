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
import { ApiMonitorService } from '../modules/api-monitor/api-monitor.service';

@ApiTags('admin-api-monitor')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/api-monitor')
export class AdminApiMonitorController {
  constructor(private readonly monitorService: ApiMonitorService) {}

  /** 分页查询 API 日志 */
  @Get('logs')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '查询 API 请求日志' })
  @ApiOkResponse()
  async getLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('method') method?: string,
    @Query('statusCode') statusCode?: string,
    @Query('userId') userId?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('url') urlKeyword?: string,
    @Query('success') success?: string,
    @Query('slow') slowOnly?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.monitorService.findLogs({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      method,
      statusCode: statusCode ? parseInt(statusCode, 10) : undefined,
      userId,
      accessLevel,
      urlKeyword,
      success: success !== undefined ? success === 'true' : undefined,
      slowOnly: slowOnly === 'true',
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  /** 获取统计摘要 */
  @Get('summary')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取 API 监控统计摘要' })
  @ApiOkResponse()
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const [summary, statusDistribution] = await Promise.all([
      this.monitorService.getSummary(
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      ),
      this.monitorService.getStatusDistribution(
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      ),
    ]);

    return {
      ...summary,
      statusDistribution,
    };
  }

  /** 获取端点聚合统计 */
  @Get('endpoints')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取 API 端点聚合统计' })
  @ApiOkResponse()
  async getEndpoints(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.monitorService.getEndpointStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
