/**
 * 公开支付方式控制器
 * 提供无需鉴权的支付方式列表查询接口
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { PaymentMethodListResponseVo } from '../modules/payment-method/vo/payment-method.vo';
import { PaymentMethodService } from '../modules/payment-method/payment-method.service';

@ApiTags('public-payment-method')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('public/payment-methods')
export class PublicPaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  @ApiOperation({ summary: '获取可用支付方式列表（公开）' })
  @ApiOkResponse({ type: PaymentMethodListResponseVo })
  async list(): Promise<PaymentMethodListResponseVo> {
    return this.paymentMethodService.listClientPaymentMethods();
  }
}
