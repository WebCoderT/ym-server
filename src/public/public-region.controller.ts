/**
 * @fileoverview 公共地区控制器
 * 提供无需认证的省市区数据查询接口
 */

import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RegionService } from '../modules/region/region.service';

@ApiTags('public-region')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('public/regions')
export class PublicRegionController {
  constructor(private readonly regionService: RegionService) {}

  /**
   * 获取地区树（仅启用的地区）
   */
  @Get()
  @ApiOperation({ summary: 'Get active region tree' })
  @ApiOkResponse({
    description: 'Returns tree of active regions (province -> city -> district)',
  })
  async getRegionTree() {
    return this.regionService.getRegionTree();
  }
}
