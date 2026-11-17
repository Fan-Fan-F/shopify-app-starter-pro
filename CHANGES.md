# 变更与重写说明 (CHANGES.md) - shopify-app-starter-pro

本项目根据 **B 路线（按思路完全重写）** 进行独立开发。代码全部从零编写，完全移除了旧项目的全部代码实现，并依据 Shopify 最新规范与生产实践进行了深度重构与功能增强。

---

## 一、核心重构与升级维度

### 1. 规范升级（Shopify 2025+ 最新规范）
- **会话与鉴权**：废除旧版的重定向与 ExitFrame 流程，采用 Shopify 官方推荐的 App Bridge CDN + Session Token（JWT Bearer）无闪烁认证流。
- **现代化 Client Provider**：全新实现的 `shopifyClients` 门面工厂，清晰解耦 `online`（用户会话维度）与 `offline`（店铺后台/自动化任务维度）的 GraphQL / REST 请求上下文。
- **强制隐私合规（GDPR）与统一 Webhook**：内置对 `customers/data_request`、`customers/redact`、`shop/redact` 规范回调的处理分发与数据库审计追踪。

### 2. 补齐多店铺与多环境配置（TASK.md 核心诉求）
- **多租户数据模型**：Prisma Schema 重构，提供 `Shop`（多租户状态与元信息）、`Session`（按店铺与会话类型索引）、`WebhookEvent`（审计流水）、`AppSetting`（店铺配置隔离）。
- **多环境 CLI 配置自动化**：编写 `scripts/generate-toml.mjs`，支持一键针对 `development`、`staging`、`production` 动态生成合规的 `shopify.app.<env>.toml`。
- **类型安全的环境变量加载器**：封装 `src/config/env.ts`，自动校验与提示环境参数。

### 3. 本地开箱即用沙箱（Local Developer Sandbox）
- **零配置 SQLite 引擎**：开发环境下默认使用嵌入式 SQLite 数据库（`DATABASE_URL="file:./dev.db"`），彻底摆脱本地繁琐的外部数据库配置。
- **离线沙箱模拟模式（Mock Mode）**：无需配置真实 Shopify Partner 密钥与公网隧道，即可在本地直接运行完整的控制台仪表盘、执行 GraphQL 查询测试、模拟 App Proxy HMAC 签名校验、一键触发 Webhook 测试。

### 4. 代码安全与工程质量加固
- **时序攻击防御**：所有 HMAC 校验（App Proxy 和 Webhooks）均强制使用 Node.js 原生 `crypto.timingSafeEqual`。
- **TypeScript 全栈类型安全**：消除类型隐患，清晰定义会话、请求、响应接口。

---

## 二、自测记录

### 1. 自动化集成与安全测试
- **执行命令**：`npm test`（调用 `test/run-tests.mjs`）
- **测试结果**：5 项全部通过（5 passed, 0 failed）
  1. `[TEST] App Proxy HMAC Calculation & Timing-safe Verification ... PASSED`
  2. `[TEST] Webhook HMAC-SHA256 Base64 Signature Verification ... PASSED`
  3. `[TEST] Shop Domain Canonical Normalization ... PASSED`
  4. `[TEST] Dynamic shopify.app.toml generation for Staging & Production ... PASSED`
  5. `[TEST] Prisma Multi-Tenant Shop & Session Storage ... PASSED`

### 2. 生产环境构建编译
- **执行命令**：`npm run build`
- **构建结果**：Prisma Client (v5.22.0) 生成完毕，Next.js 14 编译成功（`Compiled successfully`），页面路由与所有 API 端点顺利打包。

### 3. 本地运行与端到端核心端点验证
- **服务启动**：`npx next start -p 3188`（Ready in 481ms）
- **路由探测结果**：
  - `GET /` -> HTTP 200（Dashboard 管理主页加载成功）
  - `GET /debug` -> HTTP 200（开发者自检与沙箱控制台）
  - `GET /api/apps/shop` -> HTTP 200（返回商户元数据与模拟 GraphQL 查询结果）
  - `GET /api/proxy/sample?format=json` -> HTTP 200（返回 App Proxy 校验与结构体）
  - `POST /api/sandbox/simulate-webhook` -> HTTP 200（完成 HMAC 计算、分发、写入 WebhookEvent 审计表）
  - `POST /api/apps/graphql` -> HTTP 200（返回产品列表模拟 GraphQL 查询结果）
