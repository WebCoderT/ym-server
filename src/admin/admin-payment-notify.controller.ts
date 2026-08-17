import { Controller, Get, Param, Query } from '@nestjs/common';
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
import { PaymentNotifyService } from '../modules/payment-notify/payment-notify.service';
import {
  PaymentNotifyDto,
  PaymentNotifyListResponseDto,
  PaymentNotifyQueryDto,
} from '../modules/payment-notify/dto/payment-notify.dto';

/**
 * 管理端支付回调记录控制器
 * 提供支付回调记录的查询功能
 */
@ApiTags('admin-payment-notify')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/payment-notifies')
export class AdminPaymentNotifyController {
  constructor(private readonly paymentNotifyService: PaymentNotifyService) {}

  /**
   * 查询支付回调记录列表
   * 支持按支付方式、支付来源、业务类型、业务单号、状态过滤
   */
  @Get()
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'List payment notify records (with filters)' })
  @ApiOkResponse({ type: PaymentNotifyListResponseDto })
  async list(@Query() query: PaymentNotifyQueryDto): Promise<PaymentNotifyListResponseDto> {
    return this.paymentNotifyService.adminList(query);
  }

  /**
   * 查询支付回调记录详情
   */
  @Get(':id')
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'Get payment notify record detail' })
  @ApiOkResponse({ type: PaymentNotifyDto })
  async getDetail(@Param('id') id: string): Promise<PaymentNotifyDto> {
    return this.paymentNotifyService.adminGetDetail(id);
  }
}
