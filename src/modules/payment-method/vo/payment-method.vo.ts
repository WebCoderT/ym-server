import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentMethodSummaryVo {
  @ApiProperty({ type: 'string', example: '1' })
  id!: string;

  @ApiProperty({ type: 'string', example: 'wechat' })
  code!: string;

  @ApiProperty({ type: 'string', example: '微信支付' })
  name!: string;

  @ApiProperty({ type: 'string', example: '' })
  icon!: string;

  @ApiProperty({ type: 'string', example: '推荐使用微信支付' })
  description!: string;

  @ApiProperty({ type: Boolean, example: true })
  enabled!: boolean;

  @ApiProperty({ type: Number, example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: 'string', example: '2026-06-08T10:00:00.000Z' })
  createdAt!: string;
}

export class PaymentMethodDetailVo extends PaymentMethodSummaryVo {}

export class PaymentMethodListResponseVo {
  @ApiProperty({ type: [PaymentMethodSummaryVo] })
  items!: PaymentMethodSummaryVo[];
}
