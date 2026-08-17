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
import { PaymentTransactionQueryDto } from '../modules/payment-transaction/dto/payment-transaction.dto';
import { PaymentTransactionVo, PaymentTransactionListResponseVo } from '../modules/payment-transaction/vo/payment-transaction.vo';
import { PaymentTransactionService } from '../modules/payment-transaction/payment-transaction.service';

/**
 * 管理端支付流水控制器
 * 提供支付流水的查询功能
 */
@ApiTags('admin-payment-transaction')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/payment-transactions')
export class AdminPaymentTransactionController {
  constructor(private readonly paymentTransactionService: PaymentTransactionService) {}

  /**
   * 查询支付流水列表
   * 支持按支付方式、业务类型、业务单号、用户ID、状态过滤
   */
  @Get()
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'List payment transactions (with filters)' })
  @ApiOkResponse({ type: PaymentTransactionListResponseVo })
  async list(
    @Query() query: PaymentTransactionQueryDto,
  ): Promise<PaymentTransactionListResponseVo> {
    return this.paymentTransactionService.adminList(query);
  }

  /**
   * 查询支付流水详情
   */
  @Get(':id')
  @RequirePermission(Permission.ADMIN_PAYMENT)
  @ApiOperation({ summary: 'Get payment transaction detail' })
  @ApiOkResponse({ type: PaymentTransactionVo })
  async getDetail(@Param('id') id: string): Promise<PaymentTransactionVo> {
    return this.paymentTransactionService.adminGetDetail(id);
  }
}
