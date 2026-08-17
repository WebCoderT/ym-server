/**
 * 插件系统类型定义
 *
 * 定义插件清单（plugin.json）的接口规范，
 * 每个插件必须在其根目录包含一个符合此接口的 plugin.json 文件。
 *
 * @module plugin.types
 */

/**
 * 插件清单接口
 * 对应插件根目录下的 plugin.json 文件
 */
export interface PluginManifest {
  /** 插件名称，需与目录名一致（如 'security'） */
  name: string;
  /** 语义化版本号（如 '1.0.0'） */
  version: string;
  /** 插件功能描述 */
  description: string;
  /** 插件作者 */
  author?: string;
  /** 主模块类名（如 'SecurityModule'），必须从主模块文件中导出 */
  mainModule: string;
  /** 主模块文件名（不含扩展名），默认: <name>.module */
  mainModuleFile?: string;
  /** 实体类名列表（用于文档与校验） */
  entities?: string[];
  /** 依赖的其他插件名称列表 */
  dependencies?: string[];
  /** 使用的模板公共 API 路径列表（供 CLI 校验兼容性） */
  templateApis?: string[];
}

/**
 * 扫描发现的插件信息
 */
export interface DiscoveredPlugin {
  /** 插件清单 */
  manifest: PluginManifest;
  /** 动态导入的主模块类 */
  moduleClass: new (...args: any[]) => any;
}
