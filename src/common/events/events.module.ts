/**
 * 全局事件总线模块
 *
 * 封装 @nestjs/event-emitter，提供跨模块的异步领域事件发布/订阅能力。
 * 核心模块通过 emit() 发布事件，插件通过 @OnEvent() 监听事件，
 * 实现模块间完全解耦的"发后即忘"通信。
 *
 * @module events.module
 */

import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
})
export class EventsModule {}
