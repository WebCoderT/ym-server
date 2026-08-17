/**
 * @fileoverview 阿里云 OSS 文件上传签名服务
 * 负责生成客户端直传 OSS 所需的 PostObject 签名，使文件无需经过业务服务器中转即可直接上传到阿里云对象存储。
 */

import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { StorageConfigService } from './storage-config.service';

/**
 * OSS 签名服务类
 *
 * @description
 * 该服务从数据库 storage_config 读取阿里云 OSS 凭证与 Bucket 信息，提供生成直传签名的能力。
 * 签名配置支持管理端在系统设置中动态修改，无需重启服务。
 * 签名采用阿里云 PostObject 协议，客户端拿到签名后通过 multipart/form-data 直接 POST 到 OSS 接收端点。
 * 签名有效期固定为 1 小时，超时后需重新请求签名。
 */
@Injectable()
export class OssSignatureService {
  constructor(private readonly storageConfig: StorageConfigService) {}

  /**
   * 生成 OSS PostObject 直传签名
   *
   * @param dir - 文件在 Bucket 中的存储目录，例如 images/stars
   * @param filename - 可选的自定义文件名；若为空则自动生成唯一文件名
   * @returns 包含上传地址、表单字段和文件访问 URL 的签名对象
   *
   * @description
   * 签名生成流程：
   * 1. 从数据库读取 OSS 配置（region、bucket、accessKeyId、accessKeySecret、endpoint、cdnDomain）
   * 2. 组装文件存储路径 key = dir/timestamp_random.ext
   * 3. 构造 policy 对象，设置过期时间为当前时间 + 1 小时，并限制上传目录和文件大小（最大 50MB）
   * 4. 将 policy 对象 JSON 序列化后进行 Base64 编码
   * 5. 使用 AccessKeySecret 对编码后的 policy 进行 HMAC-SHA1 签名，再将签名结果 Base64 编码
   * 6. 返回 host、key、policy、accessKeyId、signature 等字段供客户端使用
   */
  async generateSignature(dir: string, filename?: string): Promise<{
    host: string;
    key: string;
    policy: string;
    accessKeyId: string;
    signature: string;
    successActionStatus: string;
    fileUrl: string;
  }> {
    const config = await this.storageConfig.getConfig();

    const region = config.ossRegion ?? '';
    const bucket = config.ossBucket ?? '';
    const accessKeyId = config.ossAccessKeyId ?? '';
    const accessKeySecret = config.ossAccessKeySecret ?? '';
    const endpoint = config.ossEndpoint ?? `https://${bucket}.${region}.aliyuncs.com`;
    const cdnDomain = config.ossCdnDomain ?? '';

    const host = endpoint.includes('://')
      ? endpoint
      : `https://${endpoint}`;

    const ext = this.extractExtension(filename);
    const key = `${dir.replace(/\/$/, '')}/${Date.now()}_${this.randomString(8)}${ext}`;

    const expiration = new Date(Date.now() + 3600 * 1000);
    const policyObject = {
      expiration: expiration.toISOString(),
      conditions: [
        ['content-length-range', 0, 50 * 1024 * 1024],
        ['starts-with', '$key', dir.replace(/\/$/, '') + '/'],
      ],
    };

    const policy = Buffer.from(JSON.stringify(policyObject)).toString(
      'base64',
    );
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(policy)
      .digest('base64');

    const fileUrl = cdnDomain
      ? `${cdnDomain.replace(/\/$/, '')}/${key}`
      : `${host}/${key}`;

    return {
      host,
      key,
      policy,
      accessKeyId,
      signature,
      successActionStatus: '200',
      fileUrl,
    };
  }

  /**
   * 从文件名中提取扩展名
   *
   * @param filename - 原始文件名
   * @returns 包含点号的扩展名，例如 .jpg；若无法提取则返回空字符串
   */
  private extractExtension(filename?: string): string {
    if (!filename) return '';
    const match = filename.match(/\.\w+$/);
    return match ? match[0] : '';
  }

  /**
   * 生成指定长度的随机字符串
   *
   * @param length - 字符串长度
   * @returns 由大小写字母和数字组成的随机字符串
   */
  private randomString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
