/**
 * @fileoverview OSS 文件上传签名控制器
 * 提供管理端获取阿里云 OSS 直传签名的 REST 接口。
 */

import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../../../access-level.decorator';
import { AccessLevel } from '../../../access-level.enum';
import { OssSignatureService } from '../oss-signature.service';
import { OssSignatureRequestDto } from '../dto/oss-signature.dto';
import { OssSignatureResponseVo } from '../vo/oss-signature.vo';

/**
 * OSS 签名控制器
 *
 * @description
 * 该控制器暴露单个 POST 端点 /oss/signature，用于为管理端生成阿里云 OSS 直传签名。
 * 客户端拿到签名后，可直接向阿里云 OSS 发起 multipart/form-data POST 请求完成文件上传，无需将文件内容经过业务服务器。
 * 接口需要管理员 Bearer Token 鉴权。
 */
@ApiTags('OSS 文件存储')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('oss')
export class OssController {
  constructor(private readonly ossSignatureService: OssSignatureService) {}

  /**
   * 获取 OSS 直传签名
   *
   * @param dto - 包含存储目录 dir 和可选自定义文件名 filename 的请求体
   * @returns 签名信息，包含 host、key、policy、accessKeyId、signature 等字段
   *
   * @description
   * 管理端在需要上传图片或媒体文件时，先调用此接口获取签名。
   * 随后构造 FormData，将以下字段与文件字段一并 POST 到 host 地址：
   * - key: 服务端返回的 key
   * - policy: 服务端返回的 policy
   * - OSSAccessKeyId: 服务端返回的 accessKeyId
   * - signature: 服务端返回的 signature
   * - success_action_status: 200
   * - file: 待上传的文件对象
   */
  @Post('signature')
  @ApiOperation({ summary: '获取 OSS 直传签名' })
  @ApiCreatedResponse({
    description: '返回 OSS 直传签名信息',
    type: OssSignatureResponseVo,
  })
  async getSignature(
    @Body() dto: OssSignatureRequestDto,
  ): Promise<OssSignatureResponseVo> {
    const signature = await this.ossSignatureService.generateSignature(
      dto.dir,
      dto.filename,
    );
    return signature;
  }
}
