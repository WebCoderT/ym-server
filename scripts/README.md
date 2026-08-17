# Scripts 目录说明

本目录包含项目相关的辅助脚本。

## 📋 脚本列表

### Windows 部署脚本（从 Windows 连接远程 Ubuntu 服务器）

#### deploy.ps1 - PowerShell 部署脚本 ⭐ **推荐**
- Windows 原生支持，功能最完整
- 使用方法: `.\deploy.ps1 -Action <动作>`
- 详细文档: [WINDOWS-DEPLOY.md](./WINDOWS-DEPLOY.md)

#### deploy.bat - Batch 部署脚本
- 兼容性最好，支持所有 Windows 版本
- 使用方法: `deploy.bat <动作>`
- 详细文档: [WINDOWS-DEPLOY.md](./WINDOWS-DEPLOY.md)

#### deploy.sh - Shell 部署脚本（Git Bash）
- 跨平台（Windows Git Bash / Linux / macOS）
- 使用方法: `./deploy.sh <动作>`
- 详细文档: [WINDOWS-DEPLOY.md](./WINDOWS-DEPLOY.md)

**支持的部署动作**:
- `package` - 打包部署包
- `upload` - 上传到服务器
- `deploy` - 完整部署（打包 + 提示上传）
- `update` - 一键更新服务器（打包 + 上传 + 自动更新）
- `status` - 查看服务状态
- `logs` - 查看日志
- `restart` - 重启服务
- `backup` - 创建备份
- `rollback` - 回滚

---

## 服务器端脚本

### package.sh - 本地打包脚本

**用途**: 在本地开发环境中打包部署文件

**使用方法**:
```bash
# 赋予执行权限（首次）
chmod +x scripts/package.sh

# 运行打包
./scripts/package.sh

# 或使用 Makefile
make package
```

**功能**:
- 检查项目文件完整性
- 清理旧的构建文件
- 构建项目
- 创建部署包（包含 dist, node_modules, package.json, prisma, .env）
- 输出部署指引

**输出**: `server-dist-YYYYMMDD_HHMMSS.tar.gz`

---

### manage.sh - 服务器管理脚本

**用途**: 在服务器上管理已部署的应用

**使用方法**:
```bash
# 上传到服务器
scp scripts/manage.sh user@server:/opt/server/

# 在服务器上赋予执行权限
chmod +x /opt/server/manage.sh

# 查看帮助
./manage.sh help
```

**可用命令**:
- `start` - 启动服务
- `stop` - 停止服务
- `restart` - 重启服务
- `status` - 查看服务状态
- `logs [行数]` - 查看日志
- `backup` - 创建备份
- `rollback` - 回滚到上一版本
- `versions` - 查看可回滚版本
- `health` - 健康检查

**示例**:
```bash
./manage.sh restart
./manage.sh logs 200
./manage.sh backup
./manage.sh rollback
```

---

### enum-registry.ts

**用途**: 枚举注册表脚本（项目特定）

---

### export-openapi.ts

**用途**: 导出 OpenAPI 文档脚本（项目特定）

---

### enrich-openapi.ts

**用途**: 丰富 OpenAPI 文档脚本（项目特定）

---

## Makefile 集成

所有脚本都可以通过 Makefile 调用：

```bash
# 打包
make package

# 部署（需要先打包）
make deploy PACKAGE=server-dist-xxx.tar.gz

# 服务器管理
make server-status
make server-logs
make server-restart
make server-backup
make server-rollback
```

查看完整命令列表：
```bash
make help
```

---

## 注意事项

1. **package.sh** 在本地开发环境运行
2. **manage.sh** 在服务器环境运行
3. 运行脚本前确保有执行权限：`chmod +x <script>`
4. 部署前确保服务器环境已正确配置（参考 DEPLOYMENT.md）
