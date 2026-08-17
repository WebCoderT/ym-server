/**
 * 公共控制器模块
 * 提供无需认证即可访问的公共接口，例如健康检查
 */

// 引入 NestJS 控制器相关装饰器
import { Controller, Get } from '@nestjs/common';
// 引入 Swagger 文档装饰器，用于生成 API 文档
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
// 引入访问级别装饰器，用于标注接口所需的访问权限
import { RequireAccessLevel } from '../access-level.decorator';
// 引入访问级别枚举，定义系统支持的权限等级
import { AccessLevel } from '../access-level.enum';

/**
 * 公共接口控制器
 * 负责处理所有面向公众的 HTTP 请求
 * 所有接口均允许 PUBLIC 级别访问
 */
@ApiTags('public')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('public')
export class PublicController {
  /**
   * 健康检查接口
   * 用于外部监控或服务发现，确认当前服务是否正常运行
   *
   * @returns 返回服务对象的健康状态及访问受众信息
   */
  @Get('health')
  @ApiOperation({ summary: 'Public health check endpoint' })
  @ApiOkResponse({ description: 'Returns the service health status.' })
  getHealth() {
    // 构造健康检查结果对象
    return {
      // 标识当前接口的访问级别为 PUBLIC（公共访问）
      audience: AccessLevel.PUBLIC,
      // 服务运行状态，固定返回 ok 表示正常
      status: 'ok',
    };
  }
}
