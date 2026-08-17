/**
 * @fileoverview 存储服务接口
 * 定义统一的上传能力契约，不同存储提供商（本地/OSS）均需实现此接口。
 */

/**
 * 上传文件参数
 */
export interface UploadFileParams {
  /** 文件缓冲区 */
  buffer: Buffer;
  /** 原始文件名 */
  originalName: string;
  /** MIME 类型 */
  mimetype: string;
  /** 存储目录，例如 images/stars */
  dir: string;
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 文件访问 URL */
  url: string;
  /** 存储路径/key */
  key: string;
  /** 原始文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
}

/** 存储配置片段 */
export interface StorageConfigLike {
  provider: string;
  localBaseUrl: string | null;
  localStoragePath: string | null;
  ossRegion: string | null;
  ossBucket: string | null;
  ossAccessKeyId: string | null;
  ossAccessKeySecret: string | null;
  ossEndpoint: string | null;
  ossCdnDomain: string | null;
}

/**
 * 存储服务接口
 *
 * @description
 * 所有存储提供商（本地、OSS 等）必须实现此接口，以保证上层调用方无需关心底层存储差异。
 */
export interface IStorageService {
  /**
   * 上传文件
   * @param params 上传参数
   * @param config 存储配置
   * @returns 上传结果
   */
  upload(params: UploadFileParams, config: StorageConfigLike): Promise<UploadResult>;
}
