# RevisionChat API Integration

**Date**: 2026-02-24
**Author**: frontend-dev
**Task**: P0 - RevisionChat Backend Integration
**Status**: ⚠️ **DEFERRED** - Pending LangGraph Migration

---

## Overview

Connect the RevisionChat component from mock data to the real backend API endpoint `/api/v2/ai-feedback/chat/`.

**Latest Update (2026-02-24)**:

> **Decision**: Defer real API integration, continue using Mock data.
>
> **Reasons**:
> - Current Dify implementation is temporary
> - Team plans to migrate to LangChain/LangGraph Agent
> - Avoid investing time in soon-to-be-deprecated technology
>
> **Next Steps**:
> - Connect to real API after LangGraph Agent implementation
> - Current priorities: Task Module (PRD-09), Class Module (PRD-10)

---

## Backend API Reference

> Note: API definitions below retained for future LangGraph migration reference

### Endpoint
```
POST /api/v2/ai-feedback/chat/
```

### Request Format (ChatMessageIn)
```typescript
{
  message: string;        // User message content (1-5000 chars)
  context?: {             // Optional context
    essay_id?: string;
    essay_question?: string;
    essay_content?: string;
    feedback_summary?: string;
    conversation_id?: string;  // For multi-turn conversation
  };
}
```

### Response Format (ChatMessageOut)
```typescript
{
  message: string;        // AI response content
  role: 'assistant' | 'system';
  timestamp: string;      // ISO 8601 format
}
```

---

## Current Implementation Status

### Frontend Component (`frontend/src/features/essay-analysis/components/revision-chat.tsx`)

**Currently using Mock data**, key code:

```typescript
// Structure retained for future real API integration
import { fetchChatMessage } from '@/service/api/dify';

// Mock data - temporary
const MOCK_RESPONSES = [
  "Thanks for your question! Let me help you with that...",
  // ... more mock responses
];

export function RevisionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  // ... rest of implementation
}
```

### API Service Layer (`frontend/src/service/api/dify.ts`)

```typescript
// Defined but not currently used
export function fetchChatMessage(data: ChatMessageRequest) {
  return request<ChatMessageResponse>({
    url: '/api/v2/ai-feedback/chat/',
    method: 'post',
    data
  });
}
```

---

## Pending Tasks (After LangGraph Migration)

### 1. Pass Essay Context
Currently, `getEssayContext()` returns empty context. Need to get from parent component:
- `essay_id`: Current essay ID
- `essay_question`: Essay question/prompt
- `essay_content`: Essay content
- `feedback_summary`: AI analysis feedback summary

**Recommended Approach**: Pass via props
```tsx
// Parent component
<RevisionChat
  essayId={essayId}
  essayQuestion={essayData.question}
  essayContent={essayData.content}
  onChatComplete={handleChatComplete}
/>
```

### 2. Conversation ID Management
Currently using module-level variable for `conversationId`, not best practice. Recommend:
- Use Zustand or other state management
- Or bind conversationId with essayId

### 3. Streaming Response Support
Current implementation uses blocking mode, future considerations:
- Support SSE streaming
- Implement typewriter effect

---

## LangGraph Migration Notes

### Interfaces to Define

```typescript
// Abstract Agent interface for easy provider switching
export interface ChatAgent {
  sendMessage(message: string, context: ChatContext): Promise<ChatResponse>;
}

// Dify implementation (current)
export class DifyAgent implements ChatAgent { ... }

// LangGraph implementation (future)
export class LangGraphAgent implements ChatAgent { ... }
```

### Migration Checklist

- [ ] Define unified ChatAgent interface
- [ ] Frontend depends on abstract interface, not concrete implementation
- [ ] Implement LangGraphAgent
- [ ] Test multi-turn conversation context
- [ ] Verify essay context passing
