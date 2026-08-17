/**
 * @fileoverview 公共搜索控制器
 * 提供热门搜索功能
 */

import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { AccessLevel } from '../access-level.enum';
import { RequireAccessLevel } from '../access-level.decorator';

/**
 * 热门搜索项 DTO
 */
export class HotSearchItemDto {
  @ApiProperty({ example: 1, description: '排名' })
  rank!: number;

  @ApiProperty({ example: '热门搜索词', description: '搜索关键词' })
  text!: string;

  @ApiPropertyOptional({ example: 1000, description: '热度值' })
  popularity?: number;
}

/**
 * 热门搜索响应 DTO
 */
export class HotSearchResponseDto {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  @ApiProperty({ type: [HotSearchItemDto], description: '热门搜索列表' })
  items!: HotSearchItemDto[];
}

/**
 * 公共搜索控制器
 * 提供热门搜索关键词列表
 */
@ApiTags('public-search')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('client/search')
export class PublicSearchController {
  /**
   * 热门搜索
   * 返回热门搜索关键词列表（示例数据）
   */
  @Get('hot')
  @ApiOperation({ summary: 'Get hot search keywords' })
  @ApiOkResponse({ type: HotSearchResponseDto })
  async getHotSearch(): Promise<HotSearchResponseDto> {
    // 简化版本：返回空列表，实际使用时可对接数据库
    return {
      audience: AccessLevel.CLIENT,
      items: [],
    };
  }
}
