import { Body, Controller, Get, Put } from '@nestjs/common';
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
import { UpdatePaymentConfigRequestDto } from '../modules/payment-config/dto/payment-config.dto';
import { PaymentConfigVo, PaymentConfigDetailVo } from '../modules/payment-config/vo/payment-config.vo';
import { PaymentConfigService } from '../modules/payment-config/payment-config.service';

/**
 * 管理端支付配置控制器
 * 提供支付配置的查看与更新功能
 */
@ApiTags('admin-payment-config')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/payment-config')
export class AdminPaymentConfigController {
  constructor(private readonly paymentConfigService: PaymentConfigService) {}

  /**
   * 获取支付配置（普通视图，敏感字段仅返回是否已配置）
   */
  @Get()
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'Get payment config (sensitive fields masked)' })
  @ApiOkResponse({ type: PaymentConfigVo })
  async getConfig(): Promise<PaymentConfigVo> {
    return this.paymentConfigService.getConfig();
  }

  /**
   * 获取支付配置详情（包含完整敏感字段）
   */
  @Get('detail')
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'Get payment config detail (with full sensitive fields)' })
  @ApiOkResponse({ type: PaymentConfigDetailVo })
  async getConfigDetail(): Promise<PaymentConfigDetailVo> {
    return this.paymentConfigService.getConfigDetail();
  }

  /**
   * 更新支付配置
   */
  @Put()
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'Update payment config' })
  @ApiOkResponse({ type: PaymentConfigVo })
  async updateConfig(
    @Body() dto: UpdatePaymentConfigRequestDto,
  ): Promise<PaymentConfigVo> {
    return this.paymentConfigService.updateConfig(dto);
  }
}
