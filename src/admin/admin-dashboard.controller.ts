/**
 * 管理员仪表盘统计控制器
 * 提供通用的仪表盘统计数据
 */
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { UserEntity } from '../modules/user/entities/user.entity';
import { MemberTaskEntity } from '../modules/member/entities/member.entity';
import { RechargeOrderEntity } from '../modules/wallet/entities/recharge-order.entity';
import { WithdrawalRequestEntity } from '../modules/wallet/entities/withdrawal-request.entity';
import { ImageEntity } from '../modules/image/entities/image.entity';
import { BannerEntity } from '../modules/banner/entities/banner.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entity';
import { CourierCompanyEntity } from '../modules/courier-company/entities/courier-company.entity';
import { TrendRange } from '../modules/dashboard/enums/trend-range.enum';
import {
  DashboardStatsResponseVo,
  TrendResponseVo,
} from '../modules/dashboard/vo/dashboard.vo';

@ApiTags('admin-dashboard')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-admin callers.' })
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(MemberTaskEntity)
    private readonly memberRepo: Repository<MemberTaskEntity>,
    @InjectRepository(RechargeOrderEntity)
    private readonly rechargeRepo: Repository<RechargeOrderEntity>,
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawalRepo: Repository<WithdrawalRequestEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(BannerEntity)
    private readonly bannerRepo: Repository<BannerEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(CourierCompanyEntity)
    private readonly courierRepo: Repository<CourierCompanyEntity>,
  ) {}

  /**
   * 获取仪表盘统计数据
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiOkResponse({ type: DashboardStatsResponseVo })
  async getStats(): Promise<DashboardStatsResponseVo> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      userCount,
      todayNewUsers,
      memberCount,
      rechargeCount,
      rechargeTotal,
      withdrawalCount,
      imageCount,
      bannerCount,
      notificationCount,
      courierCount,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { createdAt: MoreThanOrEqual(todayStart) } }),
      this.memberRepo.count(),
      this.rechargeRepo.count(),
      this.rechargeRepo
        .createQueryBuilder('r')
        .select('SUM(r.amount)', 'total')
        .getRawOne()
        .then((r) => Number(r?.total ?? 0)),
      this.withdrawalRepo.count(),
      this.imageRepo.count(),
      this.bannerRepo.count(),
      this.notificationRepo.count(),
      this.courierRepo.count(),
    ]);

    return {
      audience: AccessLevel.ADMIN,
      users: { total: userCount, todayNew: todayNewUsers },
      members: { total: memberCount },
      wallet: { rechargeCount, rechargeTotal, withdrawalCount },
      content: { imageCount, bannerCount, notificationCount, courierCount },
    };
  }

  /**
   * 获取趋势数据
   */
  @Get('trend')
  @ApiOperation({ summary: 'Get trend data' })
  @ApiOkResponse({ type: TrendResponseVo })
  async getTrend(@Query('range') range: TrendRange = TrendRange.WEEK): Promise<TrendResponseVo> {
    return {
      audience: AccessLevel.ADMIN,
      points: [],
    };
  }
}
