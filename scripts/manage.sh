#!/bin/bash

# =============================================================================
# 服务器部署管理脚本
# =============================================================================
# 用法:
#   ./manage.sh [命令]
#
# 命令:
#   start       - 启动服务
#   stop        - 停止服务
#   restart     - 重启服务
#   status      - 查看服务状态
#   logs        - 查看日志
#   backup      - 创建备份
#   rollback    - 回滚到上一个版本
#   versions    - 查看可回滚版本
#   health      - 健康检查
#   help        - 显示帮助信息
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
APP_DIR="/opt/server"
BACKUP_DIR="/opt/backups"
APP_NAME="server"
MAX_BACKUPS=10

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

# 检查是否在正确的目录
check_dir() {
    if [ ! -f "$APP_DIR/package.json" ]; then
        log_error "未找到应用目录: $APP_DIR"
        exit 1
    fi
}

# 启动服务
start_service() {
    log_info "启动服务..."
    cd "$APP_DIR"

    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 start "$APP_NAME"
    else
        pm2 start dist/main.js --name "$APP_NAME" -i max
    fi

    pm2 save
    log_success "服务已启动"
}

# 停止服务
stop_service() {
    log_info "停止服务..."
    pm2 stop "$APP_NAME"
    log_success "服务已停止"
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    pm2 restart "$APP_NAME"
    log_success "服务已重启"
}

# 查看服务状态
show_status() {
    pm2 status
    echo ""
    pm2 logs "$APP_NAME" --lines 20 --nostream
}

# 查看日志
show_logs() {
    local lines=${1:-100}
    pm2 logs "$APP_NAME" --lines "$lines"
}

# 创建备份
create_backup() {
    log_info "创建备份..."

    mkdir -p "$BACKUP_DIR"
    local backup_name="backup-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"

    # 备份当前版本
    sudo cp -r "$APP_DIR" "$backup_path"

    # 记录备份信息
    echo "$backup_name" >> "$BACKUP_DIR/history.txt"

    # 清理旧备份
    cleanup_backups

    log_success "备份完成: $backup_name"
}

# 清理旧备份
cleanup_backups() {
    if [ -f "$BACKUP_DIR/history.txt" ]; then
        local backup_count=$(wc -l < "$BACKUP_DIR/history.txt")
        if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
            local oldest=$(head -n 1 "$BACKUP_DIR/history.txt")
            log_info "清理旧备份: $oldest"
            sudo rm -rf "$BACKUP_DIR/$oldest"
            sed -i '1d' "$BACKUP_DIR/history.txt"
        fi
    fi
}

# 回滚
rollback() {
    log_info "准备回滚..."

    if [ ! -f "$BACKUP_DIR/history.txt" ]; then
        log_error "没有可回滚的版本"
        exit 1
    fi

    local current=$(tail -n 1 "$BACKUP_DIR/history.txt")
    local previous=$(tail -n 2 "$BACKUP_DIR/history.txt" | head -n 1)

    if [ "$current" = "$previous" ]; then
        log_error "没有可回滚的版本"
        exit 1
    fi

    log_warn "当前版本: $current"
    log_warn "回滚到: $previous"

    # 停止服务
    pm2 stop "$APP_NAME"

    # 恢复备份
    sudo rm -rf "$APP_DIR"
    sudo cp -r "$BACKUP_DIR/$previous" "$APP_DIR"

    # 重启服务
    pm2 restart "$APP_NAME"

    # 更新历史记录
    sed -i '$ d' "$BACKUP_DIR/history.txt"

    log_success "回滚完成"
}

# 查看可回滚版本
show_versions() {
    if [ ! -f "$BACKUP_DIR/history.txt" ]; then
        log_info "没有备份版本"
        exit 0
    fi

    echo "可回滚版本："
    echo "===================="
    tac "$BACKUP_DIR/history.txt" | nl
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 检查 PM2 进程
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        log_error "服务未运行"
        exit 1
    fi

    # 检查进程状态
    local status=$(pm2 jlist | jq -r ".[] | select(.name == \"$APP_NAME\") | .pm2_env.status")
    if [ "$status" != "online" ]; then
        log_error "服务状态异常: $status"
        exit 1
    fi

    # HTTP 健康检查
    if [ -f "$APP_DIR/.env" ]; then
        local port=$(grep "^PORT=" "$APP_DIR/.env" | cut -d'=' -f2)
        if [ -n "$port" ]; then
            if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
                log_success "健康检查通过"
            else
                log_warn "HTTP 健康检查失败，但服务正在运行"
            fi
        fi
    fi

    pm2 status
}

# 显示帮助
show_help() {
    cat << EOF
服务器部署管理脚本

用法:
  ./manage.sh [命令]

命令:
  start       - 启动服务
  stop        - 停止服务
  restart     - 重启服务
  status      - 查看服务状态
  logs        - 查看日志
  backup      - 创建备份
  rollback    - 回滚到上一个版本
  versions    - 查看可回滚版本
  health      - 健康检查
  help        - 显示帮助信息

示例:
  ./manage.sh start       # 启动服务
  ./manage.sh restart     # 重启服务
  ./manage.sh backup      # 创建备份
  ./manage.sh rollback    # 回滚

EOF
}

# 主逻辑
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    backup)
        create_backup
        ;;
    rollback)
        rollback
        ;;
    versions)
        show_versions
        ;;
    health)
        health_check
        ;;
    help)
        show_help
        ;;
    *)
        show_help
        ;;
esac
