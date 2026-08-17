/**
 * 客户端支付方式控制器
 * 提供客户端可用的支付方式列表查询接口
 */
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import { PaymentMethodListResponseVo } from '../modules/payment-method/vo/payment-method.vo';
import { PaymentMethodService } from '../modules/payment-method/payment-method.service';

@ApiTags('client-payment-method')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/payment-methods')
export class ClientPaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: '获取可用支付方式列表（客户端）' })
  @ApiOkResponse({ type: PaymentMethodListResponseVo })
  async list(): Promise<PaymentMethodListResponseVo> {
    return this.paymentMethodService.listClientPaymentMethods();
  }
}
