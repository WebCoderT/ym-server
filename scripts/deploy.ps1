# =============================================================================
# Windows 部署脚本 (PowerShell)
# =============================================================================
# 使用方法:
#   .\deploy.ps1 -Action <动作> [参数]
#
# 动作:
#   package     - 打包部署包
#   upload      - 上传到服务器
#   deploy      - 完整部署（打包 + 上传）
#   update      - 更新服务器
#   status      - 查看服务状态
#   logs        - 查看日志
#   restart     - 重启服务
#   backup      - 创建备份
#   rollback    - 回滚
#
# 示例:
#   .\deploy.ps1 -Action package
#   .\deploy.ps1 -Action deploy
#   .\deploy.ps1 -Action upload -Package "server-dist-xxx.tar.gz"
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('package', 'upload', 'deploy', 'update', 'status', 'logs', 'restart', 'backup', 'rollback', 'health')]
    [string]$Action,

    [string]$Package,
    [string]$ServerUser = "deploy",
    [string]$ServerHost = "your-server.com",
    [string]$ServerDir = "/opt/server"
)

# 颜色函数
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# 检查必要工具
function Test-Requirements {
    Write-Info "检查必要工具..."

    # 检查 Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 Node.js，请先安装"
        exit 1
    }

    # 检查 pnpm
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 pnpm，请先安装: npm install -g pnpm"
        exit 1
    }

    # 检查 SSH
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 SSH 客户端"
        exit 1
    }

    # 检查 SCP
    if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 SCP 客户端"
        exit 1
    }

    Write-Success "工具检查完成"
}

# 打包
function Invoke-Package {
    Write-Info "开始打包..."

    # 清理
    if (Test-Path dist) {
        Remove-Item -Recurse -Force dist
        Write-Info "已清理 dist 目录"
    }

    # 构建
    Write-Info "构建项目..."
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "构建失败"
        exit 1
    }
    Write-Success "构建完成"

    # 创建部署包
    $version = Get-Date -Format "yyyyMMdd_HHmmss"
    $packageName = "server-dist-$version.tar.gz"

    Write-Info "创建部署包: $packageName"

    # 使用 tar 命令（Windows 10+ 自带）
    tar -czf $packageName dist node_modules package.json prisma .env

    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item $packageName).Length / 1MB
        Write-Success "打包成功!"
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "部署包信息:" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "文件名: $packageName"
        Write-Host "大小: $([math]::Round($size, 2)) MB"
        Write-Host ""
        Write-Host "下一步操作:" -ForegroundColor Yellow
        Write-Host "  .\deploy.ps1 -Action upload -Package $packageName"
        Write-Host "或"
        Write-Host "  .\deploy.ps1 -Action deploy"
        Write-Host "==========================================" -ForegroundColor Green

        return $packageName
    } else {
        Write-Error "打包失败"
        exit 1
    }
}

# 上传
function Invoke-Upload {
    param([string]$PackageName)

    if (-not $PackageName) {
        Write-Error "请指定部署包: -Package <文件名>"
        exit 1
    }

    if (-not (Test-Path $PackageName)) {
        Write-Error "部署包不存在: $PackageName"
        exit 1
    }

    Write-Info "上传部署包到服务器..."
    Write-Host "服务器: $ServerUser@$ServerHost"
    Write-Host "文件: $PackageName"
    Write-Host ""

    scp $PackageName "$ServerUser@$ServerHost`:/tmp/"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "上传完成!"
        Write-Host ""
        Write-Host "请在服务器上执行:" -ForegroundColor Yellow
        Write-Host "  ssh $ServerUser@$ServerHost"
        Write-Host "  cd $ServerDir"
        Write-Host "  ./manage.sh backup"
        Write-Host "  sudo tar -xzf /tmp/$PackageName"
        Write-Host "  npx prisma migrate deploy"
        Write-Host "  ./manage.sh restart"
    } else {
        Write-Error "上传失败"
        exit 1
    }
}

# 完整部署
function Invoke-Deploy {
    Write-Info "开始完整部署流程..."
    Write-Host ""

    $packageName = Invoke-Package

    Write-Host ""
    $confirm = Read-Host "是否立即上传到服务器? (y/N)"

    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Invoke-Upload -PackageName $packageName
    } else {
        Write-Info "稍后可以运行:"
        Write-Host "  .\deploy.ps1 -Action upload -Package $packageName"
    }
}

# 更新服务器
function Invoke-Update {
    Write-Info "更新服务器部署..."

    $packageName = Invoke-Package

    Write-Host ""
    $confirm = Read-Host "是否立即更新服务器? (y/N)"

    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Write-Info "上传部署包..."
        scp $packageName "$ServerUser@$ServerHost`:/tmp/"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "上传完成，开始在服务器上更新..."

            # 通过 SSH 执行服务器命令
            ssh $ServerUser@$ServerHost @"
cd $ServerDir
./manage.sh backup
sudo tar -xzf /tmp/$packageName
npx prisma migrate deploy
./manage.sh restart
rm /tmp/$packageName
echo "更新完成"
"@

            if ($LASTEXITCODE -eq 0) {
                Write-Success "服务器更新完成!"
            } else {
                Write-Error "服务器更新失败"
            }
        } else {
            Write-Error "上传失败"
        }
    }
}

# 服务器命令
function Invoke-ServerCommand {
    param([string]$Command)

    Write-Info "执行服务器命令: $Command"
    ssh $ServerUser@$ServerHost "cd $ServerDir && $Command"
}

# 主逻辑
switch ($Action) {
    'package' {
        Test-Requirements
        Invoke-Package
    }
    'upload' {
        Invoke-Upload -Package $Package
    }
    'deploy' {
        Test-Requirements
        Invoke-Deploy
    }
    'update' {
        Test-Requirements
        Invoke-Update
    }
    'status' {
        Invoke-ServerCommand "pm2 status"
    }
    'logs' {
        Invoke-ServerCommand "pm2 logs server --lines 100 --nostream"
    }
    'restart' {
        Invoke-ServerCommand "./manage.sh restart"
    }
    'backup' {
        Invoke-ServerCommand "./manage.sh backup"
    }
    'rollback' {
        Invoke-ServerCommand "./manage.sh rollback"
    }
    'health' {
        Invoke-ServerCommand "./manage.sh health"
    }
}
