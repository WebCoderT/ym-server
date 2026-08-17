import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
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
import { UpdateSystemConfigRequestDto } from '../modules/system-config/dto/system-config.dto';
import { SystemConfigVo } from '../modules/system-config/vo/system-config.vo';
import { SystemConfigService } from '../modules/system-config/system-config.service';
import { QuickNavService } from '../modules/quick-nav/quick-nav.service';
import { CreateQuickNavItemRequestDto, UpdateQuickNavItemRequestDto } from '../modules/quick-nav/dto/quick-nav.dto';
import { QuickNavItemVo } from '../modules/quick-nav/vo/quick-nav.vo';

/**
 * 管理端系统配置控制器
 * 提供系统基础配置的读取与更新接口，以及快捷导航管理接口
 */
@ApiTags('系统配置')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/system-config')
export class AdminSystemConfigController {
  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly quickNavService: QuickNavService,
  ) {}

  /**
   * 获取系统配置
   */
  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取系统基础配置' })
  @ApiOkResponse({ type: SystemConfigVo })
  async getConfig(): Promise<SystemConfigVo> {
    return this.systemConfigService.getConfig();
  }

  /**
   * 更新系统配置
   */
  @Put()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '更新系统基础配置' })
  @ApiOkResponse({ type: SystemConfigVo })
  async updateConfig(
    @Body() dto: UpdateSystemConfigRequestDto,
  ): Promise<SystemConfigVo> {
    return this.systemConfigService.updateConfig(dto);
  }

  /**
   * 获取快捷导航列表
   */
  @Get('quick-navs')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取快捷导航列表' })
  @ApiOkResponse({ type: [QuickNavItemVo] })
  async getQuickNavs(): Promise<QuickNavItemVo[]> {
    return this.quickNavService.findAll();
  }

  /**
   * 创建快捷导航项
   */
  @Post('quick-navs')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '创建快捷导航项' })
  @ApiOkResponse({ type: QuickNavItemVo })
  async createQuickNav(
    @Body() dto: CreateQuickNavItemRequestDto,
  ): Promise<QuickNavItemVo> {
    return this.quickNavService.create(dto);
  }

  /**
   * 更新快捷导航项
   */
  @Put('quick-navs/:id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '更新快捷导航项' })
  @ApiOkResponse({ type: QuickNavItemVo })
  async updateQuickNav(
    @Param('id') id: string,
    @Body() dto: UpdateQuickNavItemRequestDto,
  ): Promise<QuickNavItemVo> {
    return this.quickNavService.update(id, dto);
  }

  /**
   * 删除快捷导航项
   */
  @Delete('quick-navs/:id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '删除快捷导航项' })
  @ApiOkResponse({ description: '删除成功' })
  async deleteQuickNav(@Param('id') id: string): Promise<void> {
    return this.quickNavService.remove(id);
  }
}
