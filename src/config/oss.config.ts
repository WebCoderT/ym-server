/**
 * @fileoverview 阿里云 OSS（对象存储服务）配置模块
 * 负责从环境变量中读取 OSS 连接与认证参数，并以 NestJS 命名空间配置的形式提供给文件上传服务使用。
 */

import { registerAs } from '@nestjs/config';

/**
 * OSS 配置工厂
 * 使用 NestJS 的 registerAs 注册为命名空间配置，配置键为 'oss'。
 *
 * @description
 * 该配置对象包含阿里云 OSS 的访问凭证与存储空间信息，所有字段均支持通过环境变量覆盖。
 * 若环境变量未设置则使用空字符串作为默认值，避免应用启动时因缺失配置而报错，
 * 但上传功能在缺少有效凭证时将无法正常工作。
 *
 * @property region - OSS 数据中心所在地域标识，例如 oss-cn-hangzhou
 * @property bucket - OSS 存储空间名称，用于隔离不同业务的数据
 * @property accessKeyId - 阿里云访问密钥 ID，用于身份认证
 * @property accessKeySecret - 阿里云访问密钥 Secret，与 accessKeyId 配对使用
 */
export const ossConfig = registerAs('oss', () => ({
  // OSS 地域节点：优先读取环境变量 OSS_REGION，未设置时为空字符串
  // 示例值：oss-cn-hangzhou、oss-cn-beijing
  region: process.env.OSS_REGION,

  // OSS 存储空间名称：优先读取环境变量 OSS_BUCKET，未设置时为空字符串
  // 该名称在阿里云控制台创建 Bucket 时指定，需全局唯一
  bucket: process.env.OSS_BUCKET,

  // 阿里云 AccessKey ID：优先读取环境变量 OSS_ACCESS_KEY_ID，未设置时为空字符串
  // 用于标识调用者身份，可在阿里云 RAM 控制台创建和管理
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,

  // 阿里云 AccessKey Secret：优先读取环境变量 OSS_ACCESS_KEY_SECRET，未设置时为空字符串
  // 与 AccessKey ID 配对使用，用于请求签名验证，需妥善保管避免泄露
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,

  // OSS 外网 Endpoint：优先读取环境变量 OSS_ENDPOINT，未设置时根据 region 拼接
  // 示例值：https://oss-cn-hangzhou.aliyuncs.com
  endpoint: process.env.OSS_ENDPOINT ?? `https://${process.env.OSS_REGION ?? ''}.aliyuncs.com`,

  // CDN 加速域名（可选）：优先读取环境变量 OSS_CDN_DOMAIN，用于返回对外访问的文件 URL
  // 示例值：https://cdn.example.com
  cdnDomain: process.env.OSS_CDN_DOMAIN,
}));
