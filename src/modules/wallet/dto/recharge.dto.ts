import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建充值订单请求 DTO
 */
export class CreateRechargeRequestDto {
  /** 充值金额（元） */
  @ApiProperty({ type: Number, example: 100, description: '充值金额（元）' })
  @IsNumber()
  @Min(1, { message: '充值金额最少 1 元' })
  @Max(10000, { message: '单笔充值金额最多 10000 元' })
  amount!: number;

  /** 支付方式编码 */
  @ApiProperty({ type: 'string', example: 'wechat', description: '支付方式编码' })
  @IsString()
  @IsNotEmpty({ message: '请选择支付方式' })
  paymentMethodCode!: string;
}
