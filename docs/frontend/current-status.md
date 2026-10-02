# 前端当前状态

更新日期：2026-10-01

这份文档按当前 `frontend/package.json`、App Router 页面和 `/api/v2` 服务文件整理。更完整的功能验收范围、浏览器记录和已知边界见[本轮验收记录](../development/release-acceptance-2026-10-01.md)。

## 技术与运行方式

- Next.js 15.2.8、React 19、TypeScript 5.7.2、Tailwind CSS 4.3.0。
- 前端开发服务器固定在 `127.0.0.1:5100`；页面通过同源代理和 `frontend/src/service/api/v2/` 调用 Django API。
- 英文和简体中文使用 `frontend/src/locales/en.ts`、`frontend/src/locales/zh.ts` 的消息目录。界面语言与用户偏好一起保存。

## 已接入的页面与服务

| 范围 | 当前页面或服务 |
| --- | --- |
| 身份与账户 | 登录、邀请激活、忘记密码、邮箱验证；认证、刷新令牌、会话和密码相关服务。 |
| 仪表盘 | 按学生、教师、管理员角色展示概览、活动和通知入口。 |
| 练习与正式评分 | 练习工作室、草稿与反馈报告、正式提交详情、教师复核和发布流程。 |
| Rubric、作业与班级 | Rubric 列表、创建和详情；作业创建、编辑和详情；班级列表、创建、编辑和详情。 |
| 社区与分析 | 社区页面和社交服务；分析页面和按角色范围返回的数据服务。 |
| 支持与通知 | 帮助中心、文章、支持请求；通知中心和通知铃铛。 |
| 个人与设置 | 个人资料和作品集；语言、主题、账户、安全和通知设置。 |
| 管理与运行状态 | 管理员用户目录和运营状态页；对应的管理员、运行状态服务。 |

`/prototype` 保留为交互设计参考；实际登录后的产品入口在 `/dashboard` 下。

## 当前验证状态

- 本轮本地前端测试：40 个测试文件、398 个测试通过（整理后）。
- 后端回归：491 个常规测试、6 个性能测试通过；Ruff、Pyright、Django 检查和迁移检查通过。
- 最新生产构建和 TypeScript 检查通过。ESLint 为 0 个错误、35 个现有警告（整理前为 104 个）。
- 已在生产构建中验证邀请、提交、教师复核和发布，以及账号删除、帮助工单、社区举报和机构名称更新。英文/中文、电脑/手机页面、Firefox 和 WebKit 检查的具体范围见本轮验收记录。
- 两份练习 PDF 各 3 页，正文、来源引文、范例和聊天内容完整，已逐页检查。

本地前端验证命令：

```bash
cd frontend
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

运行 `pnpm build` 前先停止开发服务器，因为两者共用 `.next` 目录。

## 维护入口

- 页面路由：`frontend/src/app/`
- 页面功能：`frontend/src/features/`
- API 调用：`frontend/src/service/api/v2/`
- 语言文案：`frontend/src/locales/`
- 前端测试：与功能文件相邻的 `*.test.ts(x)`，以及 `frontend/tests/e2e/`
