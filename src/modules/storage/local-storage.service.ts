/**
 * @fileoverview 本地文件存储服务
 * 将上传的文件保存到服务器本地磁盘，并通过配置的 base URL 提供外部访问。
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { IStorageService, StorageConfigLike, UploadFileParams, UploadResult } from './storage.interface';

/**
 * 本地存储服务
 *
 * @description
 * 文件保存在服务器本地磁盘，默认目录为项目根目录下的 uploads/。
 * 访问 URL 由配置的 localBaseUrl + 相对路径拼接而成。
 * 若未配置 localBaseUrl，则使用请求的主机地址自动拼接。
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  /**
   * 上传文件到本地磁盘
   *
   * @param params - 上传参数
   * @param config - 本地存储配置
   * @returns 上传结果，包含可访问的 URL
   */
  async upload(
    params: UploadFileParams,
    config: StorageConfigLike,
  ): Promise<UploadResult> {
    const storagePath = config.localStoragePath ?? 'uploads';
    const baseUrl = config.localBaseUrl ?? '';

    // 生成文件路径：uploads/images/stars/20250101_abc123.jpg
    const ext = path.extname(params.originalName) || '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const fileName = `${timestamp}_${random}${ext}`;
    const relativeDir = path.join(storagePath, params.dir);
    const absoluteDir = path.resolve(process.cwd(), relativeDir);
    const absolutePath = path.join(absoluteDir, fileName);
    const relativePath = path.join(relativeDir, fileName).replace(/\\/g, '/');

    // 确保目录存在
    fs.mkdirSync(absoluteDir, { recursive: true });

    // 写入文件
    fs.writeFileSync(absolutePath, params.buffer);

    // url 仅存储相对路径（去掉 storagePath 前缀），完整 URL 由 resolveFileUrl 动态拼接
    const urlPath = relativePath.replace(storagePath + '/', '');

    return {
      url: urlPath,
      key: relativePath,
      fileName: params.originalName,
      fileSize: params.buffer.length,
    };
  }
}
