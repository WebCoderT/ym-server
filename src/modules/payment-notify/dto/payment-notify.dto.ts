import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentNotifyStatus } from '../entities/payment-notify.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * 支付回调记录 DTO（用于返回）
 */
export class PaymentNotifyDto {
  @ApiProperty({ description: '回调记录 ID' })
  id!: string;

  @ApiPropertyOptional({ description: '关联的支付流水 ID' })
  transactionId!: string | null;

  @ApiProperty({ description: '支付方式' })
  paymentMethodCode!: string;

  @ApiProperty({ description: '支付来源（wechat/alipay）' })
  provider!: string;

  @ApiProperty({ description: '业务类型' })
  bizType!: string;

  @ApiProperty({ description: '业务单号' })
  bizNo!: string;

  @ApiPropertyOptional({ description: '原始请求头' })
  rawHeaders!: Record<string, any> | null;

  @ApiProperty({ description: '原始请求体' })
  rawBody!: string;

  @ApiPropertyOptional({ description: '解密后的回调数据' })
  decryptedData!: Record<string, any> | null;

  @ApiProperty({ description: '处理状态', enum: PaymentNotifyStatus })
  status!: PaymentNotifyStatus;

  @ApiPropertyOptional({ description: '处理结果描述' })
  resultMessage!: string | null;

  @ApiProperty({ description: '重试次数' })
  retryCount!: number;

  @ApiPropertyOptional({ description: '处理时间（ISO 格式）' })
  processedAt!: string | null;

  @ApiProperty({ description: '创建时间（ISO 格式）' })
  createdAt!: string;

  @ApiProperty({ description: '更新时间（ISO 格式）' })
  updatedAt!: string;
}

/**
 * 支付回调记录列表响应 DTO
 */
export class PaymentNotifyListResponseDto {
  @ApiProperty({ type: [PaymentNotifyDto] })
  items!: PaymentNotifyDto[];

  @ApiProperty({ description: '总数' })
  total!: number;

  @ApiProperty({ description: '当前页' })
  page!: number;

  @ApiProperty({ description: '每页数量' })
  pageSize!: number;
}

/**
 * 支付回调记录查询 DTO
 */
export class PaymentNotifyQueryDto {
  @ApiPropertyOptional({ description: '当前页', type: Number, default: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量', type: Number, default: 20 })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({ description: '支付方式', type: String })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

  @ApiPropertyOptional({ description: '支付来源', type: String })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: '业务类型', type: String })
  @IsOptional()
  @IsString()
  bizType?: string;

  @ApiPropertyOptional({ description: '业务单号', type: String })
  @IsOptional()
  @IsString()
  bizNo?: string;

  @ApiPropertyOptional({ description: '处理状态', enum: PaymentNotifyStatus })
  @IsOptional()
  @IsEnum(PaymentNotifyStatus)
  status?: PaymentNotifyStatus;
}
