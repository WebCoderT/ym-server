# =============================================================================
# Server Makefile
# =============================================================================
# 使用方法:
#   make <命令>
#
# 常用命令:
#   make help          - 显示所有可用命令
#   make install       - 安装依赖
#   make dev           - 启动开发服务器
#   make build         - 构建项目
#   make package       - 打包部署包
#   make deploy        - 部署到服务器
#   make migrate       - 运行数据库迁移
#   make clean         - 清理构建文件
# =============================================================================

# 变量定义
SHELL := /bin/bash
.PHONY: help install dev build test lint format package deploy clean \
        migrate generate seed start stop restart status logs \
        setup-db reset-db backup-db

# 配置变量
NODE_ENV ?= development
PORT ?= 3000
SERVER_USER ?= deploy
SERVER_HOST ?= your-server.com
SERVER_DIR ?= /opt/server
PACKAGE_DIR := .

# 颜色定义
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# =============================================================================
# 帮助信息
# =============================================================================

help: ## 显示帮助信息
	@echo ""
	@echo "$(BLUE)Server Makefile - 可用命令:$(NC)"
	@echo ""
	@echo "$(GREEN)开发命令:$(NC)"
	@echo "  $(YELLOW)make install$(NC)        - 安装依赖"
	@echo "  $(YELLOW)make dev$(NC)            - 启动开发服务器"
	@echo "  $(YELLOW)make build$(NC)          - 构建项目"
	@echo "  $(YELLOW)make test$(NC)           - 运行测试"
	@echo "  $(YELLOW)make lint$(NC)           - 代码检查"
	@echo "  $(YELLOW)make format$(NC)         - 代码格式化"
	@echo "  $(YELLOW)make clean$(NC)          - 清理构建文件"
	@echo ""
	@echo "$(GREEN)数据库命令:$(NC)"
	@echo "  $(YELLOW)make generate$(NC)       - 生成 Prisma Client"
	@echo "  $(YELLOW)make migrate$(NC)        - 运行数据库迁移"
	@echo "  $(YELLOW)make migrate-dev$(NC)    - 开发环境迁移（重置）"
	@echo "  $(YELLOW)make seed$(NC)           - 填充测试数据"
	@echo "  $(YELLOW)make setup-db$(NC)       - 初始化数据库"
	@echo "  $(YELLOW)make reset-db$(NC)       - 重置数据库"
	@echo ""
	@echo "$(GREEN)部署命令 (Linux/macOS):$(NC)"
	@echo "  $(YELLOW)make package$(NC)        - 打包部署包"
	@echo "  $(YELLOW)make deploy$(NC)         - 部署到服务器"
	@echo "  $(YELLOW)make deploy-update$(NC)  - 更新部署"
	@echo ""
	@echo "$(GREEN)Windows 部署命令:$(NC)"
	@echo "  $(YELLOW).\\scripts\\deploy.ps1 -Action package$(NC)    - 打包 (PowerShell)"
	@echo "  $(YELLOW).\\scripts\\deploy.ps1 -Action update$(NC)     - 一键更新 (PowerShell)"
	@echo "  $(YELLOW)scripts\\deploy.bat package$(NC)               - 打包 (Batch)"
	@echo "  $(YELLOW)scripts\\deploy.bat update$(NC)                - 一键更新 (Batch)"
	@echo "  详细文档: scripts/WINDOWS-DEPLOY.md"
	@echo ""
	@echo "$(GREEN)服务器命令:$(NC)"
	@echo "  $(YELLOW)make server-status$(NC)  - 查看服务状态"
	@echo "  $(YELLOW)make server-logs$(NC)    - 查看服务日志"
	@echo "  $(YELLOW)make server-restart$(NC) - 重启服务"
	@echo "  $(YELLOW)make server-stop$(NC)    - 停止服务"
	@echo "  $(YELLOW)make server-start$(NC)   - 启动服务"
	@echo ""
	@echo "$(GREEN)其他命令:$(NC)"
	@echo "  $(YELLOW)make start$(NC)          - 启动生产服务器"
	@echo "  $(YELLOW)make help$(NC)           - 显示此帮助信息"
	@echo ""

# =============================================================================
# 开发命令
# =============================================================================

install: ## 安装依赖
	@echo "$(BLUE)安装依赖...$(NC)"
	pnpm install

dev: ## 启动开发服务器
	@echo "$(BLUE)启动开发服务器...$(NC)"
	pnpm dev

build: ## 构建项目
	@echo "$(BLUE)构建项目...$(NC)"
	pnpm build

start: build ## 构建并启动生产服务器
	@echo "$(BLUE)启动生产服务器...$(NC)"
	pnpm start

test: ## 运行测试
	@echo "$(BLUE)运行测试...$(NC)"
	pnpm test

lint: ## 代码检查
	@echo "$(BLUE)代码检查...$(NC)"
	pnpm lint

format: ## 代码格式化
	@echo "$(BLUE)代码格式化...$(NC)"
	pnpm format

clean: ## 清理构建文件
	@echo "$(BLUE)清理构建文件...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -f server-dist-*.tar.gz
	@echo "$(GREEN)清理完成$(NC)"

# =============================================================================
# 数据库命令
# =============================================================================

generate: ## 生成 Prisma Client
	@echo "$(BLUE)生成 Prisma Client...$(NC)"
	pnpm prisma generate

migrate: ## 运行数据库迁移
	@echo "$(BLUE)运行数据库迁移...$(NC)"
	pnpm prisma migrate deploy

migrate-dev: ## 开发环境迁移（会重置数据库）
	@echo "$(YELLOW)警告: 此命令会重置数据库!$(NC)"
	@read -p "确认继续? [y/N] " confirm && [ $$confirm = "y" ] || exit 1
	pnpm prisma migrate dev

seed: ## 填充测试数据
	@echo "$(BLUE)填充测试数据...$(NC)"
	pnpm prisma db seed

setup-db: generate migrate ## 初始化数据库（生成 Client + 迁移）
	@echo "$(GREEN)数据库初始化完成$(NC)"

reset-db: ## 重置数据库
	@echo "$(YELLOW)警告: 此命令会重置数据库并丢失所有数据!$(NC)"
	@read -p "确认继续? [y/N] " confirm && [ $$confirm = "y" ] || exit 1
	pnpm prisma migrate reset

# =============================================================================
# 打包和部署命令
# =============================================================================

package: clean install build ## 打包部署包
	@echo "$(BLUE)创建部署包...$(NC)"
	@VERSION=$$(date +%Y%m%d_%H%M%S); \
	PACKAGE_NAME="server-dist-$$VERSION.tar.gz"; \
	tar -czf $$PACKAGE_NAME \
		dist/ \
		node_modules/ \
		package.json \
		prisma/ \
		.env; \
	echo ""; \
	echo "$(GREEN)打包成功!$(NC)"; \
	echo "文件名: $$PACKAGE_NAME"; \
	echo "大小: $$(du -h $$PACKAGE_NAME | cut -f1)"; \
	echo ""; \
	echo "下一步:"; \
	echo "  make deploy PACKAGE=$$PACKAGE_NAME"

deploy: ## 部署到服务器 (用法: make deploy PACKAGE=server-dist-xxx.tar.gz)
ifndef PACKAGE
	@echo "$(YELLOW)错误: 请指定部署包$(NC)"
	@echo "用法: make deploy PACKAGE=server-dist-xxx.tar.gz"
	@exit 1
endif
	@echo "$(BLUE)部署到服务器...$(NC)"
	@echo "服务器: $(SERVER_USER)@$(SERVER_HOST)"
	@echo "部署包: $(PACKAGE)"
	@echo ""
	@echo "上传部署包..."
	scp $(PACKAGE) $(SERVER_USER)@$(SERVER_HOST):/tmp/
	@echo ""
	@echo "$(GREEN)上传完成!$(NC)"
	@echo ""
	@echo "请在服务器上执行以下命令:"
	@echo "  ssh $(SERVER_USER)@$(SERVER_HOST)"
	@echo "  cd /opt/server"
	@echo "  sudo tar -xzf /tmp/$(PACKAGE)"
	@echo "  npx prisma migrate deploy"
	@echo "  pm2 restart server"

deploy-update: package ## 打包并上传到服务器
	@VERSION=$$(date +%Y%m%d_%H%M%S); \
	PACKAGE_NAME="server-dist-$$VERSION.tar.gz"; \
	echo "$(BLUE)上传部署包到服务器...$(NC)"; \
	scp $$PACKAGE_NAME $(SERVER_USER)@$(SERVER_HOST):/tmp/; \
	echo ""; \
	echo "$(GREEN)上传完成!$(NC)"; \
	echo ""; \
	echo "请在服务器上执行以下命令:"; \
	echo "  ssh $(SERVER_USER)@$(SERVER_HOST)"; \
	echo "  cd /opt/server"; \
	echo "  ./manage.sh backup"; \
	echo "  sudo tar -xzf /tmp/$$PACKAGE_NAME"; \
	echo "  npx prisma migrate deploy"; \
	echo "  ./manage.sh restart"

# =============================================================================
# 服务器管理命令
# =============================================================================

server-status: ## 查看服务状态
	@echo "$(BLUE)查看服务状态...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && pm2 status"

server-logs: ## 查看服务日志
	@echo "$(BLUE)查看服务日志...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && pm2 logs server --lines 100"

server-restart: ## 重启服务
	@echo "$(BLUE)重启服务...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && pm2 restart server"

server-stop: ## 停止服务
	@echo "$(BLUE)停止服务...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && pm2 stop server"

server-start: ## 启动服务
	@echo "$(BLUE)启动服务...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && pm2 start server"

server-backup: ## 创建服务器备份
	@echo "$(BLUE)创建服务器备份...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && ./manage.sh backup"

server-rollback: ## 回滚到上一版本
	@echo "$(YELLOW)回滚到上一版本...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && ./manage.sh rollback"

server-health: ## 健康检查
	@echo "$(BLUE)执行健康检查...$(NC)"
	ssh $(SERVER_USER)@$(SERVER_HOST) "cd $(SERVER_DIR) && ./manage.sh health"

# =============================================================================
# 便捷命令
# =============================================================================

setup: install generate ## 首次设置（安装依赖 + 生成 Prisma Client）
	@echo "$(GREEN)设置完成!$(NC)"

rebuild: clean install build ## 重新构建（清理 + 安装 + 构建）
	@echo "$(GREEN)重新构建完成$(NC)"

quick-deploy: package deploy-update ## 快速部署（打包 + 上传）
	@echo "$(GREEN)快速部署完成$(NC)"

# =============================================================================
# 默认目标
# =============================================================================

.DEFAULT_GOAL := help
