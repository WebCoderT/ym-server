/**
 * 插件安装脚本
 *
 * 用法: npm run plugin:install <path-to-plugin.zip>
 *
 * 功能:
 * 1. 解压 zip 到临时目录
 * 2. 读取并校验 plugin.json
 * 3. 复制到 src/modules/<name>/
 * 4. 在 app.module.ts 追加 import 行
 * 5. 校验模板 API 兼容性
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const zipPath = process.argv[2];

if (!zipPath) {
  console.error('用法: npm run plugin:install <path-to-plugin.zip>');
  process.exit(1);
}

if (!fs.existsSync(zipPath)) {
  console.error(`错误: 文件不存在 - ${zipPath}`);
  process.exit(1);
}

// 解压 zip 到临时目录
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-install-'));

try {
  // 使用系统 unzip 或 PowerShell 解压
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, {
      stdio: 'pipe',
    });
  } else {
    execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, { stdio: 'pipe' });
  }

  // 查找 plugin.json（可能在根目录或一级子目录中）
  let manifestPath = path.join(tempDir, 'plugin.json');
  let pluginSourceDir = tempDir;

  if (!fs.existsSync(manifestPath)) {
    // 查找子目录中的 plugin.json
    const subdirs = fs.readdirSync(tempDir, { withFileTypes: true });
    for (const dir of subdirs) {
      if (dir.isDirectory()) {
        const candidate = path.join(tempDir, dir.name, 'plugin.json');
        if (fs.existsSync(candidate)) {
          manifestPath = candidate;
          pluginSourceDir = path.join(tempDir, dir.name);
          break;
        }
      }
    }
  }

  if (!fs.existsSync(manifestPath)) {
    console.error('错误: 无效的插件包 - 未找到 plugin.json');
    process.exit(1);
  }

  // 解析清单
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  if (!manifest.name || !manifest.mainModule) {
    console.error('错误: plugin.json 缺少 name 或 mainModule 字段');
    process.exit(1);
  }

  const targetDir = path.join(process.cwd(), 'src', 'modules', manifest.name);

  // 检查是否已存在
  if (fs.existsSync(targetDir)) {
    console.error(`错误: 插件 "${manifest.name}" 已存在于 ${targetDir}`);
    console.error('如需重新安装，请先运行: npm run plugin:remove ' + manifest.name);
    process.exit(1);
  }

  // 复制插件文件到目标目录
  fs.cpSync(pluginSourceDir, targetDir, { recursive: true });

  console.log(`✓ 插件 "${manifest.name}" 已安装到 src/modules/${manifest.name}/`);
  console.log(`  版本: ${manifest.version}`);
  console.log(`  描述: ${manifest.description}`);

  // 在 app.module.ts 追加 import
  const appModulePath = path.join(process.cwd(), 'src', 'app.module.ts');
  if (fs.existsSync(appModulePath)) {
    let content = fs.readFileSync(appModulePath, 'utf-8');
    const moduleFile = manifest.mainModuleFile ?? `${manifest.name}.module`;

    // 构造 import 语句
    const importLine = `import { ${manifest.mainModule} } from './modules/${manifest.name}/${moduleFile}';`;
    const registerLine = `${manifest.mainModule}.forRoot(),`;

    // 检查是否已存在导入
    if (!content.includes(importLine)) {
      // 在最后一个 import 语句后追加
      const lastImportIndex = content.lastIndexOf('import ');
      const lineEnd = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, lineEnd + 1) + importLine + '\n' + content.slice(lineEnd + 1);

      // 在 PluginModule.forRoot() 后追加注册行
      const pluginModuleIndex = content.indexOf('PluginModule.forRoot()');
      if (pluginModuleIndex !== -1) {
        const nextLineEnd = content.indexOf('\n', pluginModuleIndex);
        const insertPoint = nextLineEnd + 1;
        const indent = '    ';
        content = content.slice(0, insertPoint) + `${indent}// 已安装插件\n${indent}${registerLine}\n` + content.slice(insertPoint);
      }

      fs.writeFileSync(appModulePath, content, 'utf-8');
      console.log(`✓ 已更新 app.module.ts`);
    }
  }

  // 校验模板 API 兼容性
  if (manifest.templateApis && manifest.templateApis.length > 0) {
    console.log(`  模板 API 依赖:`);
    for (const api of manifest.templateApis) {
      const fullPath = path.resolve(targetDir, api);
      const exists = fs.existsSync(fullPath) || fs.existsSync(fullPath + '.ts') || fs.existsSync(fullPath + '.js');
      console.log(`    ${exists ? '✓' : '✗'} ${api}`);
      if (!exists) {
        console.warn(`  警告: 模板 API "${api}" 不存在，插件可能无法正常工作`);
      }
    }
  }

  console.log(`\n安装完成！请重启应用以激活插件。`);
} finally {
  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
}
