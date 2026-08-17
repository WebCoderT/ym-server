import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithdrawalStatus } from '../enums/wallet.enum';

/**
 * 提现申请响应 VO
 */
export class WithdrawalRequestVo {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: Number, example: 100 })
  amount!: number;

  @ApiProperty({ enum: WithdrawalStatus })
  status!: WithdrawalStatus;

  @ApiPropertyOptional({ type: 'string', description: '驳回原因' })
  rejectReason!: string | null;

  @ApiProperty({ type: 'string', example: '2026-06-23T10:00:00.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ type: 'string' })
  processedAt!: string | null;
}

/**
 * 提现申请列表响应 VO
 */
export class WithdrawalRequestListResponseVo {
  @ApiProperty({ type: 'string', enum: ['client'], example: 'client' })
  audience!: string;

  @ApiProperty({ type: [WithdrawalRequestVo] })
  items!: WithdrawalRequestVo[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;
}

/**
 * 管理端提现申请响应 VO（含用户信息）
 */
export class AdminWithdrawalRequestVo {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string', description: '申请用户 ID' })
  userId!: string;

  @ApiPropertyOptional({ type: 'string', description: '用户昵称' })
  userNickname!: string | null;

  @ApiPropertyOptional({ type: 'string', description: '用户手机号' })
  userPhone!: string | null;

  @ApiProperty({ type: Number, example: 100 })
  amount!: number;

  @ApiProperty({ enum: WithdrawalStatus })
  status!: WithdrawalStatus;

  @ApiProperty({ type: 'string', description: '目标微信 OpenID' })
  wxOpenId!: string;

  @ApiPropertyOptional({ type: 'string', description: '驳回原因' })
  rejectReason!: string | null;

  @ApiPropertyOptional({ type: 'string', description: '审核人 ID' })
  processedBy!: string | null;

  @ApiProperty({ type: 'string' })
  createdAt!: string;

  @ApiPropertyOptional({ type: 'string' })
  processedAt!: string | null;
}

/**
 * 管理端提现申请列表响应 VO
 */
export class AdminWithdrawalRequestListResponseVo {
  @ApiProperty({ type: 'string', enum: ['admin'], example: 'admin' })
  audience!: string;

  @ApiProperty({ type: [AdminWithdrawalRequestVo] })
  items!: AdminWithdrawalRequestVo[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;
}
