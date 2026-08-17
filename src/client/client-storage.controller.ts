/**
 * @fileoverview 客户端文件上传控制器
 * 为客户端用户提供统一的文件上传接口，根据管理端配置的存储策略自动路由到本地或 OSS。
 */

import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { StorageConfigService } from '../modules/storage/storage-config.service';
import { LocalStorageService } from '../modules/storage/local-storage.service';
import { OssStorageService } from '../modules/storage/oss-storage.service';
import { UploadFileResponseVo } from '../modules/storage/vo/storage.vo';

/**
 * 客户端存储控制器
 *
 * @description
 * 为客户端用户提供文件上传能力，复用管理端的存储服务层。
 * 上传请求根据 storage_config.provider 自动路由到本地磁盘或阿里云 OSS，
 * 客户端无需感知底层存储实现。
 */
@ApiTags('客户端文件上传')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/storage')
export class ClientStorageController {
  constructor(
    private readonly configService: StorageConfigService,
    private readonly localStorage: LocalStorageService,
    private readonly ossStorage: OssStorageService,
  ) {}

  /**
   * 上传文件（自动路由）
   *
   * @description
   * 根据 storage_config.provider 自动选择存储方式：
   * - local: 保存到服务器本地磁盘
   * - oss: 上传到阿里云 OSS
   */
  @Post('upload')
  @ApiOperation({ summary: '客户端上传文件（自动路由）' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: UploadFileResponseVo })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('dir') dir?: string,
  ): Promise<UploadFileResponseVo> {
    if (!file) {
      throw new BadRequestException('未收到上传文件，请重新选择');
    }

    const config = await this.configService.getConfig();

    const params = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      dir: dir ?? 'images/client',
    };

    const result =
      config.provider === 'oss'
        ? await this.ossStorage.upload(params, config)
        : await this.localStorage.upload(params, config);

    // url 字段返回完整可访问 URL（符合 UploadFileResponseDto 中「文件访问 URL」的语义），
    // key 字段保留原始存储路径，供业务侧持久化使用（写入 DB 前应由 normalizeFileUrl 归一化）。
    return {
      ...result,
      url: await this.configService.resolveFileUrl(result.url),
    };
  }
}
