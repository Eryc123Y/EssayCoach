# EssayCoach - Essay Analysis Results Page 待办清单

> 最后更新: 2026-01-23
> 总体完成度: 85%

---

## 📊 完成度总览

| 模块 | 完成度 | 状态 |
|------|--------|------|
| Essay提交表单 | 100% | ✅ 完整 |
| 分析进度界面 | 100% | ✅ 完整 |
| FeedbackDashboard | 100% | ✅ 完整 |
| InsightsList | 100% | ✅ 完整 |
| RevisionChat | 60% | ⚠️ 部分 |
| 导出/保存功能 | 30% | ❌ 未完成 |

---

## 🔴 高优先级 - 核心功能

### 1. RevisionChat 后端集成 ⭐⭐⭐

**优先级**: P0 - 核心功能缺失
**工作量**: 大 (需要后端API + 前端集成)
**状态**: 未开始

**问题描述**:
当前 `RevisionChat` 组件使用硬编码的模拟数据，无法与后端AI进行实际对话。

**当前代码** (`frontend/src/features/essay-analysis/components/revision-chat.tsx:18-25`):
```typescript
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I've analyzed your essay..."
  }
];
```

**需要实现**:

#### 1.1 后端API端点
需要创建新的API端点来处理聊天请求：

```
POST /api/v1/ai-feedback/chat/
```

**请求格式**:
```json
{
  "essay_id": 123,
  "message": "How can I improve my thesis?",
  "context": {
    "rubric_id": 3,
    "scores": {...},
    "feedback": "..."
  }
}
```

**响应格式**:
```json
{
  "response": "Your thesis could be stronger if...",
  "suggestions": ["Add specific example", "Clarify argument"]
}
```

#### 1.2 前端集成
- 修改 `RevisionChat` 组件接收 `essayId` 和 `context` props
- 实现真实的API调用
- 添加加载状态和错误处理
- 实现打字机效果显示AI回复

**文件位置**:
- 后端: `backend/ai_feedback/views.py` (新增 `ChatView`)
- 后端: `backend/ai_feedback/chat.py` (新建，聊天逻辑)
- 前端: `frontend/src/features/essay-analysis/components/revision-chat.tsx`

**验收标准**:
- [ ] 用户可以发送消息
- [ ] AI基于essay内容回复
- [ ] 加载状态正确显示
- [ ] 错误时有友好提示

---

### 2. Export PDF 功能 ⭐⭐

**优先级**: P1 - 用户体验
**工作量**: 中
**状态**: 未开始

**问题描述**:
Results页面有"Export PDF"按钮，但点击后没有任何反应。

**当前代码** (`frontend/src/app/dashboard/essay-analysis/page.tsx:308`):
```typescript
<Button variant='outline'>Export PDF</Button>
```

**需要实现**:

#### 2.1 PDF生成方案

**推荐方案**: 使用 `@react-pdf/renderer`

```bash
cd frontend && pnpm add @react-pdf/renderer
```

#### 2.2 实现步骤

1. 创建PDF模板组件
2. 实现PDF生成逻辑
3. 添加导出按钮事件处理

**文件位置**:
- 前端: `frontend/src/features/essay-analysis/components/FeedbackPDF.tsx` (新建)
- 前端: `frontend/src/hooks/useExportPDF.ts` (新建)

**验收标准**:
- [ ] 点击"Export PDF"生成PDF文件
- [ ] PDF包含：标题、评分、详细反馈、改进建议
- [ ] PDF格式美观，符合Academic Precision设计
- [ ] 下载文件名合理

---

## 🟡 中优先级 - 增强功能

### 3. Save to Portfolio ⭐

**优先级**: P2 - 用户粘性
**工作量**: 小
**状态**: 未开始

**问题描述**:
Results页面有"Save to Portfolio"按钮，但点击后没有任何反应。

**当前代码** (`frontend/src/app/dashboard/essay-analysis/page.tsx:309`):
```typescript
<Button>Save to Portfolio</Button>
```

**需要实现**:

#### 3.1 后端API
```
POST /api/v1/submissions/{id}/save/
```

#### 3.2 前端集成
```typescript
const handleSaveToPortfolio = async () => {
  await saveSubmissionToPortfolio(submissionId);
  toast.success("Saved to portfolio!");
};
```

**文件位置**:
- 后端: `backend/core/views.py` (SubmissionViewSet新增action)
- 前端: `frontend/src/service/api/submission.ts` (新增save函数)

**验收标准**:
- [ ] 点击"Save to Portfolio"保存成功
- [ ] 显示成功提示
- [ ] 用户可以在Portfolio页面查看

---

### 4. Apply Fix 功能 ⭐

**优先级**: P2 - 交互增强
**工作量**: 中
**状态**: 未开始

**问题描述**:
InsightsList中的"Apply Fix"按钮只有UI，没有实际功能。

**当前代码** (`frontend/src/features/essay-analysis/components/insights-list.tsx:105-112`):
```typescript
<Button variant='ghost' size='sm' className='hover:bg-primary/10...'>
  Apply Fix <ArrowRight className='ml-1 h-3 w-3' />
</Button>
```

**需要实现**:

#### 4.1 功能说明
当用户点击"Apply Fix"时，自动将修改应用到essay中。

#### 4.2 实现方案

**方案A**: 简单替换
- 直接在editor中替换文本

**方案B**: 建议模式
- 显示修改建议，让用户决定是否应用

**推荐方案**: 方案B，更安全

**文件位置**:
- 前端: `frontend/src/features/essay-analysis/components/InsightsList.tsx` (修改)
- 前端: `frontend/src/hooks/useApplyFix.ts` (新建)

**验收标准**:
- [ ] 点击"Apply Fix"显示修改建议
- [ ] 用户可以选择应用或取消
- [ ] 应用后essay更新

---

## 🟢 低优先级 - 优化功能

### 5. 聊天上下文感知 ⭐

**优先级**: P3 - 智能程度
**工作量**: 中
**状态**: 未开始

**问题描述**:
当前RevisionChat不知道用户写了什么essay，无法提供针对性的建议。

**需要实现**:
- 将essay内容传递给Chat组件
- 在系统提示中包含essay分析结果
- 实现基于上下文的对话

**文件位置**:
- 前端: `frontend/src/app/dashboard/essay-analysis/page.tsx` (修改)

---

### 6. 响应式优化 ⭐

**优先级**: P3 - 用户体验
**工作量**: 小
**状态**: 部分完成

**当前状态**:
- [x] 基础响应式布局
- [ ] 移动端聊天全屏模式
- [ ] 平板优化布局

**需要实现**:
```css
/* 移动端优化 */
@media (max-width: 768px) {
  .revision-chat {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80vh;
  }
}
```

---

## 📋 API端点需求清单

### 现有端点 ✅

```
POST /api/v1/ai-feedback/agent/workflows/run/
  - 状态: 工作正常
  - 功能: 提交essay进行分析
  - 返回: workflow_run_id, status, outputs
```

### 需要创建的端点 ❌

| 端点 | 方法 | 优先级 | 状态 |
|------|------|--------|------|
| `/api/v1/ai-feedback/chat/` | POST | P0 | 未开始 |
| `/api/v1/submissions/{id}/export-pdf/` | POST | P1 | 未开始 |
| `/api/v1/submissions/{id}/save/` | POST | P2 | 未开始 |
| `/api/v1/essays/{id}/apply-fix/` | POST | P2 | 未开始 |

---

## 🎨 设计规范

所有新增功能需遵循 **Academic Precision** 设计哲学：

### 颜色规范
```css
/* 背景 */
bg-slate-50 dark:bg-slate-900/50

/* 边框 */
border-slate-200 dark:border-slate-800

/* 卡片 */
bg-card border-slate-200 dark:border-slate-800 shadow-sm

/* 主色调 */
text-primary (indigo-600)

/* 禁止 */
❌ rainbow gradients
❌ heavy backdrop blur
❌ decorative gradients
```

### 动画规范
```css
/* 入场动画 */
transition-all duration-300 ease-in-out

/* 按钮悬停 */
hover:scale-105 transition-transform

/* 加载状态 */
animate-pulse
```

---

## 📁 文件结构

```
frontend/src/features/essay-analysis/
├── components/
│   ├── essay-submission-form.tsx  ✅
│   ├── analysis-progress.tsx      ✅
│   ├── feedback-dashboard.tsx     ✅
│   ├── insights-list.tsx          ✅
│   └── revision-chat.tsx          ⚠️ 部分
├── hooks/
│   └── useExportPDF.ts            📄 待创建
└── services/
    └── api/
        └── chat.ts                📄 待创建

backend/ai_feedback/
├── views.py                       ✅ (需新增ChatView)
├── chat.py                        📄 待创建
└── services/
    └── chat_service.py            📄 待创建
```

---

## 🚀 开发顺序建议

### 阶段1: 核心功能 (P0)
1. **RevisionChat后端集成**
   - 创建后端聊天API
   - 集成到前端
   - 测试对话功能

### 阶段2: 导出功能 (P1)
2. **Export PDF**
   - 安装依赖
   - 创建PDF模板
   - 集成导出功能

### 阶段3: 增强功能 (P2)
3. **Save to Portfolio**
4. **Apply Fix**

### 阶段4: 优化 (P3)
5. **聊天上下文感知**
6. **响应式优化**

---

## 📝 备注

### 相关文档
- [AGENTS.md](../AGENTS.md) - 开发规范
- [docs/DESIGN_PHILOSOPHY.md](../docs/DESIGN_PHILOSOPHY.md) - 设计规范
- [frontend/src/features/essay-analysis/components/revision-chat.tsx](../frontend/src/features/essay-analysis/components/revision-chat.tsx) - 当前RevisionChat实现

### 技术栈
- 前端: Next.js 15, React 19, TypeScript 5.7, Tailwind CSS v4
- 后端: Django 4.2+, DRF
- PDF: @react-pdf/renderer (推荐)
- 动画: Framer Motion

### 测试账号
- Admin: admin@example.com / admin
- Student: student1@example.com / student1

---

> 📌 **提示**: 此文档会随项目进展持续更新
