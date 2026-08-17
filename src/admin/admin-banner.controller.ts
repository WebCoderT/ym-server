/**
 * 管理员Banner管理控制器
 */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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
import { CreateBannerRequestDto, UpdateBannerRequestDto } from '../modules/banner/dto/banner.dto';
import { AdminBannerListResponseVo, BannerSummaryVo } from '../modules/banner/vo/banner.vo';
import { BannerService } from '../modules/banner/banner.service';

@ApiTags('admin-banner')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/banners')
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'List all banners for admin' })
  @ApiOkResponse({ type: AdminBannerListResponseVo })
  async listBanners(): Promise<AdminBannerListResponseVo> {
    return this.bannerService.listAdminBanners();
  }

  @Get(':bannerId')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Get banner detail' })
  @ApiOkResponse({ type: BannerSummaryVo })
  async getBannerDetail(@Param('bannerId') bannerId: string): Promise<BannerSummaryVo> {
    return this.bannerService.getBannerDetail(bannerId);
  }

  @Post()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Create new banner' })
  @ApiOkResponse({ type: BannerSummaryVo })
  async createBanner(@Body() body: CreateBannerRequestDto): Promise<BannerSummaryVo> {
    return this.bannerService.createBanner(body);
  }

  @Put(':bannerId')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Update banner' })
  @ApiOkResponse({ type: BannerSummaryVo })
  async updateBanner(
    @Param('bannerId') bannerId: string,
    @Body() body: UpdateBannerRequestDto,
  ): Promise<BannerSummaryVo> {
    return this.bannerService.updateBanner(bannerId, body);
  }

  @Delete(':bannerId')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: 'Delete banner' })
  @ApiOkResponse({ description: 'Deleted successfully' })
  async deleteBanner(@Param('bannerId') bannerId: string): Promise<void> {
    return this.bannerService.deleteBanner(bannerId);
  }
}
