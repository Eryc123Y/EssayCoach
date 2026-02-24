# API v1 to v2 Migration Plan

## TL;DR

> **Quick Summary**: 一次性迁移前后端从 v1 到 v2，删除所有 api_v1 代码，将共享 models 移到 core/models.py，重写测试
> 
> **Deliverables**:
> - 后端: 删除 api_v1/ 目录，models 移至 core/models.py
> - 前端: 删除 app/api/v1/ 和 app/api/auth/ (已使用 v2)
> - 测试: 重写为 v2，删除废弃测试
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Backend models → Update imports → URL routing → Tests → Cleanup

---

## Context

### Original Request
用户希望一次性让前后端直接进入 v2，删除所有 v1 文件。

### Decisions Made
- **Models 位置**: `core/models.py` (不是 api_v2/core/models.py)
- **测试策略**: 重写为 v2 测试，无用测试直接删除
- **迁移方式**: 一次性完全迁移，不保留向后兼容

### Key Findings
- api_v2 从 api_v1 导入 models 和 ai_feedback 代码
- 前端已大部分使用 v2 (之前已迁移)
- 测试文件大部分基于 v1

---

## Work Objectives

### Core Objective
删除所有 api_v1 代码，前后端完全使用 v2

### Concrete Deliverables
1. 后端 models 移至 `core/models.py`
2. 后端 ai_feedback 移至共享模块
3. 删除 `backend/api_v1/` 目录
4. 更新 api_v2 的 imports
5. 更新 Django urls.py (只保留 v2)
6. 删除前端废弃 API 路由
7. 重写/删除 v1 测试

### Must Have
- [x] 所有 API 请求使用 v2
- [x] Django 能正常启动
- [x] 前端能正常登录和认证
- [x] 迁移后测试通过

### Must NOT Have
- [x] 任何 api_v1 代码残留
- [x] 废弃的 imports
- [x] 前后端版本不一致

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: 重写为 v2
- **Framework**: pytest

### Agent-Executed QA Scenarios

**Scenario: Backend starts successfully**
  Tool: Bash
  Steps:
    1. cd backend && uv run python manage.py check
    2. Assert: System check identified no issues
  Expected Result: Django system check passes

**Scenario: API v2 endpoints respond**
  Tool: Bash (curl)
  Steps:
    1. curl http://localhost:8000/api/v2/auth/me/
    2. Assert: {"detail": "Unauthorized"} (expected for unauthenticated)
  Expected Result: 200 OK response

**Scenario: Frontend build succeeds**
  Tool: Bash
  Steps:
    1. cd frontend && pnpm build
    2. Assert: Exit code 0
  Expected Result: Build completes without errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Core Models):
├── 1.1: Create core/models.py with all models
├── 1.2: Create core/__init__.py with exports
├── 1.3: Create ai_feedback shared module
└── 1.4: Update api_v2 imports to use core/

Wave 2 (URLs & Cleanup):
├── 2.1: Update essay_coach/urls.py (remove v1)
├── 2.2: Delete backend/api_v1/ directory
├── 2.3: Update frontend service imports
└── 2.4: Delete frontend/app/api/v1/ and app/api/auth/

Wave 3 (Tests & Verification):
├── 3.1: Rewrite/rename tests for v2
├── 3.2: Run Django tests
├── 3.3: Run frontend build
└── 3.4: Manual verification with curl
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1.1 | None | 1.2, 1.3, 1.4 |
| 1.2 | 1.1 | 2.1, 2.2 |
| 1.3 | 1.1 | 2.2 |
| 1.4 | 1.1 | 2.1 |
| 2.1 | 1.2, 1.4 | 3.1 |
| 2.2 | 1.2, 1.3 | None |
| 2.3 | None | 3.2 |
| 2.4 | None | 3.3 |
| 3.1 | 2.1 | None |
| 3.2 | 2.1, 2.3 | None |
| 3.3 | 2.4 | None |
| 3.4 | 3.2, 3.3 | None |

---

## TODOs

### Wave 1: Core Models (4 tasks)

- [x] 1.1 Create core/models.py

  **What to do**:
  - Create `/Users/eric/Documents/GitHub/EssayCoach/backend/core/__init__.py`
  - Create `/Users/eric/Documents/GitHub/EssayCoach/backend/core/models.py`
  - Copy all models from `api_v1/core/models.py`
  - Copy models from `api_v1/ai_feedback/models.py` (Feedback, FeedbackItem)

  **Must NOT do**:
  - 不要删除 api_v1 的 models，只是复制

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple file copying and creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1.2, 1.3, 1.4)
  - **Blocked By**: None

- [x] 1.2 Create core/__init__.py

  **What to do**:
  - Create exports for all models in core/models.py

- [x] 1.3 Create ai_feedback shared module

  **What to do**:
  - Create `/Users/eric/Documents/GitHub/EssayCoach/backend/ai_feedback/`
  - Move `api_v1/ai_feedback/client.py` here
  - Move `api_v1/ai_feedback/exceptions.py` here

- [x] 1.4 Update api_v2 imports

  **What to do**:
  - Update `api_v2/core/views.py`: `from core.models import ...`
  - Update `api_v2/ai_feedback/`: `from ai_feedback.client import ...`

---

### Wave 2: URLs & Cleanup (4 tasks)

- [x] 2.1 Update essay_coach/urls.py

  **What to do**:
  - Remove `api_v1` from urlpatterns
  - Keep only `api_v2`

- [x] 2.2 Delete backend/api_v1/ directory

  **What to do**:
  - Delete `backend/api_v1/` entirely
  - Verify Django still starts

- [x] 2.3 Update frontend service imports

  **What to do**:
  - Check and update any remaining v1 references in frontend

- [x] 2.4 Delete frontend废弃API路由

  **What to do**:
  - Delete `/frontend/src/app/api/v1/`
  - Delete `/frontend/src/app/api/auth/` (已迁移到 v2)

---

### Wave 3: Tests & Verification (4 tasks)

- [x] 3.1 Rewrite tests for v2

  **What to do**:
  - Rewrite tests in `backend/tests/` to use v2 endpoints
  - Delete obsolete v1 tests

- [x] 3.2 Run Django tests

  **What to do**:
  - cd backend && uv run pytest
  - Fix any failures

- [x] 3.3 Run frontend build

  **What to do**:
  - cd frontend && pnpm build
  - Fix any errors

- [x] 3.4 Manual verification

  **What to do**:
  - Test login: curl POST /api/v2/auth/login/
  - Test auth: curl /api/v2/auth/me/ with token
  - Verify full flow

---

## Success Criteria

### Final Checklist
- [x] backend/api_v1/ 目录已删除
- [x] core/models.py 包含所有 models
- [x] Django check 通过
- [x] 所有 API 使用 v2
- [x] 前端 build 成功
- [x] 登录流程测试通过
