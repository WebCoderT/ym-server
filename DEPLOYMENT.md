# 服务器部署文档（生产环境）

## 目录

- [概述](#概述)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [使用 Makefile](#使用-makefile)
- [服务器环境安装（Ubuntu）](#服务器环境安装ubuntu)
- [MySQL 安装与配置](#mysql-安装与配置)
- [本地打包](#本地打包)
- [部署到服务器](#部署到服务器)
- [更新部署](#更新部署)
- [服务器管理脚本](#服务器管理脚本)
- [常见问题](#常见问题)
- [监控和维护](#监控和维护)

## 概述

本文档介绍生产环境的部署流程：

- **操作系统**：Ubuntu 20.04+ / 22.04+ / 24.04+
- **部署方式**：本地打包 → 上传到服务器 → 运行
- **特点**：服务器不安装 Git，不拉取源代码，仅包含运行时文件

## 环境要求

### 本地开发环境
- Node.js >= 18.x
- pnpm >= 8.x
- Git（用于版本管理）

### 服务器环境
- Ubuntu 20.04+ / 22.04+ / 24.04+
- Node.js >= 18.x（仅运行时）
- MySQL >= 8.0
- PM2（进程管理器）

## 快速开始

```bash
# 1. 本地打包
pnpm build
tar -czf server-dist.tar.gz dist node_modules package.json prisma .env

# 2. 上传到服务器
scp server-dist.tar.gz user@server:/opt/

# 3. 服务器解压
ssh user@server
cd /opt
tar -xzf server-dist.tar.gz
cd server

# 4. 配置环境变量
vim .env

# 5. 初始化数据库
npx prisma generate
npx prisma migrate deploy

# 6. 启动服务
pm2 start dist/main.js --name "server" -i max
pm2 save
```

## 使用 Makefile

项目提供了 Makefile 来简化常用操作。

### 查看可用命令

```bash
make help
```

### 常用开发命令

```bash
# 安装依赖
make install

# 启动开发服务器
make dev

# 构建项目
make build

# 运行测试
make test

# 代码检查
make lint

# 代码格式化
make format

# 清理构建文件
make clean
```

### 数据库命令

```bash
# 生成 Prisma Client
make generate

# 运行数据库迁移
make migrate

# 填充测试数据
make seed

# 初始化数据库（生成 + 迁移）
make setup-db

# 重置数据库（危险！）
make reset-db
```

### 部署命令

```bash
# 打包部署包
make package

# 部署到服务器（需要先打包）
make deploy PACKAGE=server-dist-xxx.tar.gz

# 快速部署（打包 + 上传）
make deploy-update
```

### 服务器管理命令

```bash
# 查看服务状态
make server-status

# 查看服务日志
make server-logs

# 重启服务
make server-restart

# 停止服务
make server-stop

# 启动服务
make server-start

# 创建备份
make server-backup

# 回滚
make server-rollback

# 健康检查
make server-health
```

### 配置服务器地址

在 Makefile 中修改以下变量：

```makefile
SERVER_USER ?= deploy
SERVER_HOST ?= your-server.com
SERVER_DIR ?= /opt/server
```

或在命令行指定：

```bash
make server-status SERVER_USER=deploy SERVER_HOST=192.168.1.100
```

## 项目结构

### 本地开发目录

```
server/
├── .env                # 环境变量配置（会打包到部署包）
├── .env.example        # 环境变量示例
├── package.json        # 项目依赖（会打包到部署包）
├── prisma/
│   └── schema.prisma   # 数据库模型定义（会打包到部署包）
├── scripts/
│   ├── package.sh      # 本地打包脚本
│   └── manage.sh       # 服务器管理脚本（需上传到服务器）
└── src/                # 源代码（仅本地开发，不会部署）
```

### 服务器部署目录

```
/opt/server/            # 应用目录
├── .env                # 环境变量配置
├── package.json        # 项目依赖
├── prisma/
│   └── schema.prisma   # 数据库模型
├── dist/               # 构建产物
├── node_modules/       # 依赖包
└── manage.sh           # 管理脚本（可选）

/opt/backups/           # 备份目录
├── backup-YYYYMMDD_HHMMSS/
└── history.txt
```

## 服务器环境安装（Ubuntu）

### 1. 系统更新

```bash
# 更新软件包列表
sudo apt update
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget nano ufw
```

### 2. 安装 Node.js（使用 NodeSource）

```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 设置 npm 镜像（可选，加速下载）
npm config set registry https://registry.npmmirror.com
```

### 3. 安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version

# 设置开机自启
pm2 startup
# 执行输出的命令

# 保存 PM2 配置
pm2 save
```

### 4. 配置防火墙

```bash
# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS（如果使用 Nginx）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许应用端口（根据实际情况修改）
sudo ufw allow 3000/tcp

# 启用防火墙
sudo ufw enable
sudo ufw status
```

### 5. 创建部署用户（推荐）

```bash
# 创建部署用户
sudo adduser deploy

# 添加到 sudo 组（可选）
sudo usermod -aG sudo deploy

# 创建应用目录
sudo mkdir -p /opt/server
sudo chown deploy:deploy /opt/server
```

## MySQL 安装与配置

### 1. 安装 MySQL

```bash
# 更新软件包列表
sudo apt update

# 安装 MySQL Server
sudo apt install mysql-server -y

# 验证安装
mysql --version
```

### 2. 启动和配置 MySQL 服务

```bash
# 启动 MySQL 服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 检查服务状态
sudo systemctl status mysql
```

### 3. 运行安全配置脚本

```bash
# 运行 MySQL 安全配置
sudo mysql_secure_installation
```

按提示进行以下配置：

```
# 1. 是否启用 VALIDATE PASSWORD 组件（密码强度验证）
VALIDATE PASSWORD COMPONENT can be used to test passwords...
Press y|Y for Yes, other key for No: Y

# 2. 选择密码验证策略级别
Please enter 0 = LOW, 1 = MEDIUM, 2 = STRONG: 2

# 3. 设置 root 密码
Please set the password for root here.
New password: [输入强密码]
Re-enter new password: [再次输入]

# 4. 是否移除匿名用户
Remove anonymous users? : Y

# 5. 是否禁止 root 远程登录
Disallow root login remotely? : Y

# 6. 是否移除测试数据库
Remove test database and access to it? : Y

# 7. 是否重新加载权限表
Reload privilege tables now? : Y
```

### 4. 创建数据库和用户

```bash
# 登录 MySQL（使用 sudo）
sudo mysql

# 或者使用 root 密码登录
mysql -u root -p
```

在 MySQL 命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用专用用户
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授予数据库权限
GRANT ALL PRIVILEGES ON your_database_name.* TO 'app_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看数据库列表
SHOW DATABASES;

-- 退出
EXIT;
```

### 5. 配置 MySQL 远程访问（可选）

如果需要从其他服务器访问数据库：

```bash
# 编辑 MySQL 配置文件
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

修改绑定地址：

```ini
# 将 bind-address 改为 0.0.0.0（允许所有 IP）或指定 IP
bind-address = 0.0.0.0
```

创建允许远程访问的用户：

```bash
sudo mysql
```

```sql
-- 创建允许远程访问的用户
CREATE USER 'remote_user'@'%' IDENTIFIED BY 'your_strong_password';

-- 授予权限
GRANT ALL PRIVILEGES ON your_database_name.* TO 'remote_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
EXIT;
```

重启 MySQL：

```bash
sudo systemctl restart mysql
```

配置防火墙（如果启用）：

```bash
# 允许 MySQL 端口（默认 3306）
sudo ufw allow 3306/tcp

# 或限制只允许特定 IP 访问
sudo ufw allow from YOUR_SERVER_IP to any port 3306
```

### 6. MySQL 性能优化（可选）

```bash
# 编辑 MySQL 配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

添加或修改以下配置：

```ini
[mysqld]
# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 连接数
max_connections = 200

# InnoDB 缓冲池大小（建议设置为物理内存的 50-70%）
innodb_buffer_pool_size = 1G

# InnoDB 日志文件大小
innodb_log_file_size = 256M

# 查询缓存（MySQL 8.0 已移除，旧版本可启用）
# query_cache_size = 64M
# query_cache_type = 1

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# 错误日志
log_error = /var/log/mysql/error.log
```

重启 MySQL 使配置生效：

```bash
sudo systemctl restart mysql
```

### 7. MySQL 备份

#### 手动备份

```bash
# 备份单个数据库
mysqldump -u app_user -p your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份所有数据库
mysqldump -u root -p --all-databases > all_databases_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
mysqldump -u app_user -p your_database_name | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 恢复备份

```bash
# 恢复数据库
mysql -u app_user -p your_database_name < backup_20240101_120000.sql

# 恢复压缩备份
gunzip < backup_20240101_120000.sql.gz | mysql -u app_user -p your_database_name
```

#### 自动定时备份

```bash
# 创建备份脚本
sudo nano /usr/local/bin/mysql_backup.sh
```

添加以下内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
USER="app_user"
PASSWORD="your_password"
DATABASE="your_database_name"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -u $USER -p$PASSWORD $DATABASE | gzip > $BACKUP_DIR/$DATABASE\_$DATE.sql.gz

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $DATABASE\_$DATE.sql.gz"
```

```bash
# 赋予执行权限
sudo chmod +x /usr/local/bin/mysql_backup.sh

# 设置定时任务
sudo crontab -e

# 添加：每天凌晨 2 点备份
0 2 * * * /usr/local/bin/mysql_backup.sh >> /var/log/mysql_backup.log 2>&1
```

### 8. MySQL 监控

```bash
# 查看 MySQL 状态
sudo systemctl status mysql

# 查看 MySQL 进程
mysqladmin -u root -p processlist

# 查看数据库大小
mysql -u root -p -e "SELECT table_schema AS 'Database', 
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
FROM information_schema.tables 
GROUP BY table_schema;"

# 查看当前连接数
mysql -u root -p -e "SHOW STATUS WHERE Variable_name = 'Threads_connected';"

# 查看最大连接数
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
```

### 9. MySQL 常用管理命令

```bash
# 启动/停止/重启 MySQL
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# 查看 MySQL 日志
sudo tail -f /var/log/mysql/error.log

# 查看慢查询日志
sudo tail -f /var/log/mysql/slow-query.log

# 登录 MySQL
mysql -u root -p

# 查看数据库
mysql -u root -p -e "SHOW DATABASES;"

# 查看用户
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"
```

### 10. 卸载 MySQL（如需重装）

```bash
# 停止 MySQL 服务
sudo systemctl stop mysql

# 卸载 MySQL
sudo apt purge mysql-server mysql-client mysql-common -y
sudo apt autoremove -y
sudo apt autoclean -y

# 删除数据目录（谨慎！）
sudo rm -rf /var/lib/mysql
sudo rm -rf /etc/mysql
```

## 本地打包

### 1. 构建项目

在本地开发环境中执行：

```bash
# 进入 server 目录
cd server

# 安装依赖（确保所有依赖已安装）
pnpm install

# 构建项目
pnpm build
```

### 2. 准备部署包

```bash
# 确保以下文件/目录存在
ls -la
# 应该包含：
# - dist/              (构建产物)
# - node_modules/      (依赖包)
# - package.json       (项目配置)
# - prisma/            (数据库模型)
# - .env               (环境变量)
```

### 3. 创建打包脚本（推荐）

在 server 目录创建 `scripts/package.sh`：

```bash
#!/bin/bash

# 版本号（使用时间戳）
VERSION=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="server-dist-$VERSION.tar.gz"

echo "开始打包版本: $VERSION"

# 清理旧的构建文件
rm -rf dist/
echo "已清理 dist 目录"

# 构建项目
pnpm build
if [ $? -ne 0 ]; then
    echo "构建失败！"
    exit 1
fi
echo "构建完成"

# 创建部署包
echo "创建部署包: $PACKAGE_NAME"
tar -czf "$PACKAGE_NAME" \
    dist/ \
    node_modules/ \
    package.json \
    prisma/ \
    .env

if [ $? -eq 0 ]; then
    echo "打包成功！"
    echo "部署包: $PACKAGE_NAME"
    echo "文件大小: $(du -h "$PACKAGE_NAME" | cut -f1)"
else
    echo "打包失败！"
    exit 1
fi
```

```bash
# 赋予执行权限
chmod +x scripts/package.sh

# 运行打包脚本
./scripts/package.sh
```

### 4. 手动打包

如果不想使用脚本，可以手动执行：

```bash
# 清理并构建
rm -rf dist/
pnpm build

# 创建部署包
VERSION=$(date +%Y%m%d_%H%M%S)
tar -czf "server-dist-$VERSION.tar.gz" \
    dist/ \
    node_modules/ \
    package.json \
    prisma/ \
    .env
```

## 部署到服务器

### 1. 上传部署包

```bash
# 使用 scp 上传（替换实际的用户名和服务器地址）
scp server-dist-*.tar.gz user@your-server:/tmp/

# 或使用 rsync（支持断点续传）
rsync -avz --progress server-dist-*.tar.gz user@your-server:/tmp/
```

### 2. 登录服务器

```bash
ssh user@your-server
```

### 3. 备份当前版本（如果是更新）

```bash
# 如果是首次部署，跳过此步骤

# 创建备份目录
sudo mkdir -p /opt/backups
cd /opt/backups

# 备份当前版本
BACKUP_NAME="server-backup-$(date +%Y%m%d_%H%M%S)"
sudo cp -r /opt/server "$BACKUP_NAME"

# 停止当前服务
pm2 stop server

echo "已备份到: $BACKUP_NAME"
```

### 4. 解压部署包

```bash
# 进入部署目录
cd /opt

# 如果是首次部署，创建目录
sudo mkdir -p /opt/server
sudo chown deploy:deploy /opt/server

# 解压部署包
sudo tar -xzf /tmp/server-dist-*.tar.gz -C /opt/server/

# 清理临时文件
rm /tmp/server-dist-*.tar.gz

# 进入应用目录
cd /opt/server
```

### 5. 配置环境变量

```bash
# 编辑环境变量文件
vim .env
```

必须配置的环境变量：

```env
# 数据库配置
DATABASE_URL="mysql://app_user:your_password@localhost:3306/your_database"

# JWT 密钥（生产环境请使用强密码）
JWT_SECRET="your-very-strong-secret-key-here"

# 服务端口
PORT=3000

# 其他配置...
NODE_ENV=production
```

### 6. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移（首次部署或数据库结构变更时）
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status
```

### 7. 启动服务

```bash
# 使用 PM2 启动
pm2 start dist/main.js --name "server" -i max

# 或指定实例数
pm2 start dist/main.js --name "server" -i 4

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令
```

### 8. 验证部署

```bash
# 检查服务状态
pm2 status

# 查看日志
pm2 logs server --lines 50

# 测试 API
curl http://localhost:3000/health

# 或测试其他接口
curl http://localhost:3000/api/health
```

### 9. 配置反向代理（推荐）

安装 Nginx：

```bash
sudo apt install nginx -y
```

创建 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/server
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # 日志配置
    access_log /var/log/nginx/server-access.log;
    error_log /var/log/nginx/server-error.log;

    # 请求体大小限制
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/server /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 10. 配置 SSL（生产环境必需）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（替换域名）
sudo certbot --nginx -d api.yourdomain.com

# 自动续期测试
sudo certbot renew --dry-run

# Certbot 会自动设置定时任务
```

## 更新部署

### 1. 本地重新打包

```bash
# 在本地 server 目录
./scripts/package.sh
```

### 2. 上传新版本

```bash
# 上传新的部署包
scp server-dist-*.tar.gz user@your-server:/tmp/
```

### 3. 服务器上部署

```bash
# 登录服务器
ssh user@your-server

# 备份当前版本
cd /opt/backups
sudo cp -r /opt/server "server-backup-$(date +%Y%m%d_%H%M%S)"

# 停止服务
pm2 stop server

# 清理旧文件（保留 .env）
cd /opt/server
mv .env /tmp/.env.backup
sudo rm -rf dist/ node_modules/ package.json prisma/
mv /tmp/.env.backup .env

# 解压新版本
sudo tar -xzf /tmp/server-dist-*.tar.gz -C /opt/server/
rm /tmp/server-dist-*.tar.gz

# 运行数据库迁移（如果有）
npx prisma migrate deploy

# 重启服务
pm2 restart server

# 验证部署
pm2 status
curl http://localhost:3000/health
```

### 4. 回滚（如有问题）

```bash
# 查看备份列表
ls -la /opt/backups/

# 停止当前服务
pm2 stop server

# 恢复备份
cd /opt
sudo rm -rf server
sudo cp -r /opt/backups/server-backup-YYYYMMDD_HHMMSS server
cd server

# 重启服务
pm2 restart server
```

## 服务器管理脚本

在服务器上部署后，可以使用管理脚本简化日常操作。

### 1. 安装管理脚本

```bash
# 将管理脚本上传到服务器
scp scripts/manage.sh user@your-server:/opt/server/

# 或直接在服务器上创建
ssh user@your-server
cd /opt/server
nano manage.sh
# 粘贴 scripts/manage.sh 的内容

# 赋予执行权限
chmod +x manage.sh
```

### 2. 使用管理脚本

```bash
# 查看所有命令
./manage.sh help

# 启动服务
./manage.sh start

# 停止服务
./manage.sh stop

# 重启服务
./manage.sh restart

# 查看服务状态
./manage.sh status

# 查看日志
./manage.sh logs
./manage.sh logs 200  # 查看最近 200 行

# 创建备份
./manage.sh backup

# 查看可回滚版本
./manage.sh versions

# 回滚到上一版本
./manage.sh rollback

# 健康检查
./manage.sh health
```

### 3. 管理脚本命令参考

| 命令 | 说明 |
|------|------|
| `start` | 启动服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `status` | 查看服务状态和最近日志 |
| `logs [行数]` | 查看日志（默认 100 行） |
| `backup` | 创建当前版本备份 |
| `rollback` | 回滚到上一个版本 |
| `versions` | 查看所有可回滚版本 |
| `health` | 执行健康检查 |
| `help` | 显示帮助信息 |

## 更新部署

## 常见问题

### 数据库连接失败

```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 检查 DATABASE_URL 配置
cat /opt/server/.env | grep DATABASE_URL

# 测试数据库连接
mysql -u app_user -p your_database

# 检查数据库用户权限
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"
```

### 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000

# 或
sudo netstat -tulpn | grep 3000

# 杀死进程（谨慎）
sudo kill -9 <PID>

# 或修改 .env 中的 PORT
```

### 内存不足

```bash
# 查看内存使用
free -h

# 减少 PM2 实例数
pm2 delete server
pm2 start dist/main.js --name "server" -i 2

# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### PM2 服务异常

```bash
# 查看详细日志
pm2 logs server --err --lines 100

# 重启服务
pm2 restart server

# 完全重置
pm2 delete server
pm2 start dist/main.js --name "server" -i max
pm2 save

# 查看服务状态
pm2 status
pm2 monit
```

### Prisma 迁移失败

```bash
# 查看迁移状态
cd /opt/server
npx prisma migrate status

# 重置数据库（危险！会丢失数据）
# npx prisma migrate reset

# 手动应用迁移
npx prisma migrate deploy

# 重新生成 Prisma Client
npx prisma generate
```

### Nginx 配置错误

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx

# 检查 Nginx 状态
sudo systemctl status nginx
```

## 监控和维护

### 服务监控

```bash
# 查看 PM2 服务状态
pm2 status

# 实时监控
pm2 monit

# 查看日志
pm2 logs server
pm2 logs server --lines 100

# 查看错误日志
pm2 logs server --err

# 重启服务
pm2 restart server

# 停止服务
pm2 stop server

# 启动服务
pm2 start server
```

### 系统监控

```bash
# 查看系统资源
top
htop

# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看 CPU 信息
lscpu

# 查看网络连接
netstat -tuln
ss -tuln
```

### 日志管理

```bash
# 清理 PM2 日志
pm2 flush

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 MySQL 日志
sudo tail -f /var/log/mysql/error.log

# 配置日志轮转（PM2）
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 数据库维护

```bash
# 备份数据库
mysqldump -u app_user -p your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
mysqldump -u app_user -p your_database | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 查看数据库大小
mysql -u root -p -e "SELECT table_schema AS 'Database', 
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
FROM information_schema.tables 
GROUP BY table_schema;"

# 优化表
mysql -u root -p -e "OPTIMIZE TABLE your_database.your_table;"

# 查看慢查询
sudo tail -f /var/log/mysql/slow-query.log
```

### 安全更新

```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 更新 Node.js（如需升级）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 重启服务
pm2 restart server
```

### 自动化维护脚本

创建维护脚本 `/opt/server/scripts/maintenance.sh`：

```bash
#!/bin/bash

# 清理日志
pm2 flush

# 重启服务（释放内存）
pm2 restart server

# 检查磁盘空间
echo "磁盘使用情况："
df -h /opt

# 检查内存使用
echo "内存使用情况："
free -h

# 备份数据库
cd /opt/backups
mysqldump -u app_user -pYourPassword your_database | gzip > "db-backup-$(date +%Y%m%d_%H%M%S).sql.gz"

# 清理 30 天前的备份
find /opt/backups -name "*.sql.gz" -mtime +30 -delete
find /opt/backups -name "server-backup-*" -mtime +7 -delete

echo "维护完成"
```

```bash
# 赋予执行权限
sudo chmod +x /opt/server/scripts/maintenance.sh

# 设置定时任务
sudo crontab -e

# 每天凌晨 3 点执行维护
0 3 * * * /opt/server/scripts/maintenance.sh >> /var/log/maintenance.log 2>&1
```
