import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from '../current-auth.decorator';
import type { AuthTokenPayload } from '../auth-token';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';
import {
  MemberLevelDto,
  UserMemberLevelResponseDto,
} from '../modules/member-level/dto/member-level.dto';
import { MemberLevelService } from '../modules/member-level/member-level.service';

/**
 * 客户端会员等级控制器
 * 提供会员等级配置查询及当前用户等级查询
 */
@ApiTags('client-member-level')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/member-levels')
export class ClientMemberLevelController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  /**
   * 获取所有会员等级配置
   */
  @Get()
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Get all member levels' })
  @ApiOkResponse({ type: [MemberLevelDto] })
  async findAll(): Promise<MemberLevelDto[]> {
    return this.memberLevelService.getAll();
  }

  /**
   * 获取当前用户会员等级信息
   */
  @Get('me')
  @RequirePermission(Permission.CLIENT_MEMBER)
  @ApiOperation({ summary: 'Get current user member level' })
  @ApiOkResponse({ type: UserMemberLevelResponseDto })
  async getMyLevel(@CurrentAuth() auth: AuthTokenPayload): Promise<UserMemberLevelResponseDto> {
    return this.memberLevelService.getUserLevel(auth.sub);
  }
}
