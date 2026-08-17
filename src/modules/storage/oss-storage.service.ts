/**
 * @fileoverview 阿里云 OSS 存储服务
 * 通过 ali-oss SDK 将文件上传到阿里云对象存储。
 */

import { Injectable } from '@nestjs/common';
import OSS = require('ali-oss');
import type { IStorageService, StorageConfigLike, UploadFileParams, UploadResult } from './storage.interface';

/**
 * OSS 存储服务
 *
 * @description
 * 使用阿里云 OSS SDK 上传文件。配置从 storage_config 表中读取，支持自定义 Endpoint 和 CDN 加速域名。
 */
@Injectable()
export class OssStorageService implements IStorageService {
  /**
   * 上传文件到阿里云 OSS
   *
   * @param params - 上传参数
   * @param config - OSS 配置
   * @returns 上传结果，包含可访问的 URL
   */
  async upload(
    params: UploadFileParams,
    config: StorageConfigLike,
  ): Promise<UploadResult> {
    const client = new OSS({
      region: config.ossRegion ?? '',
      bucket: config.ossBucket ?? '',
      accessKeyId: config.ossAccessKeyId ?? '',
      accessKeySecret: config.ossAccessKeySecret ?? '',
      endpoint: config.ossEndpoint ?? undefined,
      secure: true,
    });

    const ext = params.originalName.match(/\.\w+$/)?.[0] ?? '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const key = `${params.dir.replace(/\/$/, '')}/${timestamp}_${random}${ext}`;

    await client.put(key, params.buffer);

    // url 仅存储相对路径（即 OSS key），完整 URL 由 resolveFileUrl 动态拼接
    return {
      url: key,
      key,
      fileName: params.originalName,
      fileSize: params.buffer.length,
    };
  }
}
