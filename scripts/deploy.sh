#!/bin/bash

# =============================================================================
# 跨平台部署脚本 (兼容 Windows Git Bash / Linux / macOS)
# =============================================================================
# 使用方法:
#   ./deploy.sh <动作> [参数]
#
# 动作:
#   package     - 打包部署包
#   upload      - 上传到服务器 (需要指定包名)
#   deploy      - 完整部署（打包 + 提示上传）
#   update      - 更新服务器（打包 + 上传 + 自动更新）
#   status      - 查看服务状态
#   logs        - 查看日志
#   restart     - 重启服务
#   backup      - 创建备份
#   rollback    - 回滚
#   health      - 健康检查
#
# 示例:
#   ./deploy.sh package
#   ./deploy.sh deploy
#   ./deploy.sh update
#   ./deploy.sh upload server-dist-xxx.tar.gz
# =============================================================================

set -e

# 配置变量
SERVER_USER=${SERVER_USER:-"deploy"}
SERVER_HOST=${SERVER_HOST:-"your-server.com"}
SERVER_DIR=${SERVER_DIR:-"/opt/server"}

# 检测操作系统
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="windows"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
else
    PLATFORM="linux"
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查必要工具
check_requirements() {
    log_info "检查必要工具..."

    if ! command -v node &> /dev/null; then
        log_error "未找到 Node.js"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        log_error "未找到 pnpm"
        exit 1
    fi

    if ! command -v ssh &> /dev/null; then
        log_error "未找到 SSH 客户端"
        exit 1
    fi

    if ! command -v scp &> /dev/null; then
        log_error "未找到 SCP 客户端"
        exit 1
    fi

    log_success "工具检查完成"
}

# 打包
do_package() {
    log_info "开始打包..."

    # 清理 dist 目录
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已清理 dist 目录"
    fi

    # 构建项目
    log_info "构建项目..."
    pnpm build

    # 创建部署包
    VERSION=$(date +%Y%m%d_%H%M%S)
    PACKAGE_NAME="server-dist-$VERSION.tar.gz"

    log_info "创建部署包: $PACKAGE_NAME"

    tar -czf "$PACKAGE_NAME" \
        dist/ \
        node_modules/ \
        package.json \
        prisma/ \
        .env

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
        echo ""
        echo "=========================================="
        log_success "打包成功!"
        echo "=========================================="
        echo "文件名: $PACKAGE_NAME"
        echo "大小: $SIZE"
        echo ""
        echo "下一步操作:"
        echo "  ./deploy.sh upload $PACKAGE_NAME"
        echo "或"
        echo "  ./deploy.sh deploy"
        echo "=========================================="

        echo "$PACKAGE_NAME"
    else
        log_error "打包失败"
        exit 1
    fi
}

# 上传
do_upload() {
    PACKAGE=$1

    if [ -z "$PACKAGE" ]; then
        log_error "请指定部署包"
        echo "用法: ./deploy.sh upload <包名>"
        exit 1
    fi

    if [ ! -f "$PACKAGE" ]; then
        log_error "文件不存在: $PACKAGE"
        exit 1
    fi

    log_info "上传部署包到服务器..."
    echo "服务器: $SERVER_USER@$SERVER_HOST"
    echo "文件: $PACKAGE"
    echo ""

    scp "$PACKAGE" "$SERVER_USER@$SERVER_HOST:/tmp/"

    if [ $? -eq 0 ]; then
        log_success "上传完成!"
        echo ""
        echo "请在服务器上执行:"
        echo "  ssh $SERVER_USER@$SERVER_HOST"
        echo "  cd $SERVER_DIR"
        echo "  ./manage.sh backup"
        echo "  sudo tar -xzf /tmp/$PACKAGE"
        echo "  npx prisma migrate deploy"
        echo "  ./manage.sh restart"
    else
        log_error "上传失败"
        exit 1
    fi
}

# 完整部署
do_deploy() {
    log_info "开始完整部署流程..."
    echo ""

    PACKAGE=$(do_package | tail -n 1)

    echo ""
    read -p "是否立即上传到服务器? (y/N) " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        do_upload "$PACKAGE"
    else
        log_info "稍后可以运行:"
        echo "  ./deploy.sh upload $PACKAGE"
    fi
}

# 更新服务器
do_update() {
    log_info "开始更新服务器..."
    echo ""

    PACKAGE=$(do_package | tail -n 1)

    echo ""
    read -p "是否立即更新服务器? (y/N) " confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "取消更新"
        exit 0
    fi

    log_info "上传部署包..."
    scp "$PACKAGE" "$SERVER_USER@$SERVER_HOST:/tmp/"

    if [ $? -ne 0 ]; then
        log_error "上传失败"
        exit 1
    fi

    log_success "上传完成，开始在服务器上更新..."
    echo ""

    # 通过 SSH 执行服务器命令
    ssh "$SERVER_USER@$SERVER_HOST" << EOF
cd $SERVER_DIR
./manage.sh backup
sudo tar -xzf /tmp/$PACKAGE
npx prisma migrate deploy
./manage.sh restart
rm /tmp/$PACKAGE
echo "更新完成"
EOF

    if [ $? -eq 0 ]; then
        log_success "服务器更新完成!"
    else
        log_error "服务器更新失败"
        exit 1
    fi
}

# 服务器命令
run_server_command() {
    COMMAND=$1
    log_info "执行服务器命令: $COMMAND"
    ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_DIR && $COMMAND"
}

# 显示帮助
show_help() {
    cat << EOF
跨平台部署脚本 (兼容 Windows Git Bash / Linux / macOS)

用法:
  ./deploy.sh <动作> [参数]

动作:
  package     - 打包部署包
  upload      - 上传到服务器 (需要指定包名)
  deploy      - 完整部署（打包 + 提示上传）
  update      - 更新服务器（打包 + 上传 + 自动更新）
  status      - 查看服务状态
  logs        - 查看日志
  restart     - 重启服务
  backup      - 创建备份
  rollback    - 回滚到上一版本
  health      - 健康检查

环境变量:
  SERVER_USER - 服务器用户名 (默认: deploy)
  SERVER_HOST - 服务器地址 (默认: your-server.com)
  SERVER_DIR  - 服务器部署目录 (默认: /opt/server)

示例:
  ./deploy.sh package
  ./deploy.sh deploy
  ./deploy.sh update
  ./deploy.sh upload server-dist-xxx.tar.gz
  SERVER_HOST=192.168.1.100 ./deploy.sh status

EOF
}

# 主逻辑
ACTION=$1
shift

case "$ACTION" in
    package)
        check_requirements
        do_package
        ;;
    upload)
        do_upload "$1"
        ;;
    deploy)
        check_requirements
        do_deploy
        ;;
    update)
        check_requirements
        do_update
        ;;
    status)
        run_server_command "pm2 status"
        ;;
    logs)
        run_server_command "pm2 logs server --lines 100 --nostream"
        ;;
    restart)
        run_server_command "./manage.sh restart"
        ;;
    backup)
        run_server_command "./manage.sh backup"
        ;;
    rollback)
        run_server_command "./manage.sh rollback"
        ;;
    health)
        run_server_command "./manage.sh health"
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        log_error "未知命令: $ACTION"
        echo ""
        show_help
        exit 1
        ;;
esac
