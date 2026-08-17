import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 创建提现申请请求 DTO
 */
export class CreateWithdrawalRequestDto {
  /** 提现金额 */
  @ApiProperty({ type: Number, example: 100, description: '提现金额（元）' })
  @IsNumber()
  @Min(1, { message: '提现金额最少 1 元' })
  @Max(5000, { message: '单笔提现金额最多 5000 元' })
  amount!: number;
}

/**
 * 管理端审核提现申请请求 DTO
 */
export class DecideWithdrawalRequestDto {
  @ApiPropertyOptional({ type: 'string', description: '驳回原因（仅驳回时必填）' })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
