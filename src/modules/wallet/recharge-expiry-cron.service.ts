import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RechargeService } from './recharge.service';

/**
 * 充值订单过期兜底扫描服务
 * 每隔 5 分钟执行一次全量扫描，
 * 将超过 15 分钟未支付的充值订单自动取消
 */
@Injectable()
export class RechargeExpiryCronService {
  private readonly logger = new Logger(RechargeExpiryCronService.name);

  constructor(private readonly rechargeService: RechargeService) {}

  /**
   * 每 5 分钟执行一次过期充值订单批量取消
   * 查询所有 status=PENDING 且 expireAt <= now 的订单并取消
   */
  @Interval(5 * 60 * 1000)
  async handleCron(): Promise<void> {
    try {
      const count = await this.rechargeService.cancelExpiredRecharges();
      if (count > 0) {
        this.logger.log(`[充值过期兜底] 本轮取消 ${count} 个过期充值订单`);
      }
    } catch (err) {
      this.logger.error(`[充值过期兜底] 扫描失败: ${(err as Error).message}`);
    }
  }
}
