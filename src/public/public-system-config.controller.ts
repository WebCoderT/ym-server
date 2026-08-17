import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { SystemConfigService } from '../modules/system-config/system-config.service';
import { SystemConfigVo } from '../modules/system-config/vo/system-config.vo';
import { QuickNavService } from '../modules/quick-nav/quick-nav.service';
import { QuickNavItemVo } from '../modules/quick-nav/vo/quick-nav.vo';

/**
 * 公共系统配置控制器
 * 提供无需鉴权的系统基础配置读取接口
 */
@ApiTags('系统配置')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('public/system-config')
export class PublicSystemConfigController {
  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly quickNavService: QuickNavService,
  ) {}

  /**
   * 获取系统配置
   */
  @Get()
  @ApiOperation({ summary: '获取系统基础配置' })
  @ApiOkResponse({ type: SystemConfigVo })
  async getConfig(): Promise<SystemConfigVo> {
    return this.systemConfigService.getConfig();
  }

  /**
   * 获取快捷导航列表
   */
  @Get('quick-navs')
  @ApiOperation({ summary: '获取快捷导航列表' })
  @ApiOkResponse({ type: [QuickNavItemVo] })
  async getQuickNavs(): Promise<QuickNavItemVo[]> {
    return this.quickNavService.findAll();
  }
}
