/**
 * 全局插件加载模块
 *
 * PluginModule 是一个全局 DynamicModule，在应用启动时自动扫描 src/modules/ 目录下
 * 所有包含 plugin.json 的插件目录，动态导入并注册其模块、实体与控制器。
 *
 * 通过 global: true 标记为全局模块，使插件导出的 Service 在整个应用中可注入，
 * 无需在各业务模块中显式 import 插件模块。
 *
 * @module plugin.module
 */

import { DynamicModule, Global, Module } from '@nestjs/common';
import { PluginScanner } from './plugin-scanner';

/**
 * 全局插件模块
 * 负责自动发现、加载并注册所有已安装的插件
 */
@Global()
@Module({})
export class PluginModule {
  /**
   * 注册所有已安装的插件
   *
   * 扫描 src/modules/ 目录，为每个发现的插件：
   * 1. 将其主模块加入 imports（注册控制器、实体、服务）
   * 2. 将其主模块加入 exports（使其导出的 Service 全局可用）
   *
   * @returns 配置完成的 DynamicModule
   */
  static forRoot(): DynamicModule {
    const plugins = PluginScanner.scan();

    const imports = plugins.map((p) => p.moduleClass);
    const exports = plugins.map((p) => p.moduleClass);

    if (plugins.length > 0) {
      const pluginNames = plugins.map((p) => `${p.manifest.name}@${p.manifest.version}`).join(', ');
      console.log(`[PluginModule] 已加载 ${plugins.length} 个插件: ${pluginNames}`);
    } else {
      console.log('[PluginModule] 未发现已安装的插件');
    }

    return {
      module: PluginModule,
      global: true,
      imports,
      exports,
    };
  }
}
