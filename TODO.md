# EssayCoach 开发 TODO

> **最后更新**: 2026-02-03
> **当前版本**: v2.0.0 (v2-only migration target)
> **总任务数**: 40+
> **预估总工时**: ~120 小时

---

## 📊 优先级定义

| 优先级 | 描述                    | 紧急程度    | 预估工时 |
| ------ | ----------------------- | ----------- | -------- |
| **P0** | 阻塞性问题/核心功能缺失 | 🔴 Critical | ~20h     |
| **P1** | 高优先级，本周完成      | 🟠 High     | ~35h     |
| **P2** | 中优先级，本月完成      | 🟡 Medium   | ~25h     |
| **P3** | 低优先级，有时间再做    | 🟢 Low      | ~40h     |

---

## 🔴 P0 - 阻塞性问题（立即处理）

### 1. Sentry 配置修复

**文件**: `frontend/next.config.ts:28`
**类型**: FIXME
**工时**: 15 分钟

```typescript
// FIXME: Add your Sentry organization and project names
```

**任务**:

- [ ] 添加真实的 Sentry organization 和 project 名称
- [ ] 配置生产环境 Sentry DSN

---

### 2. JWT Token Refresh 机制

**模块**: 认证安全  
**工时**: 14 小时  
**关联**: `ARCHITECTURE_TODO.md Phase 1`

#### 后端任务

- [ ] **实现 JWT Refresh Token Endpoint**（4h）
  - [ ] 创建 `auth/views.py` 中的 `refresh_token` 函数
  - [ ] 验证 refresh token 有效性
  - [ ] 生成新的 access token
  - [ ] 设置过期时间（24h access, 7d refresh）
  - [ ] 添加 refresh token 轮换机制
  - [ ] 添加单元测试

- [ ] **配置 Django JWT Settings**（1h）
  - [ ] 更新 `essay_coach/settings.py` 添加 JWT 配置
  - [ ] 配置 SIMPLE_JWT 参数
  - [ ] 添加 BLACKLISTED_REFRESH_TOKENS 机制

#### 前端任务

- [ ] **实现自动 Token Refresh**（4h）
  - [ ] 创建 `frontend/src/hooks/useAuthRefresh.ts`
  - [ ] 检查 token 是否即将过期（<5分钟）
  - [ ] 自动调用 refresh endpoint
  - [ ] 处理 refresh token 过期（强制重新登录）
  - [ ] 添加错误处理（401 → logout）

- [ ] **迁移到 Zustand 状态管理**（4h）
  - [ ] 创建 `frontend/src/store/authStore.ts`
  - [ ] 实现 auth state：user, accessToken, refreshToken, isAuthenticated
  - [ ] 添加 actions：login, logout, refresh, updateUser
  - [ ] 迁移所有组件到 Zustand
  - [ ] 删除旧的 `SimpleAuthContext`

- [ ] **完善 HttpOnly Cookie 安全**（1h）
  - [ ] 验证 API 调用不通过 JavaScript 访问 token
  - [ ] 添加 SameSite: strict 属性
  - [ ] 添加 Secure: true（生产环境）

**验收标准**:

- Token 自动刷新，用户无感知
- Refresh token 有效期 > 7 天
- 登出清除所有 Token 和 Cookie
- 单元测试覆盖率 > 80%

---

### 3. RevisionChat 后端集成 ⭐⭐⭐

**模块**: Essay Analysis Results Page  
**工时**: 8 小时  
**关联**: `TODO_ESSAY_ANALYSIS_RESULTS.md`

**问题**: 当前使用硬编码的模拟数据，无法与后端AI进行实际对话

**当前代码** (`frontend/src/features/essay-analysis/components/revision-chat.tsx:18-25`):

```typescript
const MOCK_MESSAGES: Message[] = [
  { id: "1", role: "assistant", content: "Hi! I've analyzed your essay..." },
];
```

**任务**:

- [ ] **后端 API**（4h）
  - [ ] 创建 `backend/api_v2/ai_feedback/views.py` ChatView
  - [ ] 创建 `backend/api_v2/ai_feedback/chat.py` 聊天逻辑
  - [ ] 实现端点: `POST /api/v2/ai-feedback/chat/`

- [ ] **前端集成**（4h）
  - [ ] 修改 `RevisionChat` 接收 `essayId` 和 `context` props
  - [ ] 实现真实 API 调用
  - [ ] 添加加载状态和错误处理
  - [ ] 实现打字机效果显示 AI 回复

**验收标准**:

- [ ] 用户可以发送消息
- [ ] AI 基于 essay 内容回复
- [ ] 加载状态正确显示
- [ ] 错误时有友好提示

---

### 4. 代码级问题修复

#### 4.1 Logout 异常处理

**文件**: `backend/api_v2/auth/views.py`（v2 auth logout）
**问题**: 静默捕获所有异常，应该记录日志

```python
except Exception:
    pass  # ❌ 应该记录错误
```

**任务**:

- [ ] 添加适当的错误日志记录
- [ ] 区分可恢复和不可恢复错误

#### 4.2 Login Schema 异常（v2）

**文件**: `backend/api_v2/auth/schemas.py`（v2 auth login schema）
**问题**: 用户不存在时静默处理

```python
except User.DoesNotExist:
    pass  # ❌ 应该处理或记录
```

**任务**:

- [ ] 审查并添加适当的错误处理

---

## 🟠 P1 - 高优先级（本周内完成）

### 5. 生产部署基础设施

**工时**: 14 小时  
**关联**: `ARCHITECTURE_TODO.md Phase 3`

#### 5.1 Docker 容器化

- [ ] **后端 Dockerfile**（2h）

  ```dockerfile
  FROM python:3.12-slim
  WORKDIR /app
  COPY backend/requirements.txt .
  RUN pip install -r requirements.txt
  COPY backend/ /app
  EXPOSE 8000
  CMD ["gunicorn", "essay_coach.wsgi:application", "--bind", "0.0.0.0:8000"]
  ```

- [ ] **前端 Dockerfile**（2h）

  ```dockerfile
  FROM node:22-alpine
  WORKDIR /app
  COPY frontend/package*.json ./
  RUN npm ci --only=production
  COPY frontend/ ./
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

- [ ] **生产环境配置**（2h）
  - [ ] 创建 `.env.production` 模板
  - [ ] 创建 `backend/essay_coach/settings_production.py`
  - [ ] 创建 `frontend/.env.production` 模板

#### 5.2 容器编排

- [ ] **docker-compose.prod.yml**（4h）
  - [ ] PostgreSQL 服务配置
  - [ ] Backend 服务配置
  - [ ] Frontend 服务配置
  - [ ] Networks 网络隔离
  - [ ] Volumes 数据持久化

#### 5.3 Nginx 反向代理

- [ ] **Nginx 配置**（4h）
  - [ ] 创建 `docker/nginx/nginx.conf`
  - [ ] 配置 SSL/TLS（Let's Encrypt）
  - [ ] 配置反向代理规则
  - [ ] 添加 Gzip 压缩
  - [ ] 配置缓存策略
  - [ ] 添加健康检查端点

**验收标准**:

- `docker-compose -f docker-compose.prod.yml up` 启动所有服务
- 所有服务健康检查通过
- HTTPS 正常工作
- 可以一键部署到服务器

---

### 6. PDF 导出功能 ⭐⭐

**模块**: Essay Analysis Results Page  
**工时**: 4 小时

**问题**: Results 页面"Export PDF"按钮无功能

**当前代码** (`frontend/src/app/dashboard/essay-analysis/page.tsx:308`):

```typescript
<Button variant='outline'>Export PDF</Button>
```

**任务**:

- [ ] 安装依赖: `pnpm add @react-pdf/renderer`
- [ ] 创建 `frontend/src/features/essay-analysis/components/FeedbackPDF.tsx`
- [ ] 创建 `frontend/src/hooks/useExportPDF.ts`
- [ ] 实现 PDF 生成逻辑
- [ ] 添加导出按钮事件处理

**验收标准**:

- [ ] 点击生成 PDF 文件
- [ ] PDF 包含：标题、评分、详细反馈、改进建议
- [ ] PDF 格式美观，符合 Academic Precision 设计
- [ ] 下载文件名合理

---

### 7. 认证安全加固（补充）

**工时**: 9 小时  
**关联**: `ARCHITECTURE_TODO.md Phase 1-2`

- [ ] **去除客户端 Token 读取**（2h）
  - [ ] 移除 `frontend/src/service/request.ts` 的 `document.cookie` 访问
  - [ ] 更新 `frontend/src/app/api/v2/[...path]/route.ts`
  - [ ] 创建 `frontend/src/middleware.ts` 添加 Cookie 自动传递

- [ ] **请求拦截器标准化**（4h）
  - [ ] 创建 `frontend/src/service/api-client.ts`
  - [ ] 实现请求拦截器（注入 headers）
  - [ ] 实现响应拦截器（处理 401）
  - [ ] 错误处理标准化
  - [ ] 重试逻辑

- [ ] **中间件路由保护**（3h）
  - [ ] 定义受保护路由列表
  - [ ] 验证 access_token Cookie 存在
  - [ ] Token 过期验证
  - [ ] 无效 Token 自动重定向到 `/auth/sign-in`

---

## 🟡 P2 - 中优先级（本月内完成）

### 8. API 性能优化

**工时**: 2 小时  
**关联**: `ARCHITECTURE_TODO.md Phase 3.1`

- [ ] **移除 Next.js API 代理层**
  - [ ] 修改 `frontend/src/service/request.ts` 直接调用后端 API
  - [ ] 配置 `NEXT_PUBLIC_API_URL` 环境变量
  - [ ] 移除 `frontend/src/app/api/v2/[...path]/route.ts`
  - [ ] 更新 CORS 配置允许跨域访问
  - [ ] 性能测试：对比代理前后延迟（目标：<50ms）

### 9. 文档完善

**工时**: 3 小时

- [ ] **AGENTS.md**（1h）
  - [ ] 创建或定位文件
  - [ ] 描述 Sisyphus 架构师角色
  - [ ] 列出可用的子代理

- [ ] **API 文档更新**（1h）
  - [ ] 更新 `docs/api-reference/endpoints.md`
  - [ ] 添加每个 endpoint 的示例

- [ ] **部署文档**（1h）
  - [ ] 创建 `docs/deployment.md`
  - [ ] 创建 `docs/environment-setup.md`

### 10. 监控和日志

**工时**: 4 小时

- [ ] **应用日志配置**（2h）
  - [ ] 配置 Python logging
  - [ ] 添加结构化日志（JSON 格式）
  - [ ] 配置日志轮转
  - [ ] 敏感信息过滤

- [ ] **错误追踪集成**（2h）
  - [ ] 配置 Sentry（后端集成）
  - [ ] 添加性能监控
  - [ ] 配置告警规则

### 11. Save to Portfolio ⭐

**模块**: Essay Analysis Results Page  
**工时**: 2 小时

**问题**: "Save to Portfolio"按钮无功能

**任务**:

- [ ] 后端: `backend/api_v2/core/views.py` SubmissionViewSet 新增 action
- [ ] 前端: `frontend/src/service/api/submission.ts` 新增 save 函数
- [ ] 实现端点: `POST /api/v2/core/submissions/{id}/save/`

### 12. Apply Fix 功能 ⭐

**模块**: Essay Analysis Results Page  
**工时**: 4 小时

**问题**: InsightsList 中的"Apply Fix"按钮只有 UI

**任务**:

- [ ] 方案 B（推荐）: 显示修改建议，让用户决定是否应用
- [ ] 修改 `frontend/src/features/essay-analysis/components/InsightsList.tsx`
- [ ] 创建 `frontend/src/hooks/useApplyFix.ts`

---

## 🟢 P3 - 低优先级（有时间再做）

### 13. 多 AI 提供商支持

**工时**: 8 小时

- [ ] **LangChain 适配器**（4h）
  - [ ] 基于 `EssayAgentInterface` 实现
  - [ ] 创建配置系统（可切换 AI 提供商）
  - [ ] 添加成本追踪功能

- [ ] **UI 切换**（2h）
  - [ ] 设置页面添加 AI 提供商选择
  - [ ] 显示当前使用的提供商
  - [ ] 添加定价信息

- [ ] **文档**（2h）
  - [ ] AI 提供商集成指南

### 14. 国际化支持

**工时**: 12 小时

- [ ] **中文语言支持**（6h）
  - [ ] 安装 `next-intl`
  - [ ] 创建 `frontend/messages/zh.json`
  - [ ] 翻译核心界面文本

- [ ] **教育内容翻译**（6h）
  - [ ] 翻译文档
  - [ ] 翻译提示信息
  - [ ] 翻译错误消息
  - [ ] 添加语言切换器

### 15. 高级分析功能

**工时**: 16 小时

- [ ] **学生进步追踪**（4h）
  - [ ] 作业历史对比功能
  - [ ] 技能趋势可视化（雷达图对比）
  - [ ] 学习进度统计
  - [ ] 生成学习报告（PDF）

- [ ] **班级分析**（4h）
  - [ ] 整体班级表现分析
  - [ ] 常见错误类型统计
  - [ ] 优秀作业展示

- [ ] **数据导出**（4h）
  - [ ] 支持 Excel/CSV 导出
  - [ ] PDF 报告生成
  - [ ] 批量导出功能

- [ ] **文档和测试**（4h）

### 16. Essay Analysis 优化功能

**工时**: 6 小时

- [ ] **聊天上下文感知**（4h）
  - [ ] 将 essay 内容传递给 Chat 组件
  - [ ] 在系统提示中包含 essay 分析结果

- [ ] **响应式优化**（2h）
  - [ ] 移动端聊天全屏模式
  - [ ] 平板优化布局

### 17. 可选优化（Month 2+）

**关联**: `ARCHITECTURE_TODO.md Phase 4`

- [ ] **缓存策略（Redis）**（8h）
  - API 响应缓存
  - Token 黑名单存储
  - Session 存储

- [ ] **API 限流和监控**（12h）
  - 防止暴力攻击
  - Prometheus/Grafana 集成

- [ ] **OAuth 集成**（16h）
  - Google/GitHub 单点登录

- [ ] **移动端 App**（40h+）
  - React Native vs Flutter 技术选型
  - 离线优先级评估

---

## 🔧 P4 - API v2 Only（清理与巩固）

**目标**: 后端 API 全面采用 Django Ninja（v2），移除所有 v1/DRF 兼容路径，不保留任何兼容  
**关键收益**: 更简洁的维护成本、更一致的 API 体验、更清晰的文档边界

- [ ] **移除 v1 代码与路由**（4h）
  - [ ] 删除 `api_v1` 路由注册
  - [ ] 清理 v1 相关的 URL 配置与文档说明
  - [ ] 确认所有客户端调用均为 `/api/v2/*`

- [ ] **依赖与配置清理**（2h）
  - [ ] 从 `pyproject.toml` 移除 DRF 依赖
  - [ ] 清理 DRF 专属配置（`settings.py`）
  - [ ] 更新环境变量与部署说明（只保留 v2）

- [ ] **回归验证**（2h）
  - [ ] 完整回归测试（v2）
  - [ ] Swagger/OpenAPI 文档一致性检查
  - [ ] 性能基准与稳定性验收

---

## 📈 进度追踪

### 本周（Week 1）- 认证安全

- [ ] P0-2: JWT Refresh 机制（后端）
- [ ] P0-2: JWT Refresh 机制（前端自动刷新）
- [ ] P0-2: Zustand 状态管理迁移
- [ ] P0-3: RevisionChat 后端集成

**目标**: 完成 P0 所有任务  
**预计完成时间**: 2026-02-07

---

### Week 2 - 部署准备

- [ ] P1-5: Docker 容器化
- [ ] P1-5: docker-compose.prod.yml
- [ ] P1-6: PDF 导出功能

**目标**: 完成生产部署基础设施  
**预计完成时间**: 2026-02-14

---

### Week 3-4 - 功能完善

- [ ] P1-7: 认证安全加固（补充）
- [ ] P2-8: API 性能优化
- [ ] P2-9: 文档完善
- [ ] P2-11: Save to Portfolio
- [ ] P2-12: Apply Fix

**目标**: 完成中优先级任务  
**预计完成时间**: 2026-02-28

---

## 🎯 里程碑

### v2.0.0 - 当前版本（v2-only migration target）

- ✅ 核心功能完整（AI 论文分析）
- ✅ 基础认证系统
- ✅ 教师仪表板
- ✅ 前端和后端分离架构

### v2.1.0 - 认证安全 + 核心功能（预计 2026-02-07）

- [ ] JWT refresh token 机制
- [ ] 自动 token 刷新
- [ ] Zustand 状态管理
- [ ] RevisionChat 后端集成
- [ ] 安全测试覆盖

### v2.2.0 - 生产就绪（预计 2026-02-21）

- [ ] Docker 容器化部署
- [ ] Nginx 反向代理
- [ ] PDF 导出功能
- [ ] 生产环境配置

### v2.3.0 - 功能增强（预计 2026-03-15）

- [ ] 多 AI 提供商支持
- [ ] 国际化支持（中文）
- [ ] 高级分析功能
- [ ] API 性能优化
- [ ] 监控和日志系统

---

## 📊 工时统计

| 优先级   | 任务数量 | 预估工时 | 备注     |
| -------- | -------- | -------- | -------- |
| **P0**   | 4        | ~20h     | 立即处理 |
| **P1**   | 3        | ~35h     | 本周完成 |
| **P2**   | 5        | ~25h     | 本月完成 |
| **P3**   | 6        | ~40h     | 有空再做 |
| **总计** | 18       | ~120h    | ~4 周    |

---

## 📝 备注

### 历史整合记录

- **2026-02-03**: 整合以下文件到本 TODO.md
  - ✅ `docs/planning/ARCHITECTURE_TODO.md`（认证架构、部署方案）
  - ✅ `docs/planning/TODO_ESSAY_ANALYSIS_RESULTS.md`（Essay Analysis 模块）
- **删除文件**:
  - ✅ `docs/planning/ARCHITECTURE_TODO.md`
  - ✅ `docs/planning/TODO_ESSAY_ANALYSIS_RESULTS.md`

### 相关文档

- [ROADMAP.md](./docs/planning/ROADMAP.md) - 产品路线图
- [docs/architecture/](./docs/architecture/) - 架构文档
- [docs/DESIGN_PHILOSOPHY.md](./docs/DESIGN_PHILOSOPHY.md) - 设计规范

### 开发环境

- **前端**: Next.js 15 + React 19 + TypeScript 5.7 + Tailwind CSS v4
- **后端**: Python 3.12 + Django 4.2 + Django Ninja
- **AI**: Dify (当前) → LangChain (未来)
- **PDF**: @react-pdf/renderer

### 测试账号

- Admin: admin@example.com / admin
- Student: student1@example.com / student1

---

**最后审查**: 2026-02-03  
**下次更新**: 完成 P0 任务后
