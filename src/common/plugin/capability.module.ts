/**
 * 全局能力注册模块
 *
 * 提供 CapabilityRegistry 作为全局 Provider，
 * 使核心模块可以注入并调用插件注册的能力。
 *
 * @module capability.module
 */

import { Global, Module } from '@nestjs/common';
import { CapabilityRegistry } from './capability.registry';

@Global()
@Module({
  providers: [CapabilityRegistry],
  exports: [CapabilityRegistry],
})
export class CapabilityModule {}
