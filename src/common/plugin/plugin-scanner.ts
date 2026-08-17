/**
 * 插件扫描器
 *
 * 负责在应用启动时扫描 src/modules/ 目录下所有包含 plugin.json 的子目录，
 * 解析清单文件并动态导入各插件的主模块类，供 PluginModule 统一注册。
 *
 * 使用 TypeScript 的 transpileModule API 编译 .ts 插件文件，
 * 避免 Node.js 22 原生 TypeScript 加载器不支持装饰器/参数属性等语法的问题。
 *
 * @module plugin-scanner
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import type { PluginManifest, DiscoveredPlugin } from './plugin.types';

/** TypeScript 转译选项（与项目 tsconfig 保持一致） */
const TRANSPILE_OPTIONS: ts.TranspileOptions = {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2023,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    allowJs: true,
    moduleResolution: ts.ModuleResolutionKind.Node10,
  },
};

/** 已编译的文件缓存（避免重复编译） */
const compileCache = new Map<string, string>();

/**
 * 编译 TypeScript 文件内容
 */
function transpileTs(code: string, filename: string): string {
  const cached = compileCache.get(filename);
  if (cached) return cached;

  const result = ts.transpileModule(code, {
    ...TRANSPILE_OPTIONS,
    fileName: filename,
  });

  compileCache.set(filename, result.outputText);
  return result.outputText;
}

/**
 * 加载 TypeScript/JavaScript 模块
 *
 * 对于 .ts 文件，使用 TypeScript.transpileModule 编译后通过 Module._compile 加载。
 * 编译后的 require() 调用会递归触发此加载器，实现完整的依赖树解析。
 */
function loadModule(filePath: string): any {
  const Module = require('module');

  // 如果已缓存，直接返回
  if (require.cache[filePath]) {
    return require.cache[filePath]!.exports;
  }

  if (filePath.endsWith('.ts')) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const compiledCode = transpileTs(code, filePath);

    const m = new Module(filePath);
    m.filename = filePath;
    m.paths = Module._nodeModulePaths(path.dirname(filePath));

    // 先将模块加入缓存（处理循环依赖）
    require.cache[filePath] = m;

    // 重写 m.require 以递归处理 .ts 文件导入
    const originalRequire = m.require.bind(m);
    m.require = function (id: string) {
      // 解析相对路径
      if (id.startsWith('.')) {
        const resolved = resolveImport(id, path.dirname(filePath));
        if (resolved) {
          return loadModule(resolved);
        }
      }
      // npm 包或其他路径使用原始 require
      return originalRequire(id);
    };

    m._compile(compiledCode, filePath);
    return m.exports;
  }

  return require(filePath);
}

/**
 * 解析导入路径到实际文件
 *
 * 尝试添加 .ts / .js 扩展名，或查找 index.ts / index.js
 */
function resolveImport(id: string, fromDir: string): string | null {
  const basePath = path.resolve(fromDir, id);

  // 精确路径
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }
  // .ts 扩展名
  if (fs.existsSync(basePath + '.ts')) {
    return basePath + '.ts';
  }
  // .js 扩展名
  if (fs.existsSync(basePath + '.js')) {
    return basePath + '.js';
  }
  // index.ts
  if (fs.existsSync(path.join(basePath, 'index.ts'))) {
    return path.join(basePath, 'index.ts');
  }
  // index.js
  if (fs.existsSync(path.join(basePath, 'index.js'))) {
    return path.join(basePath, 'index.js');
  }

  return null;
}

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

      // 查找实际文件路径
      let resolvedPath: string | null = null;

      if (fs.existsSync(modulePath)) {
        resolvedPath = modulePath;
      } else if (fs.existsSync(modulePath + '.ts')) {
        resolvedPath = modulePath + '.ts';
      } else if (fs.existsSync(modulePath + '.js')) {
        resolvedPath = modulePath + '.js';
      } else {
        console.warn(
          `[PluginScanner] 插件 "${manifest.name}"：主模块文件不存在 (${moduleFile})`,
        );
        continue;
      }

      try {
        const moduleExports = loadModule(resolvedPath);
        const moduleClass = moduleExports[manifest.mainModule];

        if (!moduleClass) {
          throw new Error(
            `插件 "${manifest.name}"：无法在 ${moduleFile} 中找到导出类 "${manifest.mainModule}"`,
          );
        }

        plugins.push({ manifest, moduleClass });
      } catch (err) {
        console.error(
          `[PluginScanner] 插件 "${manifest.name}" 加载失败: ${(err as Error).message}`,
        );
        throw err;
      }
    }

    return plugins;
  }
}
