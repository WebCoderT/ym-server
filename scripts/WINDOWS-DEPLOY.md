# Windows 部署脚本说明

本目录包含多个部署脚本，支持从 Windows 宿主机连接远程 Ubuntu 服务器进行部署。

## 📋 脚本列表

### 1. deploy.ps1 (PowerShell 脚本) - **推荐**

**特点**:
- Windows 原生支持
- 功能最完整
- 彩色输出
- 错误处理完善

**使用方法**:
```powershell
# 打开 PowerShell，进入 server 目录
cd server\scripts

# 首次运行需要设置执行策略（管理员权限）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 查看帮助
.\deploy.ps1 -Action help

# 打包
.\deploy.ps1 -Action package

# 完整部署（打包 + 提示上传）
.\deploy.ps1 -Action deploy

# 一键更新服务器（打包 + 上传 + 自动更新）
.\deploy.ps1 -Action update

# 上传指定包
.\deploy.ps1 -Action upload -Package "server-dist-xxx.tar.gz"

# 服务器管理
.\deploy.ps1 -Action status
.\deploy.ps1 -Action logs
.\deploy.ps1 -Action restart
.\deploy.ps1 -Action backup
.\deploy.ps1 -Action rollback
```

**自定义服务器配置**:
```powershell
.\deploy.ps1 -Action status -ServerUser "deploy" -ServerHost "192.168.1.100" -ServerDir "/opt/server"
```

---

### 2. deploy.bat (Batch 脚本)

**特点**:
- 兼容性最好
- 支持所有 Windows 版本
- 无需额外配置

**使用方法**:
```cmd
REM 打开命令提示符，进入 server 目录
cd server\scripts

REM 打包
deploy.bat package

REM 完整部署
deploy.bat deploy

REM 一键更新
deploy.bat update

REM 上传指定包
deploy.bat upload server-dist-xxx.tar.gz

REM 服务器管理
deploy.bat status
deploy.bat logs
deploy.bat restart
deploy.bat backup
deploy.bat rollback
```

**自定义服务器配置**:
编辑 `deploy.bat` 文件，修改以下行：
```batch
set SERVER_USER=deploy
set SERVER_HOST=your-server.com
set SERVER_DIR=/opt/server
```

---

### 3. deploy.sh (Shell 脚本 - Git Bash)

**特点**:
- 跨平台（Windows Git Bash / Linux / macOS）
- 适合已有 Git Bash 环境的用户
- 与 Linux 脚本语法一致

**前置要求**:
- 安装 [Git for Windows](https://git-scm.com/download/win)（包含 Git Bash）

**使用方法**:
```bash
# 打开 Git Bash，进入 server 目录
cd /d/workspace/server/scripts

# 赋予执行权限（首次）
chmod +x deploy.sh

# 打包
./deploy.sh package

# 完整部署
./deploy.sh deploy

# 一键更新
./deploy.sh update

# 上传指定包
./deploy.sh upload server-dist-xxx.tar.gz

# 服务器管理
./deploy.sh status
./deploy.sh logs
./deploy.sh restart
./deploy.sh backup
./deploy.sh rollback
```

**自定义服务器配置**:
```bash
# 通过环境变量设置
SERVER_USER=deploy SERVER_HOST=192.168.1.100 ./deploy.sh status

# 或导出环境变量
export SERVER_USER=deploy
export SERVER_HOST=192.168.1.100
export SERVER_DIR=/opt/server
./deploy.sh status
```

---

## 🔧 前置要求

### Windows 系统要求

1. **Windows 10/11** 或 **Windows Server 2016+**

2. **OpenSSH 客户端**（Windows 10+ 自带）
   ```powershell
   # 检查是否安装
   Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'
   
   # 如果未安装，以管理员身份运行
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```

3. **Node.js 18+**
   ```powershell
   node --version
   ```

4. **pnpm**
   ```powershell
   npm install -g pnpm
   pnpm --version
   ```

5. **tar 命令**（Windows 10+ 自带）
   ```powershell
   tar --version
   ```

### SSH 配置

1. **生成 SSH 密钥**（如果还没有）
   ```powershell
   ssh-keygen -t rsa -b 4096
   ```

2. **复制公钥到服务器**
   ```powershell
   # PowerShell / Git Bash
   type $env:USERPROFILE\.ssh\id_rsa.pub | ssh deploy@your-server.com "cat >> ~/.ssh/authorized_keys"
   
   # 或使用 ssh-copy-id（Git Bash）
   ssh-copy-id deploy@your-server.com
   ```

3. **测试 SSH 连接**
   ```powershell
   ssh deploy@your-server.com
   ```

### 服务器要求

确保服务器已按照 `DEPLOYMENT.md` 完成配置：
- Ubuntu 20.04+
- Node.js 18+
- PM2
- MySQL 8.0+
- `/opt/server` 目录已创建
- `manage.sh` 脚本已部署

---

## 🚀 快速开始

### 首次部署

```powershell
# 1. 打包
.\deploy.ps1 -Action package

# 2. 手动上传和部署（按照提示操作）
# 或使用一键更新
.\deploy.ps1 -Action update
```

### 日常更新

```powershell
# 一键更新（推荐）
.\deploy.ps1 -Action update

# 或分步操作
.\deploy.ps1 -Action package
.\deploy.ps1 -Action upload -Package "server-dist-xxx.tar.gz"
# 然后 SSH 到服务器手动部署
```

### 查看服务状态

```powershell
.\deploy.ps1 -Action status
.\deploy.ps1 -Action logs
.\deploy.ps1 -Action health
```

---

## 📊 脚本对比

| 特性 | deploy.ps1 | deploy.bat | deploy.sh |
|------|-----------|-----------|----------|
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Windows 原生** | ✅ | ✅ | ❌ (需 Git Bash) |
| **跨平台** | ❌ | ❌ | ✅ |
| **彩色输出** | ✅ | ✅ (Win10+) | ✅ |
| **功能完整** | ✅ | ✅ | ✅ |
| **配置难度** | 低 | 中 | 中 |
| **错误处理** | 完善 | 一般 | 完善 |

---

## 🔍 故障排查

### SSH 连接失败

```powershell
# 测试 SSH 连接
ssh -v deploy@your-server.com

# 检查 SSH 服务
Get-Service ssh-agent

# 启动 SSH agent
Start-Service ssh-agent
```

### 权限问题（PowerShell）

```powershell
# 设置执行策略（管理员权限）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或临时绕过
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Action package
```

### tar 命令不存在

Windows 10+ 自带 tar 命令。如果不存在：
1. 更新 Windows 到最新版本
2. 或使用 Git Bash 的 tar

### SCP/SSH 找不到

```powershell
# 检查 OpenSSH 客户端
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# 安装（管理员权限）
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

---

## 📝 高级用法

### 批量部署到多个服务器

创建 `deploy-multi.ps1`:
```powershell
$servers = @(
    @{ User="deploy"; Host="server1.com"; Dir="/opt/server" },
    @{ User="deploy"; Host="server2.com"; Dir="/opt/server" }
)

$package = .\deploy.ps1 -Action package | Select-String "server-dist" | ForEach-Object { $_.Line.Split(':')[-1].Trim() }

foreach ($server in $servers) {
    Write-Host "部署到 $($server.Host)..."
    .\deploy.ps1 -Action upload -Package $package -ServerUser $server.User -ServerHost $server.Host -ServerDir $server.Dir
}
```

### 自动化部署（CI/CD）

```powershell
# GitHub Actions 示例
- name: Deploy to server
  run: |
    .\scripts\deploy.ps1 -Action update -ServerUser ${{ secrets.SERVER_USER }} -ServerHost ${{ secrets.SERVER_HOST }}
```

---

## 📚 相关文档

- [DEPLOYMENT.md](../DEPLOYMENT.md) - 完整部署文档
- [README.md](./README.md) - 脚本目录说明
- [MANAGE.md](../MANAGE.md) - 服务器管理脚本说明

---

## 💡 提示

1. **推荐使用 PowerShell 脚本** - 功能最完整，Windows 原生支持
2. **配置 SSH 密钥** - 避免每次输入密码
3. **使用 `update` 命令** - 一键完成打包、上传、更新
4. **定期备份** - 使用 `backup` 命令创建备份
5. **查看日志** - 部署后使用 `logs` 命令检查

---

## 🆘 获取帮助

遇到问题？

1. 查看上方故障排查部分
2. 检查 `DEPLOYMENT.md` 文档
3. 查看脚本源码中的注释
