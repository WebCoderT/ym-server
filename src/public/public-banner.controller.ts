/**
 * 公共Banner控制器
 * 提供Banner列表查询功能（只返回生效中的Banner）
 */
import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { ClientBannerListResponseVo } from '../modules/banner/vo/banner.vo';
import { BannerService } from '../modules/banner/banner.service';

@ApiTags('public-banner')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('client/banners')
export class PublicBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'List active banners' })
  @ApiOkResponse({ type: ClientBannerListResponseVo })
  async getBanners(): Promise<ClientBannerListResponseVo> {
    return this.bannerService.listClientBanners();
  }
}
