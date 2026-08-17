#!/bin/bash

# =============================================================================
# 本地打包脚本
# =============================================================================
# 用法:
#   ./package.sh
#
# 功能:
#   - 清理旧的构建文件
#   - 构建项目
#   - 创建部署包（包含 dist, node_modules, package.json, prisma, .env）
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="server-dist-$VERSION.tar.gz"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查必要文件
check_files() {
    log_info "检查项目文件..."

    cd "$SERVER_DIR"

    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json"
        exit 1
    fi

    if [ ! -d "node_modules" ]; then
        log_warn "未找到 node_modules，开始安装依赖..."
        pnpm install
    fi

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_warn ".env 文件不存在，从 .env.example 复制..."
            cp .env.example .env
            log_warn "请编辑 .env 文件配置环境变量"
        else
            log_error "未找到 .env 或 .env.example 文件"
            exit 1
        fi
    fi

    if [ ! -d "prisma" ]; then
        log_error "未找到 prisma 目录"
        exit 1
    fi

    log_success "文件检查完成"
}

# 清理旧文件
clean() {
    log_info "清理旧的构建文件..."

    cd "$SERVER_DIR"

    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已清理 dist 目录"
    fi
}

# 构建项目
build() {
    log_info "构建项目..."

    cd "$SERVER_DIR"

    pnpm build

    if [ $? -ne 0 ]; then
        log_error "构建失败！"
        exit 1
    fi

    log_success "构建完成"
}

# 创建部署包
package() {
    log_info "创建部署包: $PACKAGE_NAME"

    cd "$SERVER_DIR"

    tar -czf "$PACKAGE_NAME" \
        dist/ \
        node_modules/ \
        package.json \
        prisma/ \
        .env

    if [ $? -eq 0 ]; then
        log_success "打包成功！"
        echo ""
        echo "=========================================="
        echo "部署包信息："
        echo "=========================================="
        echo "文件名: $PACKAGE_NAME"
        echo "位置: $SERVER_DIR/$PACKAGE_NAME"
        echo "大小: $(du -h "$PACKAGE_NAME" | cut -f1)"
        echo ""
        echo "下一步操作："
        echo "1. 上传到服务器："
        echo "   scp $PACKAGE_NAME user@your-server:/tmp/"
        echo ""
        echo "2. 登录服务器并解压："
        echo "   ssh user@your-server"
        echo "   cd /opt/server"
        echo "   sudo tar -xzf /tmp/$PACKAGE_NAME"
        echo ""
        echo "3. 运行数据库迁移（如有）："
        echo "   npx prisma migrate deploy"
        echo ""
        echo "4. 重启服务："
        echo "   pm2 restart server"
        echo "=========================================="
    else
        log_error "打包失败！"
        exit 1
    fi
}

# 主流程
main() {
    log_info "========== 开始打包 =========="
    log_info "版本: $VERSION"
    echo ""

    check_files
    clean
    build
    package

    log_success "========== 打包完成 =========="
}

# 执行主流程
main
