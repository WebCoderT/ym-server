/**
 * @fileoverview 管理员地区管理控制器
 * 提供地区数据的管理接口（列表、启用/禁用）
 */

import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
import { RegionService } from '../modules/region/region.service';
import { RegionEntity } from '../modules/region/entities/region.entity';
import { REGION_DATA } from '../modules/region/region-data';

@ApiTags('admin-region')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/regions')
export class AdminRegionController {
  constructor(private readonly regionService: RegionService) {}

  /**
   * 获取地区树
   */
  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Get region tree' })
  @ApiOkResponse({ type: [RegionEntity] })
  async getRegions(@Query('level') level?: string) {
    const regions = await this.regionService.getAllRegions();
    if (level) {
      const levelNum = Number(level);
      return regions.filter((r) => r.level === levelNum);
    }
    return regions;
  }

  /**
   * 初始化地区数据
   */
  @Post('init')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Initialize region data from standard dataset' })
  @ApiOkResponse({ description: 'Region data initialized' })
  async initRegions() {
    const result = await this.regionService.initFromRegionData(REGION_DATA);
    return { message: '地区数据初始化成功', count: result.count };
  }

  /**
   * 启用/禁用地区
   */
  @Patch(':id/toggle')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Toggle region active status' })
  @ApiOkResponse({ type: RegionEntity })
  async toggleRegion(
    @Param('id') id: string,
    @Query('active') active?: string,
  ) {
    const isActive = active !== 'false';
    return this.regionService.toggleRegionActive(Number(id), isActive);
  }

  /**
   * 设置偏远地区标记
   */
  @Patch(':id/toggle-remote')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: 'Toggle region remote area status' })
  @ApiOkResponse({ type: RegionEntity })
  async toggleRemote(
    @Param('id') id: string,
    @Query('isRemote') isRemote?: string,
  ) {
    const isRemoteBool = isRemote !== 'false';
    return this.regionService.toggleRegionRemote(Number(id), isRemoteBool);
  }
}
