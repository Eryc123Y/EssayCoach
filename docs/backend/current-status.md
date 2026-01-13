# Backend 当前现状报告 (Current Status Report)

## 1. 执行摘要 (Executive Summary)
EssayCoach 后端基于 Django 4.2 构建，目前已完成核心业务逻辑、数据模型以及基础 API 接口的开发。系统采用了基于角色的访问控制 (RBAC) 架构，支持学生、教师和管理员三种角色。核心功能涵盖了课程管理、作业发布、论文提交以及初步的评分准则 (Rubric) 系统。

## 2. 技术栈 (Technology Stack)
| 组件 | 技术 | 状态 |
|------|------|------|
| **Web 框架** | Python 3.12 + Django 4.2 + DRF | ✅ 核心已就绪 |
| **数据库** | PostgreSQL 14+ | ✅ 已配置并运行 |
| **API 文档** | drf-spectacular (OpenAPI 3.0) | ✅ 已集成 |
| **身份验证** | Token & Session Auth | ✅ 已实现 |
| **AI 引擎** | Dify Workflow (Synchronous) | ✅ 已集成 `ai_feedback` 应用 |
| **开发环境** | Nix + Overmind | ✅ 生产级 reproducible 环境 |

## 3. 核心应用与目录结构
后端代码位于 `backend/` 目录下：
- `essay_coach/`: 项目配置（Settings, URLs, WSGI）。
- `core/`: 核心业务逻辑，包含所有基础数据模型和 API ViewSets。
- `ai_feedback/`: AI 评分逻辑。实现了 `DifyClient` 对接 Dify 工作流，支持同步论文分析。
- `analytics/`: 数据分析接口（当前为占位符）。
- `auth/`: 自定义身份验证逻辑。


## 4. 数据模型现状 (Models Status)
核心数据模型已在 `core/models.py` 中定义并同步至数据库：
- **用户系统**: `User` (自定义模型), `Enrollment` (学生选课), `TeachingAssn` (教师授课)。
- **教学结构**: `Unit` (课程单位), `Class` (班级), `Task` (作业任务)。
- **评估系统**: `MarkingRubric` (评分准则), `RubricItem` (评分项), `RubricLevelDesc` (分值描述)。
- **提交与反馈**: `Submission` (论文提交), `Feedback` (整体反馈), `FeedbackItem` (针对评分项的细化反馈)。

## 5. 已实现的 API 接口
所有核心模型均已通过 Django REST Framework 暴露 RESTful 接口：
- `GET/POST /api/v1/core/users/`
- `GET/POST /api/v1/core/tasks/`
- `GET/POST /api/v1/core/submissions/`
- `GET/POST /api/v1/core/marking-rubrics/`
- ... 以及其他关联表的 CRUD 接口。

## 6. 当前面临的挑战与缺口 (Gaps & Issues)
1. **AI 反馈持久化**: AI 生成的评分反馈目前已能通过 Dify 获取，但仍需进一步优化与 `Feedback` 和 `FeedbackItem` 表的深度绑定与持久化逻辑。
2. **异步处理**: 目前 Dify 调用为同步阻塞模式 (`Synchronous`), 对于长文本或复杂工作流，需要迁移至 `Celery` 异步处理。
3. **动态评分准则**: AI 评分逻辑尚未完全适配用户自定义的动态 Rubric，目前倾向于使用 `rubric.pdf` 静态模板。
4. **数据分析 (Analytics)**: `analytics` 应用下的接口目前多为 stubs，缺乏实际的统计逻辑。

## 7. 后续开发建议
1. **完善 AI 引擎**: 实现异步任务处理（Celery + Redis），将 AI 评分逻辑与数据库模型解耦并实现持久化。
2. **增强 Rubric 灵活性**: 确保 RAG (检索增强生成) 流程能准确提取 Rubric 中的分值描述作为 Prompt 的上下文。
3. **前端对接**: 开始对接 Frontend 的 API 调用层，实现从提交论文到查看 AI 反馈的完整闭环。
