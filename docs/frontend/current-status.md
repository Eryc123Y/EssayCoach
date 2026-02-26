# 前端现状分析报告 (Frontend Current Status Report)

> **文档更新日期**: 2026-02-26  
> **分析版本**: Next.js 15.2.8 / React 19 / TypeScript 5.7.2

---

## 📋 执行摘要 (Executive Summary)

> [!CAUTION]
> **Deprecation Notice**: The legacy `dashboard/essay` page and `essay-feedback` feature folder are deprecated.
> All new development should focus on the `Essay Analysis` module (`/dashboard/essay-analysis`), which provides a superior AI-driven experience.

当前前端最初基于 **next-shadcn-dashboard-starter** 模板搭建，现已完成核心业务模块落地（认证、仪表盘、作文分析、Rubrics、Tasks、Classes）。当前处于“持续迭代与体验优化”阶段。

| 维度 | 状态 | 说明 |
|------|------|------|
| 技术栈 | ✅ 现代化 | Next.js 15 + React 19 + TypeScript 5.7 + Tailwind v4 |
| UI 组件库 | ✅ 完备 | 50+ shadcn/ui 组件可用 |
| 认证框架 | ✅ 已对接 | 已对接 Django API，基于 JWT Cookie 和刷新机制 |
| EssayCoach 页面 | ✅ 核心已实现 | 已覆盖 Essay Analysis、Rubrics、Tasks、Classes、Profile、Settings |
| 状态管理 | ⚠️ 基础实现 | 已有 Zustand `authStore`，业务域 store 仍可继续拆分 |
| API 集成 | ✅ 持续完善 | 已启用 `/api/v2` 代理与版本切换配置，覆盖认证与核心业务接口 |

---

## 🏗️ 技术栈详情 (Technology Stack)

### 核心依赖

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.3.2 | 全栈 React framework (App Router) |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.7.3 | Type safety |
| **Tailwind CSS** | 4.0.17 | CSS framework (OKLCH color space) |
| **shadcn/ui** | 2.5.0 | UI component library (based on Radix) |
| **Zustand** | 5.0.3 | State management |
| **Framer Motion** | 12.0.0 | Animations (`motion/react`) |
| **Recharts** | 2.15.0 | Data visualization |
| **nuqs** | 2.4.3 | URL state management |
| **next-themes** | 0.4.6 | 深色/浅色主题切换 |
| **kbar** | 0.1.0-beta.49 | 命令面板 (Cmd+K) |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | - | 包管理器 |
| **ESLint** | 9.x | 代码检查 |
| **Prettier** | 3.5.3 | 代码格式化 |
| **Husky** | 9.1.7 | Git hooks |

---

## 📁 目录结构 (Directory Structure)

```
frontend/src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # 根布局 (ThemeProvider, Toaster)
│   ├── page.tsx                     # 落地页 (跳转 dashboard)
│   ├── globals.css                  # 全局样式 (Tailwind v4 配置)
│   ├── auth/                        # 认证页面
│   │   ├── sign-in/[[...sign-in]]/  # 登录页
│   │   └── sign-up/[[...sign-up]]/  # 注册页
│   ├── dashboard/                   # 仪表盘
│   │   ├── layout.tsx              # 仪表盘布局 (侧边栏 + 头部)
│   │   ├── page.tsx                # 重定向到 overview
│   │   ├── overview/               # 概览页 (使用 Parallel Routes)
│   │   │   ├── @pie_stats/         # 饼图统计插槽
│   │   │   ├── @bar_stats/         # 柱状图统计插槽
│   │   │   ├── @area_stats/        # 面积图统计插槽
│   │   │   └── @sales/             # 销售数据插槽 (模板遗留)
│   │   ├── essay-analysis/         # 作文分析主流程
│   │   ├── rubrics/                # 评分标准管理
│   │   ├── tasks/                  # 作业任务管理
│   │   ├── classes/                # 班级管理
│   │   └── profile/                # 用户资料
│   └── api/auth/                   # API Routes (认证)
│
├── components/
│   ├── ui/                         # shadcn/ui 组件 (50+ 个)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table/                  # 高级数据表格
│   │   └── ...
│   ├── layout/                     # 布局组件
│   │   ├── app-sidebar.tsx         # 侧边栏
│   │   ├── header.tsx              # 头部
│   │   ├── nav-user.tsx            # 用户导航
│   │   └── theme-toggle.tsx        # 主题切换
│   ├── kbar/                       # 命令面板组件
│   └── modal/                      # 模态框组件
│
├── service/
│   └── api/                        # API 服务层
│       ├── auth.ts                 # 认证 API (已对接 Django v2)
│       └── route.ts                # 路由 API
│
├── hooks/                          # 自定义 Hooks
│   ├── use-sidebar.tsx
│   └── ...
│
├── stores/                         # 状态管理
│   └── authStore.ts                # JWT token 状态与自动刷新
│
├── lib/                            # 工具函数
│   └── utils.ts                    # cn() 等工具
│
├── types/                          # TypeScript 类型定义
│   └── index.ts
│
└── constants/                      # 常量与模拟数据
    └── data.ts                     # 导航项、销售数据 (模板遗留)
```

---

## ⚠️ 现状问题 (Current Issues)

### 1. 模板品牌清理进行中

`app/layout.tsx` 与 `app/dashboard/layout.tsx` 的 metadata 已更新为 EssayCoach 品牌文案。

仍可继续清理的模板遗留项：
- `frontend/package.json` 项目名仍为 `next-shadcn-dashboard-starter`
- 部分示例文案与演示数据仍带模板语义

### 2. API v2 代理默认地址兜底值曾存在拼写错误（已修复）

此前 `frontend/src/app/api/v2/[...path]/route.ts` 的兜底地址写成 `127.0.0.0.1`，在 `NEXT_PUBLIC_API_URL` 缺失时会导致 URL 解析失败。现已修正为 `127.0.0.1`，并增加无效 URL 配置保护。

### 3. 导航与业务页面仍有增量空间

当前导航已不再是模板默认值，已对接 EssayCoach 业务入口（Dashboard、Essay Analysis、Rubrics、Tasks、Classes）。

仍待补充/完善：
- `Analytics` 与部分管理模块页面
- 更细粒度的角色差异化导航策略

### 4. Zustand 状态管理已落地基础能力

项目已实现 `authStore`（JWT token 状态、自动刷新、并发刷新保护），但 essay/rubric/feedback 等业务域 store 仍可按模块继续拆分。

### 5. EssayCoach 核心页面实现情况

| 页面 | 状态 | 关键组件 |
|-----------|---------|-------|
| `/dashboard/essay-analysis` | ✅ 已实现 | `EssaySubmissionForm`, `FeedbackDashboard`, `RevisionChat` |
| `/dashboard/essay` | ✅ 已实现（Legacy） | `EssayForm`, `FeedbackViewer`, `RevisionChat` |
| `/dashboard/rubrics` | ✅ 已实现 | `rubric-list`, `RubricsClient` |
| `/dashboard/tasks` | ✅ 已实现 | `task-list`, `task-form` |
| `/dashboard/classes` | ✅ 已实现 | `class-list`, `join-class-dialog` |
| `/dashboard/analytics` | ❌ 待实现 | - |

#### Essay Analysis 特色功能
- **多维度评分可视化**: 使用 `Recharts` 展示作文的各项得分。
- **动态交互体验**: 使用 `framer-motion` 实现平滑的页面切换和反馈加载动画。
- **实时 Revision Chat**: 支持针对 AI 反馈进行后续对话。

---

## ✅ 可用资产 (Available Assets)

### shadcn/ui 组件库 (50+ 组件)

已安装并可直接使用的组件：

| 类别 | 组件 |
|------|------|
| **表单** | Button, Input, Textarea, Select, Checkbox, Radio, Switch, Form |
| **数据展示** | Card, Table, Badge, Avatar, Progress, Skeleton |
| **反馈** | Alert, Toast, Dialog, Popover, Tooltip |
| **导航** | Tabs, Breadcrumb, Pagination, Dropdown Menu |
| **布局** | Separator, ScrollArea, Collapsible, Sidebar |
| **高级** | Data Table (筛选、排序、分页), Command (命令面板) |

### 主题系统

Tailwind v4 配置支持深色/浅色模式：

```css
/* globals.css */
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... 完整的 OKLCH 色彩系统 */
}
```

### 认证中间件

路由保护已就位：

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

---

## 📋 实施计划 (Implementation Plan)

### Phase 1: 基础对接 (P0 - 1-2 周)

1. **清理模板品牌**
   - [ ] 更新 metadata (title, description)
   - [ ] 更新导航项为 EssayCoach 相关
   - [ ] 移除无关页面 (product, kanban)

2. **API 层重构**
   - [x] 提供统一请求封装与 `/api/v2` 代理路由
   - [x] 实现 `frontend/src/service/api/auth.ts` 并对接 Django auth 端点
   - [x] 配置环境变量 `NEXT_PUBLIC_API_URL`
   - [ ] 继续补齐更细粒度的业务 service 抽象（按模块）

3. **状态管理**
   - [x] 创建 `stores/authStore.ts` - 认证状态
   - [ ] 创建 `stores/essay-store.ts` - 作文状态
   - [ ] 创建 `stores/rubric-store.ts` - Rubric 状态
   - [ ] 实现业务域状态持久化策略 (localStorage/cookies)

### Phase 2: 核心功能 (P0 - 2-3 周)

4. **作文管理页面**
   - [ ] `/dashboard/essays/page.tsx` - 作文列表 (数据表格)
   - [ ] `/dashboard/essays/[id]/page.tsx` - 作文详情
   - [ ] `/dashboard/essays/new/page.tsx` - 提交作文表单

5. **AI 反馈展示**
   - [ ] `components/feedback/feedback-panel.tsx` - 反馈面板
   - [ ] `components/feedback/score-breakdown.tsx` - 分数分解
   - [ ] `components/feedback/suggestion-list.tsx` - 建议列表

### Phase 3: 进阶功能 (P1 - 2-3 周)

6. **评分标准管理**
   - [x] `/dashboard/rubrics/page.tsx` - 评分标准列表
   - [x] `/dashboard/rubrics/[id]/page.tsx` - 标准详情/编辑

7. **数据分析**
   - [ ] `/dashboard/analytics/page.tsx` - 分析仪表盘
   - [ ] 复用现有图表组件 (Recharts)

### Phase 4: 优化 (P2)

8. **用户体验**
   - [ ] 实现乐观更新
   - [ ] 添加 loading 骨架屏
   - [ ] 实现错误边界

9. **测试**
   - [ ] 单元测试 (Vitest)
   - [ ] E2E 测试 (Playwright)

---

## 🔗 参考文档

- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [shadcn/ui 组件](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Zustand 状态管理](https://zustand-demo.pmnd.rs/)
- [Django 后端 API 文档](../backend/serializers-views.md)
- [系统架构](../architecture/system-architecture.md)

---

## 📊 文档对照表

| 现有文档 | 内容类型 | 备注 |
|---------|---------|------|
| `docs/frontend/component-structure.md` | 计划架构 | 描述目标结构，非当前实现 |
| `docs/frontend/api-integration.md` | 计划架构 | API 示例代码，待实际实现 |
| `docs/frontend/state-management.md` | 计划架构 | Zustand 示例，待实际实现 |
| **本文档** | **实际状态** | 描述当前真实状态与差距 |

---

*本文档由 AI 代理自动生成，基于对 `frontend/` 目录的实际分析。*
