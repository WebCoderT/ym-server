/**
 * 安全事件监听器
 *
 * 监听核心模块发布的用户领域事件（注册、登录），
 * 自动调用 SecurityService 记录设备信息与审计日志。
 *
 * 通过事件总线实现与核心模块的完全解耦：
 * - 核心模块不引用 SecurityService
 * - 安全插件不引用核心模块
 * - 当插件卸载时，事件无人监听，功能静默降级
 *
 * @module security-event.listener
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SecurityService } from './security.service';
import { USER_REGISTERED, USER_LOGGED_IN } from '../../common/events/domain-events';
import type { UserRegisteredPayload, UserLoggedInPayload } from '../../common/events/domain-events';

/**
 * 安全事件监听器
 * 订阅用户领域事件，执行设备记录与审计日志写入
 */
@Injectable()
export class SecurityEventListener {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * 处理用户注册事件
   * 若注册时携带设备信息，自动记录到登录设备列表
   *
   * 注意：参数不使用显式接口类型注解，因为 emitDecoratorMetadata + isolatedModules
   * 要求被装饰方法签名中的类型必须通过 namespace import 或 import type 导入。
   * 类型通过 import type 在文件顶部导入，方法体中通过类型断言使用。
   */
  @OnEvent(USER_REGISTERED)
  async onUserRegistered(payload: UserRegisteredPayload): Promise<void> {
    if (payload.deviceId) {
      await this.securityService.addDevice(payload.userId, {
        deviceId: payload.deviceId,
        deviceName: payload.deviceName || null,
        loginIp: null,
        loginCity: null,
        isCurrent: 1,
      });
    }
  }

  /**
   * 处理用户登录事件
   * 记录本次登录的设备信息
   */
  @OnEvent(USER_LOGGED_IN)
  async onUserLoggedIn(payload: UserLoggedInPayload): Promise<void> {
    await this.securityService.addDevice(payload.userId, {
      deviceId: payload.deviceId ?? 'unknown',
      deviceName: payload.deviceName ?? null,
      loginIp: payload.loginIp ?? null,
      loginCity: payload.loginCity ?? null,
      isCurrent: 1,
    });
  }
}
