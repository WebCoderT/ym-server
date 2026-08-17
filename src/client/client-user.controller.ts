/**
 * @fileoverview 客户端用户控制器
 * 提供客户端用户的个人资料、隐私设置查询和更新功能
 */

// 引入 NestJS 控制器相关装饰器
import { Body, Controller, Get, Put } from '@nestjs/common';

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

// 引入用户服务，处理用户相关的业务逻辑
import { UserService } from '../modules/user/user.service';

// 引入隐私设置相关的 DTO，定义隐私设置的数据结构
import { UpdatePrivacySettingRequestDto } from '../modules/user/dto/privacy-setting.dto';
import { UserPrivacySettingVo } from '../modules/user/vo/user.vo';

// 引入用户信息 DTO，定义返回给客户端的用户数据结构
import { UpdateClientProfileRequestDto } from '../modules/user/dto/user.dto';
import { UserInfoVo } from '../modules/user/vo/user.vo';

/**
 * 客户端用户控制器
 * 负责处理客户端用户的个人资料和隐私设置相关请求
 * 所有接口都需要客户端级别的访问权限
 */
@ApiTags('client-user')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/user')
export class ClientUserController {
  /**
   * 构造函数
   * @param userService - 用户服务实例，用于处理用户相关的业务逻辑
   */
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户的完整个人资料
   * 返回包含用户详细信息的资料数据
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的完整资料信息
   */
  @Get('profile')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Read the current user full profile' })
  @ApiOkResponse({ type: UserInfoVo })
  async getProfile(@CurrentAuth() auth: AuthTokenPayload) {
    // 调用用户服务，根据用户 ID 获取完整用户资料
    return this.userService.getById(auth.sub);
  }

  /**
   * 获取当前用户的隐私设置
   * 返回用户当前的隐私配置信息
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的隐私设置信息
   */
  @Get('privacy-settings')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Get current user privacy settings' })
  @ApiOkResponse({ type: UserPrivacySettingVo })
  async getPrivacySettings(@CurrentAuth() auth: AuthTokenPayload) {
    // 调用用户服务，根据用户 ID 获取隐私设置
    return this.userService.getPrivacySetting(auth.sub);
  }

  /**
   * 更新当前用户的隐私设置
   * 接收新的隐私配置并保存到数据库
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @param body - 更新隐私设置请求体，包含新的隐私配置数据
   * @returns 返回更新后的隐私设置信息
   */
  @Put('privacy-settings')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Update current user privacy settings' })
  @ApiOkResponse({ type: UserPrivacySettingVo })
  async updatePrivacySettings(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: UpdatePrivacySettingRequestDto,
  ) {
    // 调用用户服务，根据用户 ID 和请求体更新隐私设置
    return this.userService.updatePrivacySetting(auth.sub, body);
  }

  /**
   * 更新当前用户的个人资料
   * 支持更新昵称、头像和手机号
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @param body - 更新个人资料请求体
   * @returns 返回更新后的用户详细信息
   */
  @Put('profile')
  @RequirePermission(Permission.CLIENT_PROFILE)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserInfoVo })
  async updateProfile(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: UpdateClientProfileRequestDto,
  ) {
    return this.userService.updateClientProfile(auth.sub, body);
  }
}
