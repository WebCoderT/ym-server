import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';
import { BalanceTransactionDirection, BalanceTransactionType } from '../enums/wallet.enum';

/**
 * 钱包余额 VO
 * 用于展示用户的钱包余额信息
 */
export class WalletBalanceVo {
  /** 当前余额 */
  @ApiProperty({ type: Number, example: 128.5 })
  balance!: number;

  /** 累计消费金额 */
  @ApiProperty({ type: Number, example: 356.0 })
  totalSpending!: number;
}

/**
 * 余额变动记录 VO
 * 用于展示单条余额变动记录的详细信息
 */
export class BalanceTransactionVo {
  /** 变动记录唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 变动类型：充值、消费、退款、管理员调整 */
  @ApiProperty({
    enum: BalanceTransactionType,
    example: BalanceTransactionType.CONSUME,
  })
  type!: BalanceTransactionType;

  /** 变动方向：收入/支出 */
  @ApiProperty({
    enum: BalanceTransactionDirection,
    example: BalanceTransactionDirection.OUT,
  })
  direction!: BalanceTransactionDirection;

  /** 变动金额（始终为正数） */
  @ApiProperty({ type: Number, example: 50.0 })
  amount!: number;

  /** 变动后的余额 */
  @ApiProperty({ type: Number, example: 128.5 })
  balanceAfter!: number;

  /** 变动前的余额 */
  @ApiProperty({ type: Number, example: 178.5 })
  balanceBefore!: number;

  /** 变动描述，可能为空 */
  @ApiProperty({ type: 'string', example: '购买明星周边', nullable: true })
  description!: string | null;

  /** 关联订单ID，可能为空 */
  @ApiProperty({ type: 'string', example: '20001', nullable: true })
  orderId!: string | null;

  /** 关联交易流水号，可能为空 */
  @ApiProperty({ type: String, example: 'BAL1718000000000ABCD', nullable: true })
  transactionNo!: string | null;

  /** 变动时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * 余额变动记录列表响应 VO
 * 用于返回用户的余额变动记录列表
 */
export class BalanceTransactionListResponseVo {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  /** 余额变动记录列表 */
  @ApiProperty({ type: [BalanceTransactionVo] })
  items!: BalanceTransactionVo[];

  /** 分页信息 */
  @ApiProperty({ type: PaginationMeta })
  pagination!: PaginationMeta;
}
