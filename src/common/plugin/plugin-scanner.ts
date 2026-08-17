/**
 * 插件扫描器
 *
 * 负责在应用启动时扫描 src/modules/ 目录下所有包含 plugin.json 的子目录，
 * 解析清单文件并动态导入各插件的主模块类，供 PluginModule 统一注册。
 *
 * @module plugin-scanner
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PluginManifest, DiscoveredPlugin } from './plugin.types';

/**
 * 插件扫描器
 * 通过文件系统扫描发现所有已安装的插件，并动态加载其主模块
 */
export class PluginScanner {
  /**
   * 扫描 src/modules/ 目录，发现并加载所有插件
   *
   * @returns 已发现的插件列表，每项包含清单信息与主模块类引用
   * @throws Error 当插件清单缺少必要字段或主模块类不存在时抛出
   */
  static scan(): DiscoveredPlugin[] {
    const modulesDir = path.join(process.cwd(), 'src', 'modules');
    const plugins: DiscoveredPlugin[] = [];

    if (!fs.existsSync(modulesDir)) return plugins;

    const dirs = fs.readdirSync(modulesDir, { withFileTypes: true });

    for (const dirEntry of dirs) {
      if (!dirEntry.isDirectory()) continue;

      const dirName = dirEntry.name;
      const manifestPath = path.join(modulesDir, dirName, 'plugin.json');
      if (!fs.existsSync(manifestPath)) continue;

      // 解析并校验清单文件
      let manifest: PluginManifest;
      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        manifest = JSON.parse(raw);
      } catch (err) {
        console.warn(
          `[PluginScanner] 跳过目录 "${dirName}"：plugin.json 解析失败 - ${(err as Error).message}`,
        );
        continue;
      }

      // 校验必要字段
      if (!manifest.name || !manifest.mainModule) {
        console.warn(
          `[PluginScanner] 跳过目录 "${dirName}"：plugin.json 缺少 name 或 mainModule 字段`,
        );
        continue;
      }

      // 确定主模块文件路径
      const moduleFile = manifest.mainModuleFile ?? `${manifest.name}.module`;
      const modulePath = path.join(modulesDir, dirName, moduleFile);

      if (!fs.existsSync(modulePath)) {
        // 尝试带扩展名的路径
        const modulePathTs = modulePath + '.ts';
        const modulePathJs = modulePath + '.js';
        let resolvedPath: string | null = null;

        if (fs.existsSync(modulePathTs)) {
          resolvedPath = modulePathTs;
        } else if (fs.existsSync(modulePathJs)) {
          resolvedPath = modulePathJs;
        } else {
          console.warn(
            `[PluginScanner] 插件 "${manifest.name}"：主模块文件不存在 (${moduleFile})`,
          );
          continue;
        }

        const moduleExports = require(resolvedPath);
        const moduleClass = moduleExports[manifest.mainModule];

        if (!moduleClass) {
          throw new Error(
            `插件 "${manifest.name}"：无法在 ${moduleFile} 中找到导出类 "${manifest.mainModule}"`,
          );
        }

        plugins.push({ manifest, moduleClass });
        continue;
      }

      // 动态导入主模块
      const moduleExports = require(modulePath);
      const moduleClass = moduleExports[manifest.mainModule];

      if (!moduleClass) {
        throw new Error(
          `插件 "${manifest.name}"：无法在 ${moduleFile} 中找到导出类 "${manifest.mainModule}"`,
        );
      }

      plugins.push({ manifest, moduleClass });
    }

    return plugins;
  }
}
