/**
 * @fileoverview 客户端安全控制器（插件内置）
 * 提供客户端用户的设备管理和安全审计日志查询功能
 *
 * 原位于 src/client/client-security.controller.ts，
 * 插件化后迁入安全模块内部，使插件自包含。
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

// 引入访问级别装饰器，用于控制接口访问权限（模板公共 API）
import { RequireAccessLevel } from '../../../access-level.decorator';

// 引入访问级别枚举，定义不同角色的访问权限（模板公共 API）
import { AccessLevel } from '../../../access-level.enum';

// 引入权限装饰器（模板公共 API）
import { RequirePermission } from '../../../permission.decorator';
import { Permission } from '../../../permission.enum';

// 引入当前认证信息装饰器，用于获取当前登录用户信息（模板公共 API）
import { CurrentAuth } from '../../../current-auth.decorator';

// 引入认证令牌载荷类型，定义 JWT 令牌的数据结构（模板公共 API）
import type { AuthTokenPayload } from '../../../auth-token';

// 引入安全服务，处理设备管理和安全审计相关业务逻辑
import { SecurityService } from '../security.service';

// 引入安全相关的 DTO，定义设备管理和审计日志的数据结构
import { LogoutDeviceRequestDto } from '../dto/security.dto';
import {
  LogoutDeviceResponseVo,
  SecurityAuditLogListResponseVo,
  UserDeviceListResponseVo,
} from '../vo/security.vo';

/**
 * 客户端安全控制器
 * 负责处理客户端用户的设备管理和安全审计相关请求
 * 所有接口都需要客户端级别的访问权限
 */
@ApiTags('client-security')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Forbidden for non-client callers.' })
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/user/security')
export class ClientSecurityController {
  /**
   * 构造函数
   * @param securityService - 安全服务实例，用于处理设备管理和安全审计业务
   */
  constructor(private readonly securityService: SecurityService) {}

  /**
   * 获取当前用户的登录设备列表
   * 返回用户所有已登录的设备信息，帮助用户了解账号登录状态
   * @param auth - 当前认证信息，包含用户 ID 和设备 ID 等令牌载荷数据
   * @returns 返回当前用户的登录设备列表
   */
  @Get('devices')
  @RequirePermission(Permission.CLIENT_SECURITY)
  @ApiOperation({ summary: 'Get current user login device list' })
  @ApiOkResponse({ type: UserDeviceListResponseVo })
  async getDevices(@CurrentAuth() auth: AuthTokenPayload) {
    // 调用安全服务，根据用户 ID 和当前设备 ID 获取设备列表
    // 传入当前设备 ID 用于标识当前登录设备
    return this.securityService.getDeviceList(auth.sub, auth.deviceId);
  }

  /**
   * 登出指定的设备
   * 使指定设备的登录会话失效，用于远程踢出其他设备
   * @param auth - 当前认证信息，包含用户 ID 和设备 ID 等令牌载荷数据
   * @param body - 登出设备请求体，包含需要登出的目标设备 ID
   * @returns 返回登出操作的结果
   */
  @Post('devices/logout')
  @RequirePermission(Permission.CLIENT_SECURITY)
  @ApiOperation({ summary: 'Logout a specific device' })
  @ApiOkResponse({ type: LogoutDeviceResponseVo })
  async logoutDevice(
    @CurrentAuth() auth: AuthTokenPayload,
    @Body() body: LogoutDeviceRequestDto,
  ) {
    // 调用安全服务，执行设备登出操作
    // 传入用户 ID、目标设备 ID 和当前设备 ID 进行权限验证
    return this.securityService.logoutDevice(
      auth.sub,
      body.deviceId,
      auth.deviceId,
    );
  }

  /**
   * 获取当前用户的安全审计日志
   * 返回用户的账号安全相关操作记录，用于安全审查
   * @param auth - 当前认证信息，包含用户 ID 等令牌载荷数据
   * @returns 返回当前用户的安全审计日志列表
   */
  @Get('audit-logs')
  @RequirePermission(Permission.CLIENT_SECURITY)
  @ApiOperation({ summary: 'Get current user security audit logs' })
  @ApiOkResponse({ type: SecurityAuditLogListResponseVo })
  async getAuditLogs(@CurrentAuth() auth: AuthTokenPayload) {
    // 调用安全服务，根据用户 ID 获取安全审计日志
    return this.securityService.getAuditLogs(auth.sub);
  }
}
