import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentBizType } from '../enums/payment-biz-type.enum';
import { PaymentTransactionStatus } from '../enums/payment-transaction-status.enum';

export class PaymentTransactionQueryDto {
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

  @ApiPropertyOptional({ description: '业务类型', enum: PaymentBizType })
  @IsOptional()
  @IsEnum(PaymentBizType)
  bizType?: PaymentBizType;

  @ApiPropertyOptional({ description: '业务单号', type: String })
  @IsOptional()
  @IsString()
  bizNo?: string;

  @ApiPropertyOptional({ description: '用户 ID', type: String })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '支付状态', enum: PaymentTransactionStatus })
  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;
}
