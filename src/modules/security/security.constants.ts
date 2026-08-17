/**
 * 安全模块常量定义
 *
 * 提供用于依赖注入的 Token 常量，使核心模块可以通过字符串 Token 注入安全服务，
 * 避免对插件模块的硬编码运行时依赖，支持插件卸载时的优雅降级。
 *
 * @module security.constants
 */

/**
 * 安全服务的注入 Token
 *
 * 核心模块通过 @Inject(SECURITY_SERVICE) 注入 SecurityService，
 * 配合 @Optional() 装饰器实现插件卸载时的静默降级。
 */
export const SECURITY_SERVICE = 'SECURITY_SERVICE';
