/**
 * @fileoverview 管理端存储配置与上传控制器
 * 提供存储策略配置读取/更新，以及统一的上传接口（根据配置自动路由到本地或 OSS）。
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { UpdateStorageConfigRequestDto } from '../modules/storage/dto/storage.dto';
import { StorageConfigVo, UploadFileResponseVo } from '../modules/storage/vo/storage.vo';
import { StorageConfigService } from '../modules/storage/storage-config.service';
import { LocalStorageService } from '../modules/storage/local-storage.service';
import { OssStorageService } from '../modules/storage/oss-storage.service';

/**
 * 管理端存储控制器
 *
 * @description
 * 统一处理文件上传请求，根据当前 storage_config 中的 provider 字段自动选择本地存储或阿里云 OSS。
 * 同时暴露存储配置的读写接口，支持管理端动态切换存储策略。
 */
@ApiTags('存储配置')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/storage')
export class AdminStorageController {
  constructor(
    private readonly configService: StorageConfigService,
    private readonly localStorage: LocalStorageService,
    private readonly ossStorage: OssStorageService,
  ) {}

  /**
   * 获取当前存储配置
   */
  @Get('config')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取存储配置' })
  @ApiOkResponse({ type: StorageConfigVo })
  async getConfig(): Promise<StorageConfigVo> {
    return this.configService.getConfig();
  }

  /**
   * 更新存储配置
   */
  @Put('config')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '更新存储配置' })
  @ApiOkResponse({ type: StorageConfigVo })
  async updateConfig(
    @Body() dto: UpdateStorageConfigRequestDto,
  ): Promise<StorageConfigVo> {
    return this.configService.updateConfig(dto);
  }

  /**
   * 上传文件（根据配置自动路由）
   *
   * @description
   * 根据当前 storage_config.provider 的值自动选择存储方式：
   * - local: 保存到服务器本地 uploads/ 目录
   * - oss: 上传到阿里云 OSS
   */
  @Post('upload')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '上传文件（自动路由）' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: UploadFileResponseVo })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('dir') dir?: string,
  ): Promise<UploadFileResponseVo> {
    const config = await this.configService.getConfig();

    const params = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      dir: dir ?? 'images/managed',
    };

    const result =
      config.provider === 'oss'
        ? await this.ossStorage.upload(params, config)
        : await this.localStorage.upload(params, config);

    // url 字段返回完整可访问 URL，key 字段保留原始存储路径供持久化使用
    return {
      ...result,
      url: await this.configService.resolveFileUrl(result.url),
    };
  }
}
