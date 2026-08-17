import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RechargeStatus } from '../enums/wallet.enum';

/**
 * 充值订单响应 VO
 */
export class RechargeOrderVo {
  @ApiProperty({ type: 'string', description: '充值订单 ID' })
  id!: string;

  @ApiProperty({ type: 'string', description: '充值订单号' })
  rechargeNo!: string;

  @ApiProperty({ type: Number, example: 100, description: '充值金额' })
  amount!: number;

  @ApiProperty({ type: 'string', description: '支付方式编码' })
  paymentMethodCode!: string;

  @ApiProperty({ enum: RechargeStatus, description: '充值状态' })
  status!: RechargeStatus;

  @ApiPropertyOptional({ type: 'string', description: '第三方支付交易号' })
  transactionId!: string | null;

  @ApiProperty({ type: 'string', description: '支付时间（ISO 格式）' })
  paidAt!: string | null;

  @ApiProperty({ type: 'string', description: '过期时间（ISO 格式，待支付订单超时时间）' })
  expireAt!: string | null;

  @ApiProperty({ type: 'string', description: '创建时间（ISO 格式）' })
  createdAt!: string;
}

/**
 * 创建充值订单响应 VO
 */
export class CreateRechargeResponseVo extends RechargeOrderVo {
  // 简化版本：不包含支付调起参数，实际使用时可扩展
}

/**
 * 充值订单列表响应 VO
 */
export class RechargeOrderListResponseVo {
  @ApiProperty({ type: 'string', enum: ['client'], example: 'client' })
  audience!: string;

  @ApiProperty({ type: [RechargeOrderVo] })
  items!: RechargeOrderVo[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;
}
