/**
 * 管理员认证控制器模块
 * 本模块负责处理管理员相关的认证请求，
 * 包括管理员登录、登出以及会话管理等操作。
 */
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { AdminLoginRequestDto } from '../modules/auth/dto/admin-auth.dto';
import { AdminAuthSessionVo } from '../modules/auth/vo/admin-auth.vo';
import { ADMIN_AUTH_MESSAGES } from '../modules/auth/admin-auth.messages';
import { AdminAuthService } from '../modules/auth/admin-auth.service';

/**
 * 管理员认证控制器
 * 提供管理员登录接口，所有接口均允许公开访问（PUBLIC 权限），
 * 路由前缀为 /admin/auth。
 */
@ApiTags('admin-auth')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('admin/auth')
export class AdminAuthController {
  /**
   * 构造函数
   * 注入 AdminAuthService 实例，用于处理具体的认证业务逻辑。
   * @param adminAuthService - 管理员认证服务实例
   */
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * 管理员登录接口
   * 接收管理员提交的登录请求，验证用户名和密码后返回会话信息。
   * @param body - 登录请求数据传输对象，包含用户名和密码
   * @returns 返回管理员会话数据传输对象，包含访问令牌等信息
   */
  @Post('login')
  @ApiOperation({ summary: 'Login with administrator username and password' })
  @ApiOkResponse({ type: AdminAuthSessionVo })
  @ApiForbiddenResponse({
    description: ADMIN_AUTH_MESSAGES.INVALID_CREDENTIALS,
  })
  login(@Body() body: AdminLoginRequestDto) {
    // 调用认证服务执行登录逻辑，返回会话信息
    return this.adminAuthService.login(body);
  }
}
