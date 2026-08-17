# YM Server

开箱即用的管理后台服务端模板，基于 NestJS 构建。采用模块化架构设计，支持通过安装插件模块进行功能拓展，快速搭建各类管理后台系统。

## 特性

- **模块化架构** — 26 个内置通用模块，按需组合，即插即用
- **插件式拓展** — 新增业务只需添加一个模块目录，注册到对应领域即可生效
- **三端分离** — Admin（管理端）、Client（用户端）、Public（公开接口）独立路由与权限体系
- **完整的认证鉴权** — JWT + 刷新令牌 + 访问级别守卫 + 细粒度权限守卫 + 安全审计日志
- **微信支付集成** — 小程序登录、微信支付、退款回调开箱可用
- **多存储方案** — 本地存储 + 阿里云 OSS，统一签名接口
- **实时仪表盘** — 用户、会员、钱包、内容等多维度数据统计
- **API 文档** — Swagger 三端独立文档，支持在线调试
- **Docker 就绪** — 多阶段构建，内置健康检查，一键部署

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | NestJS 11 + TypeScript 5.7 |
| 数据库 | MySQL + TypeORM 0.3 |
| 缓存 | Redis (ioredis) |
| 认证 | JWT + Passport + scrypt |
| 校验 | class-validator + class-transformer |
| API 文档 | Swagger (OpenAPI 3) |
| 对象存储 | 阿里云 OSS |
| 定时任务 | @nestjs/schedule + Bull |
| 测试 | Jest + Supertest (E2E) |
| 部署 | Docker 多阶段构建 |

## 项目结构

```
ym-server/
├── src/
│   ├── admin/                 # 管理端控制器（22 个）
│   ├── client/                # 用户端控制器（11 个）
│   ├── public/                # 公开接口控制器（8 个）
│   ├── common/                # 公共工具
│   │   ├── dto/               # 通用 DTO
│   │   ├── filters/           # 异常过滤器
│   │   ├── interceptors/      # 拦截器
│   │   ├── pipes/             # 管道
│   │   ├── messages/          # 消息常量
│   │   └── utils/             # 工具函数
│   ├── config/                # 配置（数据库、Redis、OSS、Swagger）
│   ├── migrations/            # 数据库迁移
│   └── modules/               # 业务模块（插件目录）
│       ├── admin/             # 管理员账户
│       ├── auth/              # 认证服务（登录、JWT、微信、短信）
│       ├── user/              # 用户管理
│       ├── role/              # 角色与权限
│       ├── security/          # 安全审计日志
│       ├── session/           # 会话管理
│       ├── redis/             # Redis 缓存
│       ├── storage/           # 文件存储（本地 + OSS）
│       ├── image/             # 图片管理
│       ├── system-config/     # 系统配置
│       ├── banner/            # 轮播图管理
│       ├── notification/      # 通知推送
│       ├── quick-nav/         # 快捷导航
│       ├── region/            # 地区数据
│       ├── rule/              # 规则管理
│       ├── wallet/            # 钱包（余额、提现、充值）
│       ├── member/            # 会员功能
│       ├── member-level/      # 会员等级
│       ├── payment-method/    # 支付方式
│       ├── payment-config/    # 支付网关配置
│       ├── payment-transaction/ # 支付流水
│       ├── payment-notify/    # 支付回调
│       ├── courier-company/   # 快递公司
│       ├── dashboard/         # 仪表盘统计
│       └── api-monitor/       # API 监控
├── scripts/                   # 部署脚本
├── openapi/                   # 导出的 OpenAPI 文档
├── test/                      # E2E 测试
├── Dockerfile                 # Docker 构建文件
└── Makefile                   # 构建与部署命令
```

## 快速开始

### 环境要求

- Node.js >= 20
- MySQL >= 5.7
- Redis >= 5.0

### 安装与运行

```bash
# 安装依赖
npm install

# 复制并编辑环境变量
cp .env.example .env.development

# 启动开发服务（热重载）
npm run start:dev

# 构建生产版本
npm run build

# 启动生产服务
npm run start:prod
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `8000` |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `DB_HOST` | MySQL 地址 | `127.0.0.1` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USERNAME` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | — |
| `DB_NAME` | 数据库名 | `star_app` |
| `DB_SYNCHRONIZE` | 自动同步表结构 | `true` |
| `REDIS_HOST` | Redis 地址 | `127.0.0.1` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | — |
| `REDIS_DB` | Redis 数据库编号 | `0` |
| `WECHAT_APP_ID` | 微信小程序 AppID | — |
| `WECHAT_APP_SECRET` | 微信小程序 AppSecret | — |
| `HTTPS_ENABLE` | 启用 HTTPS | `false` |

## 插件开发

新增业务模块只需 **3 步**：

### 1. 创建模块目录

```
src/modules/my-feature/
├── entities/
│   └── my-feature.entity.ts     # 数据实体
├── dto/
│   └── create-my-feature.dto.ts # 请求校验
├── vo/
│   └── my-feature.vo.ts        # 响应结构
├── my-feature.service.ts        # 业务逻辑
├── my-feature.module.ts         # 模块定义
└── my-feature.controller.ts     # 路由控制器（可选）
```

### 2. 注册模块

```typescript
// my-feature.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([MyFeatureEntity])],
  providers: [MyFeatureService],
  exports: [MyFeatureService],  // 需要被其他模块使用时导出
})
export class MyFeatureModule {}
```

### 3. 挂载到目标端

将模块导入对应的领域模块即可生效：

```typescript
// src/admin/admin.module.ts — 挂载到管理端
imports: [..., MyFeatureModule]

// src/client/client.module.ts — 挂载到用户端
imports: [..., MyFeatureModule]

// src/public/public.module.ts — 挂载到公开接口
imports: [..., MyFeatureModule]
```

模块挂载后，在对应端新增控制器即可自动注册路由，无需其他配置。

## 权限体系

### 访问级别

| 级别 | 路由前缀 | 说明 |
|------|----------|------|
| `ADMIN` | `/admin/*` | 管理后台，需管理员账号 |
| `CLIENT` | `/client/*` | 用户端，需用户登录 |
| `PUBLIC` | `/public/*` 及 `/oss/*` | 公开访问，无需登录 |

### 权限粒度

采用 `<模块>:<资源>:<操作>` 命名规范：

```typescript
enum Permission {
  ADMIN_USER_MANAGE     = 'admin:user:manage',      // 用户管理
  ADMIN_CONTENT_MANAGE  = 'admin:content:manage',   // 内容管理
  ADMIN_SYSTEM_MANAGE   = 'admin:system:manage',    // 系统管理
  CLIENT_WALLET_OPERATE = 'client:wallet:operate',  // 钱包操作
  // ...
}
```

超级管理员自动拥有 `*` 通配权限。

## API 文档

启动服务后访问 Swagger 文档：

| 端 | 地址 |
|----|------|
| 管理端 | `http://localhost:8000/docs/admin` |
| 用户端 | `http://localhost:8000/docs/client` |
| 公开接口 | `http://localhost:8000/docs/public` |

导出 OpenAPI JSON：

```bash
npm run openapi:export
```

## 测试

```bash
# 单元测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:cov

# E2E 测试
npm run test:e2e
```

## 部署

### Docker

```bash
# 构建镜像
docker build -t ym-server .

# 运行容器
docker run -d -p 8000:3000 --env-file .env.production ym-server
```

### 脚本部署

```bash
# 打包
make package

# 上传并部署
make deploy

# 或使用部署脚本
bash scripts/deploy.sh        # Linux / macOS
powershell scripts/deploy.ps1 # Windows PowerShell
```

## License

MIT
