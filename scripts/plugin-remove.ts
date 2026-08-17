/**
 * 插件移除脚本
 *
 * 用法: npm run plugin:remove <plugin-name>
 *
 * 功能:
 * 1. 检查是否有其他插件依赖此插件
 * 2. 删除 src/modules/<name>/ 目录
 * 3. 从 app.module.ts 移除对应的 import 行
 * 4. 提示用户检查核心模块中的引用
 */

import * as fs from 'fs';
import * as path from 'path';

const pluginName = process.argv[2];

if (!pluginName) {
  console.error('用法: npm run plugin:remove <plugin-name>');
  process.exit(1);
}

const pluginDir = path.join(process.cwd(), 'src', 'modules', pluginName);

if (!fs.existsSync(pluginDir)) {
  console.error(`错误: 插件 "${pluginName}" 不存在`);
  process.exit(1);
}

// 读取插件清单（如果存在）
let manifest: any = null;
const manifestPath = path.join(pluginDir, 'plugin.json');
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    // 忽略解析错误
  }
}

// 检查是否有其他插件依赖此插件
const modulesDir = path.join(process.cwd(), 'src', 'modules');
const dirs = fs.readdirSync(modulesDir, { withFileTypes: true });
const dependents: string[] = [];

for (const dir of dirs) {
  if (!dir.isDirectory() || dir.name === pluginName) continue;

  const otherManifestPath = path.join(modulesDir, dir.name, 'plugin.json');
  if (!fs.existsSync(otherManifestPath)) continue;

  try {
    const otherManifest = JSON.parse(fs.readFileSync(otherManifestPath, 'utf-8'));
    if (otherManifest.dependencies?.includes(pluginName)) {
      dependents.push(dir.name);
    }
  } catch {
    // 忽略
  }
}

if (dependents.length > 0) {
  console.warn(`警告: 以下插件依赖 "${pluginName}": ${dependents.join(', ')}`);
  console.warn('移除后可能导致这些插件无法正常工作。');
}

// 删除插件目录
fs.rmSync(pluginDir, { recursive: true, force: true });
console.log(`✓ 已删除 src/modules/${pluginName}/`);

// 从 app.module.ts 移除 import
const appModulePath = path.join(process.cwd(), 'src', 'app.module.ts');
if (fs.existsSync(appModulePath)) {
  let content = fs.readFileSync(appModulePath, 'utf-8');
  let modified = false;

  const moduleName = manifest?.mainModule ?? `${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Module`;
  const moduleFile = manifest?.mainModuleFile ?? `${pluginName}.module`;

  // 移除 import 语句
  const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${moduleName}\\b[^}]*\\}\\s*from\\s*['"][^'"]*${pluginName}[^'"]*['"];?\\s*\\n?`, 'g');
  if (importRegex.test(content)) {
    content = content.replace(importRegex, '');
    modified = true;
  }

  // 移除注册行
  const registerRegex = new RegExp(`\\s*${moduleName}\\.forRoot\\(\\),?\\s*\\n?`, 'g');
  if (registerRegex.test(content)) {
    content = content.replace(registerRegex, '\n');
    modified = true;
  }

  // 移除相关的注释行
  content = content.replace(/\s*\/\/\s*已安装插件\s*\n/g, '\n');

  if (modified) {
    fs.writeFileSync(appModulePath, content, 'utf-8');
    console.log(`✓ 已从 app.module.ts 移除 ${moduleName} 的引用`);
  }
}

console.log(`\n移除完成！请检查以下文件中是否还有对 "${pluginName}" 的引用:`);
console.log(`  - src/modules/user/user.service.ts`);
console.log(`  - src/modules/auth/auth.service.ts`);
console.log(`  - src/admin/admin.module.ts`);
console.log(`\n如这些文件使用了 @Inject(SECURITY_SERVICE) + @Optional()，无需修改。`);
console.log(`请重启应用以使更改生效。`);
