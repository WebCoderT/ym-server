/**
 * 访问级别装饰器模块
 *
 * 本模块提供自定义装饰器 `RequireAccessLevel`，用于在控制器或方法上声明所需的访问级别。
 * NestJS 守卫通过读取该装饰器设置的元数据，判断当前请求是否具备访问目标接口的权限。
 *
 * @module access-level.decorator
 */

// NestJS 提供的 SetMetadata 工具，用于在类或方法上设置自定义元数据
import { SetMetadata } from '@nestjs/common';
// 访问级别枚举，定义了系统支持的角色类型
import { AccessLevel } from './access-level.enum';

/**
 * 访问级别元数据的键名常量
 *
 * 该常量作为元数据的唯一标识符，供守卫通过 Reflector 读取。
 * 使用常量而非硬编码字符串，可避免拼写错误并提升代码可维护性。
 */
export const ACCESS_LEVEL_KEY = 'access-level';

/**
 * 访问级别要求装饰器
 *
 * 该装饰器接收一个 AccessLevel 枚举值，并将其作为元数据绑定到目标类或方法上。
 * AccessLevelGuard 会在请求处理前读取此元数据，与请求令牌中的角色进行比对，
 * 从而决定是否放行该请求。
 *
 * @param level - 所需的访问级别（ADMIN / CLIENT / PUBLIC）
 * @returns 一个方法装饰器/类装饰器工厂函数
 */
export const RequireAccessLevel = (level: AccessLevel) =>
  // 使用 SetMetadata 将访问级别值绑定到 ACCESS_LEVEL_KEY 键上
  SetMetadata(ACCESS_LEVEL_KEY, level);
