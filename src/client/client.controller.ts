/**
 * @fileoverview 客户端个人资料控制器
 * 提供客户端用户个人资料的读取接口
 */

// 引入 NestJS 控制器相关装饰器
import { Body, Controller, Get, Post } from '@nestjs/common';

// 引入 Swagger 文档装饰器，用于生成 API 文档
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

// 引入访问级别装饰器，用于控制接口访问权限
import { RequireAccessLevel } from '../access-level.decorator';

// 引入访问级别枚举，定义不同角色的访问权限
import { AccessLevel } from '../access-level.enum';

// 引入权限装饰器
import { RequirePermission } from '../permission.decorator';
import { Permission } from '../permission.enum';

// 引入当前认证信息装饰器，用于获取当前登录用户信息
import { CurrentAuth } from '../current-auth.decorator';

// 引入认证令牌载荷类型，定义 JWT 令牌的数据结构
import type { AuthTokenPayload } from '../auth-token';

// 引入用户信息 VO
import { UserInfoVo } from '../modules/user/vo/user.vo';

// 引入用户服务，处理用户相关的业务逻辑
import { UserService } from '../modules/user/user.service';

// 引入实名认证请求 DTO
import { SubmitRealNameAuthRequestDto } from '../modules/user/dto/user.dto';

/**
 * 客户端个人资料控制器
 * 负责处理客户端用户的个人资料相关请求
 * 所有接口都需要客户端级别的访问权限
 */
@ApiTags('client')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/profile')
export class ClientController {
  /**
   * 构造函数
   * @param userService - 用户服务实例，用于处理用户相关的业务逻辑
   */
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前客户端用户的个人资料
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的资料信息
   */
  @Get()
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Read the current client profile' })
  @ApiOkResponse({
    description: 'Returns a client scoped profile payload.',
    type: UserInfoVo,
  })
  async getProfile(@CurrentAuth() auth: AuthTokenPayload): Promise<UserInfoVo> {
    return this.userService.getById(auth.sub);
  }

  /**
   * 提交实名认证信息
   * @param auth - 当前认证信息
   * @param body - 实名认证表单数据
   * @returns 更新后的用户信息
   */
  @Post('real-name-auth')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Submit real-name authentication' })
  @ApiOkResponse({
    description: 'Returns updated user info after real-name auth.',
    type: UserInfoVo,
  })
  async submitRealNameAuth(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: SubmitRealNameAuthRequestDto,
  ) {
    return this.userService.submitRealNameAuth(auth.sub, body);
  }
}
