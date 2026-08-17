import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentBizType } from '../enums/payment-biz-type.enum';
import { PaymentTransactionStatus } from '../enums/payment-transaction-status.enum';

export class PaymentTransactionVo {
  @ApiProperty({ description: '流水 ID' })
  id!: string;

  @ApiProperty({ description: '业务流水号' })
  transactionNo!: string;

  @ApiPropertyOptional({ description: '第三方支付交易号' })
  thirdPartyTransactionId!: string | null;

  @ApiProperty({ description: '支付方式' })
  paymentMethodCode!: string;

  @ApiProperty({ description: '业务类型', enum: PaymentBizType })
  bizType!: PaymentBizType;

  @ApiProperty({ description: '业务单号' })
  bizNo!: string;

  @ApiProperty({ description: '用户 ID' })
  userId!: string;

  @ApiProperty({ description: '交易金额（单位：分）' })
  amount!: number;

  @ApiProperty({ description: '支付状态', enum: PaymentTransactionStatus })
  status!: PaymentTransactionStatus;

  @ApiProperty({ description: '交易标题/描述' })
  title!: string;

  @ApiPropertyOptional({ description: '扩展信息' })
  extra!: Record<string, any> | null;

  @ApiPropertyOptional({ description: '支付成功时间（ISO 格式）' })
  paidAt!: string | null;

  @ApiPropertyOptional({ description: '支付失败时间（ISO 格式）' })
  failedAt!: string | null;

  @ApiProperty({ description: '创建时间（ISO 格式）' })
  createdAt!: string;

  @ApiProperty({ description: '更新时间（ISO 格式）' })
  updatedAt!: string;
}

export class PaymentTransactionListResponseVo {
  @ApiProperty({ type: [PaymentTransactionVo] })
  items!: PaymentTransactionVo[];

  @ApiProperty({ description: '总数' })
  total!: number;

  @ApiProperty({ description: '当前页' })
  page!: number;

  @ApiProperty({ description: '每页数量' })
  pageSize!: number;
}
