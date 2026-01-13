# 前端现状分析报告 (Frontend Current Status Report)

> **文档更新日期**: 2026-01-13  
> **分析版本**: Next.js 15.3.2 / React 19 / TypeScript 5.7

---

## 📋 执行摘要 (Executive Summary)

> [!CAUTION]
> **Deprecation Notice**: The legacy `dashboard/essay` page and `essay-feedback` feature folder are deprecated.
> All new development should focus on the `Essay Analysis` module (`/dashboard/essay-analysis`), which provides a superior AI-driven experience.

当前前端基于 **next-shadcn-dashboard-starter** 模板搭建，拥有完整的技术基础设施，但 **EssayCoach 特定功能尚未实现**。前端处于"脚手架完成、业务待开发"阶段。

| 维度 | 状态 | 说明 |
|------|------|------|
| 技术栈 | ✅ 现代化 | Next.js 15 + React 19 + TypeScript 5.7 + Tailwind v4 |
| UI 组件库 | ✅ 完备 | 50+ shadcn/ui 组件可用 |
| 认证框架 | ✅ 已对接 | 使用 `simple-auth-context.tsx` 实现基础认证对接 |
| EssayCoach 页面 | ⚠️ 部分实现 | 已实现 `Essay Analysis` (作文分析) 核心页面 |
| 状态管理 | ⚠️ 基础实现 | 使用 React State 和 Context，Zustand 待进一步深度集成 |
| API 集成 | ⚠️ 部分对接 | 已对接 `Dify` 工作流运行接口 |

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
│   │   ├── product/                # 产品管理 (模板遗留，非 EssayCoach)
│   │   ├── kanban/                 # 看板页面 (模板遗留)
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
│       ├── auth.ts                 # 认证 API (通用，未对接 Django)
│       └── route.ts                # 路由 API
│
├── hooks/                          # 自定义 Hooks
│   ├── use-sidebar.tsx
│   └── ...
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

### 1. 模板品牌未清理

多处仍保留原模板信息：

```tsx
// app/layout.tsx - Line 19-22
export const metadata: Metadata = {
  title: 'Next Shadcn',  // ❌ 应改为 EssayCoach
  description: 'Basic dashboard with Next.js and Shadcn'
};

// app/dashboard/layout.tsx - Line 19
title: 'Next Shadcn Dashboard Starter'  // ❌ 应改为 EssayCoach Dashboard
```

### 2. 导航项为模板默认值

```typescript
// constants/data.ts
export const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard/overview' },
  { title: 'Product', url: '/dashboard/product' },    // ❌ 模板遗留
  { title: 'Kanban', url: '/dashboard/kanban' },      // ❌ 模板遗留
  // 缺失: Essays, Feedback, Rubrics, Analytics 等
];
```

### 3. API 层未对接 Django 后端

当前 `service/api/auth.ts` 使用通用端点：

```typescript
// service/api/auth.ts
export const fetchLogin = (data: LoginParams) => {
  return request.post<AuthResponse>('/auth/login', data);  // ❌ 应为 /api/auth/login/
};
```

Django 后端实际端点 (参考 `backend/core/views.py`):
- `POST /api/auth/login/` - 登录
- `POST /api/auth/register/` - 注册
- `GET /api/essays/` - 获取作文列表
- `POST /api/essays/` - 提交作文

### 4. Zustand Stores 未实现

尽管 `zustand` 已安装，但项目中无任何 store 实现：

```bash
$ find frontend/src -name "*store*" -o -name "*state*" | wc -l
0
```

需要创建的 stores:
- `useAuthStore` - 认证状态
- `useEssayStore` - 作文数据
- `useFeedbackStore` - AI 反馈
- `useRubricStore` - 评分标准

### 5. EssayCoach 核心页面实现情况

| 页面 | 状态 | 关键组件 |
|-----------|---------|-------|
| `/dashboard/essay-analysis` | ✅ 已实现 | `EssaySubmissionForm`, `FeedbackDashboard`, `RevisionChat` |
| `/dashboard/essays` | ❌ 不存在 | - |
| `/dashboard/essays/[id]` | ❌ 不存在 | - |
| `/dashboard/feedback/[id]` | ❌ 不存在 | - |
| `/dashboard/rubrics` | ❌ 不存在 | - |
| `/dashboard/analytics` | ❌ 不存在 | - |

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
   - [ ] 创建 `frontend/src/lib/api-client.ts` - Axios 实例配置
   - [ ] 实现 `services/auth.service.ts` - 对接 Django auth 端点
   - [ ] 实现 `services/essay.service.ts` - 对接 Django essay 端点
   - [ ] 配置环境变量 `NEXT_PUBLIC_API_URL`

3. **状态管理**
   - [ ] 创建 `stores/auth-store.ts` - 认证状态
   - [ ] 创建 `stores/essay-store.ts` - 作文状态
   - [ ] 实现持久化 (localStorage/cookies)

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
   - [ ] `/dashboard/rubrics/page.tsx` - 评分标准列表
   - [ ] `/dashboard/rubrics/[id]/page.tsx` - 标准详情/编辑

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
