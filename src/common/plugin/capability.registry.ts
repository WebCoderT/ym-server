/**
 * 能力注册中心
 *
 * 提供插件向核心模块暴露"可查询能力"的机制。
 * 插件在模块初始化时通过 register() 注册能力处理器，
 * 核心模块通过 invoke() 调用能力，无需直接引用插件服务。
 *
 * 当插件未安装时，invoke() 返回 null，调用方据此优雅降级。
 *
 * @module capability.registry
 */

import { Injectable } from '@nestjs/common';

/** 能力处理器函数类型 */
type CapabilityHandler = (input: any) => Promise<any>;

/**
 * 能力注册中心
 *
 * 管理所有插件注册的能力处理器，提供注册、调用和查询接口。
 * 作为全局 Provider 注入到核心模块中使用。
 */
@Injectable()
export class CapabilityRegistry {
  private handlers = new Map<string, CapabilityHandler>();

  /**
   * 注册能力处理器
   *
   * @param name - 能力名称（建议使用 "插件名:能力名" 的命名空间格式）
   * @param handler - 异步处理函数
   */
  register(name: string, handler: CapabilityHandler): void {
    this.handlers.set(name, handler);
  }

  /**
   * 调用插件能力
   *
   * 若指定能力未注册（插件未安装），返回 null。
   * 调用方应据此提供降级逻辑。
   *
   * @param name - 能力名称
   * @param input - 输入参数
   * @returns 能力处理结果，或 null（未注册时）
   */
  async invoke<TInput, TOutput>(name: string, input: TInput): Promise<TOutput | null> {
    const handler = this.handlers.get(name);
    if (!handler) return null;
    return handler(input) as Promise<TOutput>;
  }

  /**
   * 检查能力是否已注册
   *
   * @param name - 能力名称
   * @returns 是否已注册
   */
  has(name: string): boolean {
    return this.handlers.has(name);
  }
}
