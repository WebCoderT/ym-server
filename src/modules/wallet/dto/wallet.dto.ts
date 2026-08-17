import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationRequestDto } from '../../../common/dto/pagination.dto';
import { BalanceTransactionType } from '../enums/wallet.enum';

/**
 * 余额变动查询参数 DTO
 */
export class BalanceTransactionQueryDto extends PaginationRequestDto {
  /** 按类型筛选（可选） */
  @ApiPropertyOptional({
    enum: BalanceTransactionType,
    example: BalanceTransactionType.CONSUME,
  })
  @IsOptional()
  @IsEnum(BalanceTransactionType)
  type?: BalanceTransactionType;
}

/**
 * 创建余额变动记录的内部参数接口
 * 供其他服务（如订单服务）调用
 */
export interface CreateBalanceTransactionParams {
  userId: string;
  type: BalanceTransactionType;
  direction: BalanceTransactionDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string | null;
  orderId?: string | null;
  transactionNo?: string | null;
}

// 需要导入 Direction 枚举类型用于接口定义
import { BalanceTransactionDirection } from '../enums/wallet.enum';
