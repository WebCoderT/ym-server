import { ApiProperty } from '@nestjs/swagger';

export class OssSignatureResponseVo {
  @ApiProperty({ type: String, description: 'OSS 上传接收地址' })
  host!: string;

  @ApiProperty({ type: String, description: '文件在 Bucket 中的存储路径' })
  key!: string;

  @ApiProperty({ type: String, description: 'Base64 编码的授权策略' })
  policy!: string;

  @ApiProperty({ type: String, description: '阿里云 AccessKeyId' })
  accessKeyId!: string;

  @ApiProperty({ type: String, description: '签名值' })
  signature!: string;

  @ApiProperty({ type: String, description: '成功上传后的 HTTP 状态码', example: '200' })
  successActionStatus!: string;

  @ApiProperty({ type: String, description: '上传成功后可访问的文件 URL' })
  fileUrl!: string;
}
