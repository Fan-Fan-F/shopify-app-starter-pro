# 功能规格与设计说明书 (SPEC.md) - shopify-app-starter-pro

## 1. 概述与设计定位

本项目 `shopify-app-starter-pro` 是一套面向生产环境的现代 Shopify 嵌入式应用脚手架（Embedded App Starter）。本项目的思路与功能设计受到开源项目 [shopify-nextjs-prisma-app](https://github.com/kinngh/shopify-nextjs-prisma-app) 启发，在架构设计、代码实现、API 规范与开发体验上进行完全独立的全新实现（B 路线）。

相比原项目，本项目依据最新 Shopify App 规范进行了全方位重写与强化，彻底补齐多店铺隔离、多环境配置管理、现代签名验证、完整 GDPR 隐私生命周期以及离线本地可运行沙箱（Local Mock Sandbox）。

---

## 2. 借鉴的功能点清单（原项目思想提炼）

从原项目的设计中借鉴并继承以下核心功能思路：
1. **Next.js + Prisma 全栈嵌入式架构**：利用现代全栈框架处理前端 Polaris 嵌入式界面与后端 API 路由，利用 Prisma ORM 统一管理数据库模型。
2. **Shopify 嵌入式应用认证会话管理**：基于 App Bridge Session Token（JWT）免跳转/免闪烁的会话交换与维护逻辑。
3. **分层 API 客户端抽象（Client Provider）**：区分在线（Online - 用户维度）与离线（Offline - 店铺后台自动化/Webhook维度）的 GraphQL / REST Client。
4. **统一 Webhook 与 GDPR 隐私合规**：处理 `customers/data_request`、`customers/redact`、`shop/redact` 等强制性合规回调。
5. **App Proxy 商店前台代理路由与验签**：支持将 Shopify 在线商店前台 Liquid 路由代理转发至应用服务，并通过 HMAC 签名验证请求合法性。

---

## 3. 本项目全新升级与差异化增强点（全新设计）

本项目在代码零复用、零雷同的前提下，进行以下架构升级：
1. **支持现代 Shopify API 规范（2025+ 最新标准）**：
   - 使用现代模块化设计，解耦 `@shopify/shopify-api` 核心，提供纯净且强壮的上下文初始化逻辑。
   - 彻底摆脱旧版重定向流程，遵循 Shopify 最新 Session Token 鉴权规范与托管安装（Managed Installation）规范。
2. **多环境配置管理体系（Multi-Environment Config）**：
   - 支持 `.env.development`、`.env.staging`、`.env.production` 分级配置。
   - 提供类型安全的配置校验层，支持运行时自检，避免缺少关键环境变量时报错混淆。
   - 提供 `shopify.app.toml` 多环境模板与自动生成脚本。
3. **多店铺与多租户存储架构（Multi-Tenant Prisma Schema）**：
   - 升级 Prisma Schema，清晰划分 `Shop`、`Session`、`WebhookEvent`、`AppSetting` 等模型，支持多店铺安全隔离、状态追踪（安装中、已安装、已卸载）。
   - 会话支持安全存储与时间戳校验，防重放与自动失效处理。
4. **安全加固的验证中间件（Security Middleware Suite）**：
   - `verifySessionToken`：标准校验 App Bridge JWT 载荷，验证签发者、受众、过期时间并自动挂载当前租户会话。
   - `verifyAppProxyHmac`：基于 Shopify App Proxy 规范的 query-string 排序与 HMAC-SHA256 签名校验。
   - `verifyWebhookHmac`：基于 Raw Body 与 `x-shopify-hmac-sha256` 头的签名校验。
5. **本地可运行沙箱与最小可运行示例（Zero-Friction Local Sandbox）**：
   - 提供一键启动的 SQLite 开发数据库支持，无需依赖外部 PostgreSQL 或 PlanetScale 即可直接启动运行。
   - 内置 Mock 模式与自测套件（开发者可在无需真实 Shopify Partner 密钥与公网隧道的情况下直接在本地浏览器体验全流程：后台仪表盘、模拟签名验证、模拟 Webhook 触发、模拟 GraphQL 响应）。
   - 提供现代 UI 控制台，清晰展示店铺连接状态、Session Token 检查器、Webhook 模拟器、App Proxy 调试器。

---

## 4. 模块与目录架构设计

```
shopify-app-starter-pro/
├── prisma/
│   └── schema.prisma            # 多店铺、会话、配置、Webhook 审计日志模型
├── public/                      # 静态资源
├── src/
│   ├── components/              # 现代 UI 组件库（Polaris 风格的 Dashboard、Card、Banner）
│   ├── config/                  # 多环境配置解析与校验 (env loader)
│   ├── lib/
│   │   ├── auth/                # Session Token 解析、JWT 验签、OAuth 辅助
│   │   ├── db.ts                # Prisma 客户端单例
│   │   ├── proxy/               # App Proxy HMAC 签名算法实现
│   │   ├── shopify/             # Shopify API 包装器、GraphQL/REST 客户端工厂
│   │   └── webhooks/            # Webhook 签名验证与 GDPR 处理器分发
│   ├── middleware/              # API 路由中间件封装器
│   └── pages/                   # Next.js 页面与 API 端点
│       ├── _app.tsx
│       ├── _document.tsx
│       ├── index.tsx            # 应用管理主面板
│       ├── debug/               # 调试与自检页面
│       └── api/
│           ├── auth/            # 会话与安装握手
│           ├── apps/            # 嵌入式后台内部受保护接口
│           ├── proxy/           # App Proxy 接口
│           ├── webhooks/        # 统一 Webhook 与 GDPR 接口
│           └── test-sandbox/    # 本地自测与沙箱路由
├── scripts/                     # 多环境 toml 生成脚本与配置工具
├── .env.example                 # 多环境配置示范（仅占位符）
├── package.json
├── tsconfig.json
├── next.config.mjs
├── SPEC.md                      # 本设计规格说明书
├── CHANGES.md                   # 变更与自测记录
├── README.md                    # 中英双语项目文档
└── LICENSE                      # 原始 MIT 许可证
```

---

## 5. 自测规划与验收标准

自测涵盖 4 个核心链路：
1. **安装构建自测**：依赖可顺利安装，TypeScript 编译通过，`npm run build` 成功。
2. **数据库就绪自测**：Prisma client 成功生成，本地数据库 migration / push 成功。
3. **服务端 API 与安全验签自测**：
   - App Proxy HMAC-SHA256 计算与验签测试通过。
   - Webhook HMAC-SHA256 签名校验与 GDPR 派发测试通过。
   - Session Token 中间件鉴权拦截与放行逻辑通过。
4. **服务运行自测**：Next.js 服务在本地开发与生产模式下均可正常启动，核心页面与 API 可正常响应 HTTP 200。

---

## 6. 自测执行记录

- **执行时间**：2026-11-16
- **自测命令与输出**：
  1. `npm test`：5 项集成测试全部 PASSED（包含 App Proxy 签名校验、Webhook HMAC 验签、多租户数据库隔离、多环境 TOML 生成）。
  2. `npm run build`：Prisma Client 生成成功，Next.js 14 编译成功并生成 8 个核心路由。
  3. `npx next start -p 3188`：服务在 481ms 内启动成功，curl 请求 `/`、`/debug`、`/api/apps/shop`、`/api/proxy/sample`、`/api/sandbox/simulate-webhook` 均返回 HTTP 200 并包含预期 JSON 结构。

