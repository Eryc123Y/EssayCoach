# RevisionChat API 集成学习文档

**日期**: 2026-02-24
**作者**: frontend-dev
**任务**: P0 - RevisionChat 连接真实 API

---

## 概述

将 RevisionChat 组件从 mock 数据连接到后端真实 API 端点 `/api/v2/ai-feedback/chat/`。

## 后端 API 接口

### Endpoint
```
POST /api/v2/ai-feedback/chat/
```

### 请求格式 (ChatMessageIn)
```typescript
{
  message: string;        // 用户消息内容 (1-5000 字符)
  context?: {             // 可选上下文
    essay_id?: string;
    essay_question?: string;
    essay_content?: string;
    feedback_summary?: string;
    conversation_id?: string;  // 用于多轮对话
  };
}
```

### 响应格式 (ChatMessageOut)
```typescript
{
  message: string;        // AI 回复内容
  role: 'assistant' | 'system';
  timestamp: string;      // ISO 8601 格式
}
```

---

## 前端实现

### 1. API 服务层 (`frontend/src/service/api/dify.ts`)

```typescript
export interface ChatMessageRequest {
  message: string;
  context?: {
    essay_id?: string;
    essay_question?: string;
    essay_content?: string;
    feedback_summary?: string;
    conversation_id?: string;
  };
}

export interface ChatMessageResponse {
  message: string;
  role: 'assistant' | 'system';
  timestamp: string;
}

export function fetchChatMessage(data: ChatMessageRequest) {
  return request<ChatMessageResponse>({
    url: '/api/v2/ai-feedback/chat/',
    method: 'post',
    data
  });
}
```

### 2. 组件实现 (`frontend/src/features/essay-analysis/components/revision-chat.tsx`)

**关键改动**:

1. **移除 mock 数据**: 删除 `MOCK_MESSAGES` 常量
2. **添加状态**: `isLoading` 处理加载状态
3. **API 调用**: `handleSend` 改为 async 函数
4. **错误处理**: 使用 toast 显示错误，失败时移除用户消息
5. **多轮对话**: 使用模块级变量 `conversationId` 保存会话 ID
6. **用户体验**:
   - Loading 时显示 spinner
   - 支持回车键发送
   - 失败时自动回滚 UI

---

## 待办事项

### 1. 传递 Essay 上下文
当前实现中，`getEssayContext()` 返回空上下文。需要从父组件获取：
- `essay_id`: 当前分析的文章 ID
- `essay_question`: 文章问题
- `essay_content`: 文章内容
- `feedback_summary`: AI 分析反馈摘要

**建议方案**: 通过 props 传递
```tsx
// 父组件
<RevisionChat
  essayId={essayId}
  essayQuestion={essayData.question}
  essayContent={essayData.content}
/>
```

### 2. Conversation ID 管理
当前使用模块级变量存储 `conversationId`，这不是最佳实践。建议：
- 使用 Zustand 或其他状态管理工具
- 或将 conversationId 与 essayId 绑定存储

### 3. 流式响应支持
当前实现使用 blocking 模式，未来可考虑：
- 支持 SSE 流式响应
- 实现打字机效果

---

## 测试建议

### 单元测试
```tsx
describe('RevisionChat', () => {
  it('should send message and display response', async () => {
    // Mock fetchChatMessage
    // Simulate user input
    // Assert message appears in chat
  });

  it('should handle API error gracefully', async () => {
    // Mock API error
    // Assert toast error message
    // Assert user message is removed
  });
});
```

### E2E 测试
1. 提交一篇文章
2. 等待分析完成
3. 在 RevisionChat 中发送消息
4. 验证 AI 响应显示

---

## 相关技术栈

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui
- **HTTP Client**: native fetch with `credentials: 'include'`
- **Notifications**: sonner (toast)
- **Backend**: Django Ninja
- **AI Provider**: Dify

---

## 参考资料

- 后端实现：`backend/api_v2/ai_feedback/views.py:124-171`
- Schema 定义：`backend/api_v2/ai_feedback/schemas.py:145-157`
- Dify Chat API: https://docs.dify.ai/api-reference/chat-messages
