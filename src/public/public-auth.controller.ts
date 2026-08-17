/**
 * 公共认证控制器模块
 * 提供面向客户端用户的认证相关接口，包括登录与令牌刷新
 */

// 引入 NestJS 控制器与请求体装饰器
import { Body, Controller, Post } from '@nestjs/common';
// 引入 Swagger 文档装饰器，用于生成 API 文档
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
// 引入访问级别装饰器，标注接口所需的访问权限
import { RequireAccessLevel } from '../access-level.decorator';
// 引入访问级别枚举，定义系统支持的权限等级
import { AccessLevel } from '../access-level.enum';
// 引入认证服务，处理具体的登录与令牌刷新逻辑
import { AuthService } from '../modules/auth/auth.service';
// 引入认证相关的请求 DTO
import {
  LoginRequestDto,
  PhoneLoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  SendCodeRequestDto,
  CodeLoginRequestDto,
} from '../modules/auth/auth.dto';
// 引入认证相关的响应 VO
import { AuthSessionVo } from '../modules/auth/vo/auth.vo';

/**
 * 公共认证控制器
 * 处理客户端用户的登录与令牌刷新请求
 * 所有接口均允许 PUBLIC 级别访问
 */
@ApiTags('public-auth')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('public/auth')
export class PublicAuthController {
  /**
   * 构造函数
   * 注入认证服务实例，用于处理登录与令牌刷新业务逻辑
   *
   * @param authService - 认证服务实例
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * 客户端用户登录接口
   * 支持微信一键登录，接收登录请求参数并返回会话信息
   *
   * @param body - 登录请求数据传输对象，包含微信登录所需的凭证信息
   * @returns 返回认证会话信息，包括访问令牌与刷新令牌
   */
  @Post('login')
  @ApiOperation({ summary: 'Wechat one-click login for client users' })
  @ApiOkResponse({ type: AuthSessionVo })
  login(@Body() body: LoginRequestDto) {
    // 调用认证服务的客户端登录方法，处理登录逻辑
    return this.authService.loginClient(body);
  }

  /**
   * 刷新客户端访问令牌接口
   * 使用有效的刷新令牌换取新的访问令牌与会话信息
   *
   * @param body - 刷新令牌请求数据传输对象，包含刷新令牌
   * @returns 返回新的认证会话信息，包括新的访问令牌与刷新令牌
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh client access token by refresh token' })
  @ApiOkResponse({ type: AuthSessionVo })
  refresh(@Body() body: RefreshTokenRequestDto) {
    // 调用认证服务的刷新会话方法，生成新的令牌对
    return this.authService.refreshClientSession(body);
  }

  /**
   * 客户端用户注册接口
   * 使用手机号和密码注册新账号
   *
   * @param body - 注册请求数据传输对象
   * @returns 返回认证会话信息，包括访问令牌与刷新令牌
   */
  @Post('register')
  @ApiOperation({ summary: 'Register new account with phone and password' })
  @ApiOkResponse({ type: AuthSessionVo })
  register(@Body() body: RegisterRequestDto) {
    return this.authService.registerClient(body);
  }

  /**
   * 客户端手机号登录接口
   * 使用手机号和密码进行登录
   *
   * @param body - 手机号登录请求数据传输对象
   * @returns 返回认证会话信息，包括访问令牌与刷新令牌
   */
  @Post('login-phone')
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiOkResponse({ type: AuthSessionVo })
  loginPhone(@Body() body: PhoneLoginRequestDto) {
    return this.authService.loginClientByPhone(body);
  }

  /**
   * 发送短信验证码
   */
  @Post('send-code')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiOkResponse({ description: '验证码发送结果' })
  sendCode(@Body() body: SendCodeRequestDto) {
    return this.authService.sendCode(body);
  }

  /**
   * 验证码登录
   * 使用手机号和验证码登录，首次登录自动注册
   */
  @Post('login-code')
  @ApiOperation({ summary: '验证码登录' })
  @ApiOkResponse({ type: AuthSessionVo })
  loginCode(@Body() body: CodeLoginRequestDto) {
    return this.authService.loginByCode(body);
  }
}
