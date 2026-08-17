/**
 * 管理员支付方式控制器
 * 提供支付方式的 CRUD 和启用/停用管理功能
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
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
import { CreatePaymentMethodRequestDto, TogglePaymentMethodRequestDto, UpdatePaymentMethodRequestDto } from '../modules/payment-method/dto/payment-method.dto';
import { PaymentMethodSummaryVo as PaymentMethodVo, PaymentMethodListResponseVo } from '../modules/payment-method/vo/payment-method.vo';
import { PaymentMethodService } from '../modules/payment-method/payment-method.service';

@ApiTags('admin-payment-method')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/payment-methods')
export class AdminPaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取支付方式列表（管理端）' })
  @ApiOkResponse({ type: PaymentMethodListResponseVo })
  async list(): Promise<PaymentMethodListResponseVo> {
    return this.paymentMethodService.listAdminPaymentMethods();
  }

  @Get(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '获取支付方式详情' })
  @ApiOkResponse({ type: PaymentMethodVo })
  async getDetail(@Param('id') id: string): Promise<PaymentMethodVo> {
    return this.paymentMethodService.getDetail(id);
  }

  @Post()
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '创建支付方式' })
  @ApiOkResponse({ type: PaymentMethodVo })
  async create(@Body() body: CreatePaymentMethodRequestDto): Promise<PaymentMethodVo> {
    return this.paymentMethodService.create(body);
  }

  @Put(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '更新支付方式' })
  @ApiOkResponse({ type: PaymentMethodVo })
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePaymentMethodRequestDto,
  ): Promise<PaymentMethodVo> {
    return this.paymentMethodService.update(id, body);
  }

  @Patch(':id/toggle')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '切换支付方式启用状态' })
  @ApiOkResponse({ type: PaymentMethodVo })
  async toggle(
    @Param('id') id: string,
    @Body() body: TogglePaymentMethodRequestDto,
  ): Promise<PaymentMethodVo> {
    return this.paymentMethodService.toggleEnabled(id, body.enabled);
  }

  @Delete(':id')
  @RequirePermission(Permission.ADMIN_SYSTEM)
  @ApiOperation({ summary: '删除支付方式' })
  @ApiOkResponse({ description: 'Deleted successfully' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.paymentMethodService.delete(id);
  }
}
