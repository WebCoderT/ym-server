/**
 * @fileoverview 客户端认证控制器
 * 提供客户端用户的会话查询和登出功能
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

// 引入认证服务，处理登录、登出等认证相关业务逻辑
import { AuthService } from '../modules/auth/auth.service';

// 引入认证相关的请求 DTO
import {
  BindPhoneRequestDto,
  LogoutRequestDto,
  WechatBindPhoneRequestDto,
} from '../modules/auth/auth.dto';

// 引入认证和用户相关的响应 VO
import { LogoutResponseVo } from '../modules/auth/vo/auth.vo';
import { UserInfoVo } from '../modules/user/vo/user.vo';

// 引入用户服务，处理用户相关的业务逻辑
import { UserService } from '../modules/user/user.service';

/**
 * 客户端认证控制器
 * 负责处理客户端用户的认证相关请求，包括会话查询和登出操作
 * 所有接口都需要客户端级别的访问权限
 */
@ApiTags('client-auth')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/auth')
export class ClientAuthController {
  /**
   * 构造函数
   * @param authService - 认证服务实例，用于处理登录、登出等认证业务
   * @param userService - 用户服务实例，用于处理用户相关的业务逻辑
   */
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取当前客户端用户的会话信息
   * 用于前端页面加载时确认用户登录状态并获取基本信息
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的资料信息
   */
  @Get('session')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Read current client auth session' })
  @ApiOkResponse({ type: UserInfoVo })
  getSession(@CurrentAuth() auth: AuthTokenPayload) {
    // 调用用户服务，根据用户 ID 获取用户资料
    return this.userService.getProfile(auth.sub);
  }

  /**
   * 登出当前客户端会话
   * 使当前用户的刷新令牌失效，完成安全登出
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @param body - 登出请求体，包含需要失效的刷新令牌
   * @returns 返回登出操作的结果
   */
  @Post('logout')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Logout current client session' })
  @ApiOkResponse({ type: LogoutResponseVo })
  logout(@CurrentAuth() auth: AuthTokenPayload, @Body() body: LogoutRequestDto) {
    // 调用认证服务，执行登出操作，使刷新令牌失效
    return this.authService.logoutClientSession(auth, body.refreshToken);
  }

  /**
   * 绑定手机号
   * 为当前已登录的微信用户绑定手机号，需要短信验证码验证
   * @param auth - 当前认证信息，包含用户 ID
   * @param body - 绑定手机号请求体，包含手机号和验证码
   * @returns 返回更新后的用户信息
   */
  @Post('bind-phone')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Bind phone number for current user' })
  @ApiOkResponse({ type: UserInfoVo })
  bindPhone(@CurrentAuth() auth: AuthTokenPayload, @Body() body: BindPhoneRequestDto) {
    return this.authService.bindPhone(auth.sub, body);
  }

  /**
   * 微信一键绑定手机号
   * 使用微信 getPhoneNumber 获取的 code 直接绑定，无需短信验证码
   * @param auth - 当前认证信息
   * @param body - 包含微信 code 的请求体
   * @returns 更新后的用户信息
   */
  @Post('bind-phone-wechat')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Bind phone via WeChat getPhoneNumber (no SMS needed)' })
  @ApiOkResponse({ type: UserInfoVo })
  bindPhoneWechat(@CurrentAuth() auth: AuthTokenPayload, @Body() body: WechatBindPhoneRequestDto) {
    return this.authService.bindPhoneByWechat(auth.sub, body);
  }
}
