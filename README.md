# 通用服务端项目 (server-general)

基于原项目 `server` 清理出的通用版本，移除了所有业务特定功能，只保留通用基础功能。

## 项目状态

**当前状态**: ✅ 已完成，所有编译错误已修复

## 已完成的清理工作

### 1. 删除的业务模块 (28个)
- `card` - 卡牌系统
- `event` - 活动管理
- `ticket` - 票务系统
- `gift` - 礼物系统
- `goods` - 商品管理
- `order` - 订单系统
- `refund` - 退款系统
- `reward` - 打赏系统
- `review` - 评价系统
- `fan-club` - 粉丝团
- `star` - 明星管理
- 等其他业务模块...

### 2. 保留的通用模块 (26个)
- `admin` - 管理端基础
- `auth` - 认证/登录/注册
- `user` - 用户管理
- `role` - 角色管理
- `security` - 安全审计
- `session` - 会话管理
- `redis` - 缓存
- `storage` - 存储
- `image` - 图片管理
- `system-config` - 系统设置
- `banner` - 轮播图/内容管理
- `notification` - 通知
- `quick-nav` - 快捷导航
- `region` - 地区
- `rule` - 规则管理
- `wallet` - 钱包
- `member` - 会员
- `member-level` - 会员等级
- `payment-method` - 支付方式
- `payment-config` - 支付配置
- `payment-transaction` - 支付流水
- `payment-notify` - 支付回调
- `courier-company` - 快递公司
- `dashboard` - 仪表盘
- `api-monitor` - API监控

### 3. 已更新的核心文件
- `src/app.module.ts` - 移除业务模块引用
- `src/admin/admin.module.ts` - 重写为通用版本
- `src/client/client.module.ts` - 重写为通用版本
- `src/public/public.module.ts` - 重写为通用版本
- `src/permission.enum.ts` - 移除业务权限
- `scripts/enum-registry.ts` - 移除业务枚举

## 通用功能说明

### 认证系统
- 用户注册/登录
- JWT Token 管理
- 密码加密

### 权限系统
- 角色管理 (Role)
- 权限枚举 (Permission)
- 访问级别守卫 (AccessLevelGuard)
- 权限守卫 (PermissionGuard)

### 内容管理
- 轮播图管理 (Banner)
- 图片管理 (Image)
- 快捷导航 (QuickNav)
- 通知管理 (Notification)

### 系统设置
- 系统配置 (SystemConfig)
- 地区管理 (Region)
- 规则管理 (Rule)

### 支付基础
- 支付方式配置 (PaymentMethod)
- 支付配置 (PaymentConfig)
- 支付流水 (PaymentTransaction)
- 支付回调 (PaymentNotify)

### 用户系统
- 用户管理 (User)
- 会员等级 (MemberLevel)
- 会员任务 (Member)
- 钱包 (Wallet)
- 安全审计 (Security)

## 已完成的工作

1. ✅ 删除28个业务特定模块
2. ✅ 保留26个通用基础模块
3. ✅ 重写核心模块文件（app.module.ts, admin.module.ts, client.module.ts, public.module.ts）
4. ✅ 更新权限枚举（permission.enum.ts）
5. ✅ 简化钱包模块（移除订单/支付依赖）
6. ✅ 简化会员等级模块（移除头像框/勋章依赖）
7. ✅ 简化用户模块（移除业务统计依赖）
8. ✅ 修复所有TypeScript编译错误
9. ✅ 更新角色种子服务（role-seed.service.ts）
10. ✅ 更新仪表盘控制器（admin-dashboard.controller.ts）
11. ✅ 更新搜索控制器（public-search.controller.ts）
12. ✅ 更新充值服务（recharge.service.ts）

## 如何使用

```bash
cd server-general
npm install
npm run build  # 需要先修复编译错误
npm run start:dev
```

## 原项目

原项目位于 `../server`，包含完整的业务功能。
