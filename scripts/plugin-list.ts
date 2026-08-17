/**
 * 插件列表脚本
 *
 * 用法: npm run plugin:list
 *
 * 功能: 扫描 src/modules 下所有插件的 plugin.json 并展示已安装的插件信息
 */

import * as fs from 'fs';
import * as path from 'path';

const modulesDir = path.join(process.cwd(), 'src', 'modules');

if (!fs.existsSync(modulesDir)) {
  console.log('未发现 src/modules/ 目录');
  process.exit(0);
}

const dirs = fs.readdirSync(modulesDir, { withFileTypes: true });
interface PluginInfo { name: string; version: string; description: string; author?: string }
const plugins: PluginInfo[] = [];

for (const dir of dirs) {
  if (!dir.isDirectory()) continue;

  const manifestPath = path.join(modulesDir, dir.name, 'plugin.json');
  if (!fs.existsSync(manifestPath)) continue;

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    plugins.push({
      name: manifest.name || dir.name,
      version: manifest.version || '未知',
      description: manifest.description || '',
      author: manifest.author,
    });
  } catch {
    plugins.push({
      name: dir.name,
      version: '未知',
      description: 'plugin.json 解析失败',
    });
  }
}

if (plugins.length === 0) {
  console.log('未发现已安装的插件。');
  console.log('使用 npm run plugin:install <path-to-plugin.zip> 安装插件。');
} else {
  console.log(`已安装 ${plugins.length} 个插件:\n`);

  // 计算列宽
  const nameWidth = Math.max(8, ...plugins.map((p) => p.name.length));
  const versionWidth = Math.max(8, ...plugins.map((p) => p.version.length));
  const authorWidth = Math.max(6, ...plugins.map((p) => (p.author || '-').length));

  // 表头
  const header = [
    '名称'.padEnd(nameWidth + 2),
    '版本'.padEnd(versionWidth + 2),
    '作者'.padEnd(authorWidth + 2),
    '描述',
  ].join('│ ');

  console.log(header);
  console.log('─'.repeat(header.length));

  // 表格内容
  for (const p of plugins) {
    const row = [
      p.name.padEnd(nameWidth + 2),
      p.version.padEnd(versionWidth + 2),
      (p.author || '-').padEnd(authorWidth + 2),
      p.description,
    ].join('│ ');
    console.log(row);
  }
}
