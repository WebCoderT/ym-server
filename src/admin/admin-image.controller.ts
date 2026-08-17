/**
 * @fileoverview 管理端图片资源控制器
 * 提供图片与图片分组的 CRUD 接口。
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { PaginationRequestDto } from '../common/dto/pagination.dto';
import { CreateImageGroupRequestDto, CreateImageRecordRequestDto, UpdateImageGroupRequestDto } from '../modules/image/dto/image.dto';
import { ImageVo, ImageGroupVo, ImageGroupListResponseVo, ImageListResponseVo } from '../modules/image/vo/image.vo';
import { ImageService } from '../modules/image/image.service';

/**
 * 管理端图片控制器
 *
 * @description
 * 为管理后台提供图片元数据和分组的完整管理能力。
 * 图片实际文件存储在阿里云 OSS，本控制器仅管理元数据记录。
 */
@ApiTags('图片管理')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/images')
export class AdminImageController {
  constructor(private readonly imageService: ImageService) {}

  /* ── 分组 ── */

  @Get('groups')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '获取图片分组列表' })
  @ApiOkResponse({ type: ImageGroupListResponseVo })
  async getGroupList(): Promise<ImageGroupListResponseVo> {
    const items = await this.imageService.getGroupList();
    return { items };
  }

  @Post('groups')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '创建图片分组' })
  @ApiCreatedResponse({ type: ImageGroupVo })
  async createGroup(
    @Body() body: CreateImageGroupRequestDto,
  ): Promise<ImageGroupVo> {
    return this.imageService.createGroup(body);
  }

  @Put('groups/:id')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '更新图片分组' })
  @ApiOkResponse({ type: ImageGroupVo })
  async updateGroup(
    @Param('id') groupId: string,
    @Body() body: UpdateImageGroupRequestDto,
  ): Promise<ImageGroupVo> {
    return this.imageService.updateGroup(groupId, body);
  }

  @Delete('groups/:id')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '删除图片分组' })
  @ApiOkResponse({ description: '删除成功' })
  async deleteGroup(@Param('id') groupId: string): Promise<void> {
    return this.imageService.deleteGroup(groupId);
  }

  /* ── 图片 ── */

  @Get()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '获取图片列表（分页）' })
  @ApiOkResponse({ type: ImageListResponseVo })
  async getImageList(
    @Query('groupId') groupId: string,
    @Query() pagination: PaginationRequestDto,
  ): Promise<ImageListResponseVo> {
    return this.imageService.getImageList(groupId, pagination);
  }

  @Post()
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '创建图片记录' })
  @ApiCreatedResponse({ type: ImageVo })
  async createImage(@Body() body: CreateImageRecordRequestDto): Promise<ImageVo> {
    return this.imageService.createImage(body);
  }

  @Delete(':id')
  @RequirePermission(Permission.ADMIN_CONTENT)
  @ApiOperation({ summary: '删除图片记录' })
  @ApiOkResponse({ description: '删除成功' })
  async deleteImage(@Param('id') imageId: string): Promise<void> {
    return this.imageService.deleteImage(imageId);
  }
}
