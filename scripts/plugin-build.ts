/**
 * 插件打包脚本
 *
 * 用法: npm run plugin:build <plugin-name>
 *
 * 功能: 将 src/modules/<name>/ 打包为可分发的 zip 文件
 * 输出: dist/plugins/<name>-<version>.zip
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const pluginName = process.argv[2];

if (!pluginName) {
  console.error('用法: npm run plugin:build <plugin-name>');
  process.exit(1);
}

const pluginDir = path.join(process.cwd(), 'src', 'modules', pluginName);

if (!fs.existsSync(pluginDir)) {
  console.error(`错误: 插件目录不存在 - ${pluginDir}`);
  process.exit(1);
}

// 读取 plugin.json
const manifestPath = path.join(pluginDir, 'plugin.json');
if (!fs.existsSync(manifestPath)) {
  console.error('错误: 插件目录中未找到 plugin.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const version = manifest.version || '0.0.0';

// 确保输出目录存在
const outputDir = path.join(process.cwd(), 'dist', 'plugins');
fs.mkdirSync(outputDir, { recursive: true });

const outputFile = path.join(outputDir, `${pluginName}-${version}.zip`);

// 读取 .pluginignore（如果存在）
const ignoreFile = path.join(pluginDir, '.pluginignore');
let ignorePatterns: string[] = ['node_modules', '.git', '*.test.ts', '*.spec.ts', '__tests__'];

if (fs.existsSync(ignoreFile)) {
  const lines = fs.readFileSync(ignoreFile, 'utf-8').split('\n');
  ignorePatterns = lines
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

// 使用系统 zip 命令打包
// 排除 ignorePatterns 中的文件
const excludeArgs = ignorePatterns
  .flatMap((pattern) => {
    if (process.platform === 'win32') {
      return []; // PowerShell 不支持简单的排除
    }
    return ['-x', `*/${pattern}`, `-x`, pattern];
  })
  .join(' ');

try {
  if (process.platform === 'win32') {
    // Windows: 使用 PowerShell 打包
    // 先创建临时目录来组织文件
    const tempDir = path.join(process.cwd(), '.plugin-build-temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // 复制文件（排除忽略项）
    copyDirFiltered(pluginDir, path.join(tempDir, pluginName), ignorePatterns);

    // 使用 PowerShell 压缩
    const sourcePath = path.join(tempDir, pluginName);
    execSync(
      `powershell -Command "Compress-Archive -Path '${sourcePath}' -DestinationPath '${outputFile}' -Force"`,
      { stdio: 'pipe' },
    );

    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true });
  } else {
    // Unix: 使用 zip 命令
    const cwd = path.dirname(pluginDir);
    const dirName = path.basename(pluginDir);
    execSync(`cd "${cwd}" && zip -r "${outputFile}" "${dirName}" ${excludeArgs}`, {
      stdio: 'pipe',
    });
  }

  console.log(`✓ 插件已打包: ${outputFile}`);
  console.log(`  名称: ${manifest.name}`);
  console.log(`  版本: ${version}`);
  console.log(`  描述: ${manifest.description}`);

  // 输出文件大小
  const stats = fs.statSync(outputFile);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`  大小: ${sizeKB} KB`);
} catch (err) {
  console.error(`打包失败: ${(err as Error).message}`);
  process.exit(1);
}

/**
 * 递归复制目录，排除匹配 ignorePatterns 的文件
 */
function copyDirFiltered(src: string, dest: string, patterns: string[]): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // 检查是否匹配忽略模式
    if (shouldIgnore(entry.name, patterns)) continue;

    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, patterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 检查文件名是否匹配任一忽略模式
 */
function shouldIgnore(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      // 简单的通配符匹配
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (regex.test(name)) return true;
    } else {
      if (name === pattern) return true;
    }
  }
  return false;
}
