# Shopify App Starter Pro

> 生产就绪的现代化 Shopify 嵌入式应用脚手架，基于 Next.js 14、Prisma ORM、多店铺隔离架构与本地开发者沙箱。  
> Production-ready modern Shopify embedded app boilerplate built with Next.js 14, Prisma ORM, multi-shop multi-tenant architecture, and a zero-friction local developer sandbox.

---

## 目录 / Table of Contents

- [中文说明](#中文说明)
  - [功能与改进点](#功能与改进点)
  - [架构概览](#架构概览)
  - [快速开始](#快速开始)
  - [环境与多环境配置](#环境与多环境配置)
  - [来源与致谢](#来源与致谢)
  - [许可证](#许可证)
- [English Documentation](#english-documentation)
  - [Features & Enhancements](#features--enhancements)
  - [Architecture Overview](#architecture-overview)
  - [Quick Start](#quick-start)
  - [Multi-Environment Configuration](#multi-environment-configuration)
  - [Attribution & Acknowledgements](#attribution--acknowledgements)
  - [License](#license)

---

# 中文说明

## 功能与改进点

本项目基于 **B 路线（按思路全新独立实现）**，在吸收 [shopify-nextjs-prisma-app](https://github.com/kinngh/shopify-nextjs-prisma-app) 架构亮点的基础上，完全重写了底层实现，并依据 Shopify 最新应用规范进行了深度强化：

1. **Shopify 2025+ 最新规范重写**：
   - 彻底废除旧版 OAuth 页面重定向与 ExitFrame 闪烁跳转，采用 Shopify 推荐的 App Bridge CDN + Session Token（JWT Bearer）无感鉴权流程。
   - 升级客户端工厂体系（`shopifyClients`），明确分离用户在线会话（Online Session）与店铺后台任务（Offline Session）的 GraphQL/REST 请求上下文。
2. **多店铺与多租户存储架构**：
   - 重构 Prisma Schema，提供 `Shop`（店铺状态与生命周期）、`Session`（在线/离线会话隔离）、`WebhookEvent`（合规审计表）与 `AppSetting`（店铺独立配置）。
   - 支持多店铺并行安装、卸载状态自动流转。
3. **安全加固的验证中间件**：
   - App Proxy 验证：严格实现 Shopify 官方 HMAC-SHA256 排序与摘要算法，结合 Node.js 原生 `crypto.timingSafeEqual` 防范时序攻击。
   - Webhook 验证：支持 Raw Body 级别签名校验，并内置 GDPR 强制隐私回调分发（`customers/data_request`、`customers/redact`、`shop/redact`）。
4. **开箱即用的本地开发者沙箱（Zero-Config Local Sandbox）**：
   - 默认采用嵌入式 SQLite 引擎，无需预装 PostgreSQL 即可秒级启动。
   - 内置 Mock 模式与调试控制台（`/debug`）：即使在没有 Shopify 开发者账号、没有外部内网穿透隧道（ngrok/Cloudflare）的纯离线环境下，也可直接体验仪表盘、测试 GraphQL 查询、模拟 App Proxy 签名与触发 Webhook 审计。
5. **多环境 CLI 配置自动化**：
   - 内置 `scripts/generate-toml.mjs`，可根据环境变量针对开发（development）、预发布（staging）与生产（production）环境一键生成合规的 `shopify.app.<env>.toml`。

---

## 架构概览

```
shopify-app-starter-pro/
├── prisma/
│   └── schema.prisma            # 多店铺、多租户会话与 Webhook 审计数据模型
├── src/
│   ├── components/              # 现代 Polaris 风格响应式组件
│   ├── config/                  # 多环境配置校验层 (env.ts)
│   ├── lib/
│   │   ├── auth/                # Session Token / JWT 规范解析
│   │   ├── db.ts                # PrismaClient 全局连接单例
│   │   ├── shopify/             # 纯原生 HMAC 算法与 GraphQL/REST 客户端工厂
│   │   └── webhooks/            # Webhook 签名验证与 GDPR 处理器分发
│   ├── middleware/              # API 鉴权中间件 (Session/Proxy/Webhook)
│   └── pages/                   # Next.js 页面与受保护 API 路由
├── scripts/                     # 多环境 shopify.app.toml 生成脚本
└── test/                        # 自动化安全与集成测试套件
```

---

## 快速开始

### 1. 环境准备
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. 克隆与安装依赖
```bash
git clone <repository-url>
cd shopify-app-starter-pro
npm install
```

### 3. 配置环境变量
复制示例配置文件：
```bash
cp .env.example .env
```
根据实际情况补充配置参数（本地测试可直接使用默认值开启沙箱模拟）：
```env
SHOPIFY_API_KEY=<your-shopify-api-key>
SHOPIFY_API_SECRET=<your-shopify-api-secret>
SHOPIFY_APP_URL=https://<your-app-tunnel-domain>.example.com
SHOPIFY_API_VERSION=2025-01
SHOPIFY_SCOPES=read_products,write_products,read_orders
DATABASE_URL="file:./dev.db"
LOCAL_SANDBOX_MODE=true
```

### 4. 初始化数据库
```bash
npm run prisma:push
```

### 5. 运行自动化测试
```bash
npm test
```

### 6. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)：
- **管理仪表盘**：`http://localhost:3000/`
- **开发者控制台与测试沙箱**：`http://localhost:3000/debug`

### 7. 生产环境构建与启动
```bash
npm run build
npm start
```

---

## 环境与多环境配置

根据不同部署环境生成对应的 Shopify CLI 配置文件：
```bash
# 生成预发布环境配置
npm run config:generate staging

# 生成生产环境配置并自定义输出路径
node scripts/generate-toml.mjs production shopify.app.prod.toml
```

---

## 来源与致谢

本项目的思路与功能设计受到 [shopify-nextjs-prisma-app](https://github.com/kinngh/shopify-nextjs-prisma-app) 启发，原项目作者为 kinngh，代码为独立实现。

---

## 许可证

本项目沿用原许可证，采用 [MIT 许可证](LICENSE) 开源。

---

# English Documentation

## Features & Enhancements

This project follows **Track B (rewrite based on design concepts)**. While drawing inspiration from the architectural advantages of [shopify-nextjs-prisma-app](https://github.com/kinngh/shopify-nextjs-prisma-app), all source code has been freshly developed from scratch and updated to comply with the latest Shopify specifications:

1. **Modern Shopify 2025+ Standards**:
   - Replaced legacy multi-step OAuth redirects and ExitFrame flickering with the official App Bridge CDN and seamless Session Token (JWT Bearer) flow.
   - Restructured the client provider (`shopifyClients`) to cleanly separate Online user sessions from Offline store background/webhook contexts.
2. **Multi-Shop & Multi-Tenant Architecture**:
   - Comprehensive Prisma schema with dedicated models: `Shop` (store lifecycle status), `Session` (online/offline token separation), `WebhookEvent` (compliance and audit logs), and `AppSetting` (per-store configuration).
3. **Hardened Security Middlewares**:
   - App Proxy Authentication: Full implementation of Shopify query parameter canonical sorting and HMAC-SHA256 calculation with `crypto.timingSafeEqual` to eliminate timing attacks.
   - Webhook Authentication: Raw-body HMAC verification with built-in handlers for mandatory GDPR topics (`customers/data_request`, `customers/redact`, and `shop/redact`).
4. **Zero-Config Local Developer Sandbox**:
   - Powered by an embedded SQLite database by default (`file:./dev.db`), removing any need for local PostgreSQL servers during development.
   - Built-in Mock Mode & Debug Console (`/debug`): Full dashboard, GraphQL querying, App Proxy testing, and Webhook simulation work out-of-the-box offline without active Shopify Partner credentials or external tunnels.
5. **Multi-Environment Configuration Generator**:
   - Includes `scripts/generate-toml.mjs` to dynamically generate compliant `shopify.app.<env>.toml` configurations for `development`, `staging`, and `production`.

---

## Quick Start

### 1. Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Installation
```bash
git clone <repository-url>
cd shopify-app-starter-pro
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
Fill in your placeholders in `.env`:
```env
SHOPIFY_API_KEY=<your-shopify-api-key>
SHOPIFY_API_SECRET=<your-shopify-api-secret>
SHOPIFY_APP_URL=https://<your-app-tunnel-domain>.example.com
SHOPIFY_API_VERSION=2025-01
SHOPIFY_SCOPES=read_products,write_products,read_orders
DATABASE_URL="file:./dev.db"
LOCAL_SANDBOX_MODE=true
```

### 4. Database Setup
```bash
npm run prisma:push
```

### 5. Run Verification Tests
```bash
npm test
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Main Dashboard**: `http://localhost:3000/`
- **Developer Debug Console**: `http://localhost:3000/debug`

### 7. Production Build & Start
```bash
npm run build
npm start
```

---

## Multi-Environment Configuration

Generate environment-specific Shopify CLI TOML configs:
```bash
# Generate staging configuration
npm run config:generate staging

# Generate production configuration
node scripts/generate-toml.mjs production shopify.app.prod.toml
```

---

## Attribution & Acknowledgements

The design concepts and functional blueprint of this project are inspired by [shopify-nextjs-prisma-app](https://github.com/kinngh/shopify-nextjs-prisma-app). The codebase is an independent implementation.

---

## License

This project is licensed under the [MIT License](LICENSE).
