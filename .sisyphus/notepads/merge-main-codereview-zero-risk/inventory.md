## Git Diff Inventory (develop-agent vs main)

### Churn Summary
```
 383 files changed, 175953 insertions(+), 12693 deletions(-)
```

### File Change Status (Name and Type)
```
A	.claude/settings.json
M	.env.example
M	.gitignore
M	.sisyphus/boulder.json
A	.sisyphus/notepads/api-v1-to-v2-migration/decisions.md
A	.sisyphus/notepads/api-v1-to-v2-migration/issues.md
A	.sisyphus/notepads/api-v1-to-v2-migration/learnings.md
A	.sisyphus/notepads/api-v1-to-v2-migration/problems.md
A	.sisyphus/notepads/default/learnings.md
A	.sisyphus/plans/api-v1-to-v2-migration.md
A	.superset/config.json
A	CLAUDE.md
M	Makefile
D	backend/E2E_TEST_RESULTS 2.md
D	backend/E2E_TEST_RESULTS.md
D	backend/Procfile
D	backend/TEST_EXECUTION_REPORT.md
D	backend/TEST_RESULTS_VALIDATION.md
D	backend/ai_feedback/README.md
M	backend/ai_feedback/__init__.py
D	backend/ai_feedback/admin.py
M	backend/ai_feedback/apps.py
M	backend/ai_feedback/client.py
M	backend/ai_feedback/interfaces.py
D	backend/ai_feedback/models.py
M	backend/ai_feedback/response_transformer.py
M	backend/ai_feedback/rubric_parser.py
D	backend/ai_feedback/schemas.py
D	backend/ai_feedback/serializers.py
D	backend/ai_feedback/tests/test_dify_workflow.py
D	backend/ai_feedback/tests/test_rubric_parser.py
D	backend/ai_feedback/tests/test_workflow_integration.py
D	backend/ai_feedback/urls.py
D	backend/ai_feedback/views.py
D	backend/analytics/README.md
D	backend/analytics/admin.py
D	backend/analytics/apps.py
D	backend/analytics/models.py
D	backend/analytics/tests.py
D	backend/analytics/views.py
A	backend/api_v2/MIGRATION_REPORT.md
A	backend/api_v2/TEST_REPORT.md
R100	backend/ai_feedback/migrations/__init__.py	backend/api_v2/__init__.py
R100	backend/ai_feedback/tests/__init__.py	backend/api_v2/advanced/__init__.py
A	backend/api_v2/advanced/schemas.py
A	backend/api_v2/advanced/views.py
R100	backend/analytics/__init__.py	backend/api_v2/ai_feedback/__init__.py
A	backend/api_v2/ai_feedback/schemas.py
A	backend/api_v2/ai_feedback/views.py
R100	backend/analytics/migrations/__init__.py	backend/api_v2/analytics/__init__.py
A	backend/api_v2/analytics/schemas.py
A	backend/api_v2/analytics/views.py
A	backend/api_v2/api.py
R100	backend/auth/__init__.py	backend/api_v2/auth/__init__.py
A	backend/api_v2/auth/schemas.py
A	backend/api_v2/auth/tests/test_settings.py
A	backend/api_v2/auth/views.py
R100	backend/auth/migrations/__init__.py	backend/api_v2/core/__init__.py
A	backend/api_v2/core/routers/classes.py
A	backend/api_v2/core/routers/dashboard.py
A	backend/api_v2/core/routers/rubrics.py
A	backend/api_v2/core/routers/submissions.py
A	backend/api_v2/core/routers/tasks.py
A	backend/api_v2/core/routers/units.py
A	backend/api_v2/core/routers/users.py
A	backend/api_v2/core/schemas.py
A	backend/api_v2/core/tests/__init__.py
A	backend/api_v2/core/tests/test_dashboard.py
A	backend/api_v2/core/tests/test_profile.py
A	backend/api_v2/core/tests/test_rubrics.py
A	backend/api_v2/core/views.py
R100	backend/core/tests/__init__.py	backend/api_v2/help/__init__.py
A	backend/api_v2/help/schemas.py
A	backend/api_v2/help/views.py
A	backend/api_v2/schemas/__init__.py
A	backend/api_v2/schemas/base.py
A	backend/api_v2/social/__init__.py
A	backend/api_v2/social/schemas.py
A	backend/api_v2/social/views.py
A	backend/api_v2/tests/__init__.py
A	backend/api_v2/tests/test_integration.py
A	backend/api_v2/tests/test_ninja_api.py
A	backend/api_v2/tests/test_performance.py
A	backend/api_v2/tests/test_schemas.py
A	backend/api_v2/tests/test_task_class_actions.py
A	backend/api_v2/tests/test_task_class_crud.py
A	backend/api_v2/tests/test_type_kernel.py
A	backend/api_v2/types/__init__.py
A	backend/api_v2/types/common.py
A	backend/api_v2/types/enums.py
A	backend/api_v2/types/ids.py
A	backend/api_v2/users_admin/__init__.py
A	backend/api_v2/users_admin/schemas.py
A	backend/api_v2/users_admin/views.py
A	backend/api_v2/utils/__init__.py
A	backend/api_v2/utils/auth.py
A	backend/api_v2/utils/jwt_auth.py
A	backend/api_v2/utils/permissions.py
A	backend/api_v2/utils/types.py
D	backend/auth/README.md
D	backend/auth/admin.py
D	backend/auth/apps.py
D	backend/auth/models.py
D	backend/auth/serializers.py
D	backend/auth/tests.py
D	backend/auth/urls.py
D	backend/auth/utils.py
D	backend/auth/views.py
M	backend/conftest.py
M	backend/core/__init__.py
D	backend/core/admin.py
M	backend/core/apps.py
M	backend/core/management/__init__.py
M	backend/core/management/commands/__init__.py
D	backend/core/management/commands/generate_openapi_schema.py
M	backend/core/management/commands/seed_db.py
M	backend/core/migrations/0001_initial.py
A	backend/core/migrations/0002_add_dashboard_indexes.py
D	backend/core/migrations/0002_triggers.py
D	backend/core/migrations/0003_default_groups.py
A	backend/core/migrations/0003_remove_enrollment_enrollment_user_idx_and_more.py
D	backend/core/migrations/0004_add_fk_to_m2m.py
A	backend/core/migrations/0004_alter_submission_table_comment_and_more.py
A	backend/core/migrations/0005_add_task_missing_fields.py
D	backend/core/migrations/0005_setup_permissions.py
A	backend/core/migrations/0006_fix_task_model_duplicates.py
D	backend/core/migrations/0006_widen_user_email_len.py
D	backend/core/migrations/0007_class_enrollment_feedback_feedbackitem_markingrubric_and_more.py
A	backend/core/migrations/0007_markingrubric_visibility_and_more.py
D	backend/core/migrations/0008_alter_user_table_comment.py
A	backend/core/migrations/0008_badge_user_preferences_userbadge_and_more.py
A	backend/core/migrations/0009_deadlineextension_and_more.py
D	backend/core/migrations/0009_merge_20251213_0440.py
D	backend/core/migrations/0010_alter_class_options_alter_enrollment_options_and_more.py
D	backend/core/migrations/0011_fix_rubric_level_constraint.py
M	backend/core/models.py
M	backend/core/rubric_manager.py
D	backend/core/serializers.py
A	backend/core/services.py
D	backend/core/tests/test_legacy_core.py
D	backend/core/tests/test_rubric_api.py
D	backend/core/tests/test_rubric_manager.py
D	backend/core/urls.py
D	backend/core/views.py
D	backend/custom_dns.py
D	backend/dns_bypass_adapter.py
D	backend/dns_bypass_socket.py
D	backend/dns_resolver.py
M	backend/essay_coach/middleware.py
M	backend/essay_coach/settings.py
M	backend/essay_coach/urls.py
D	backend/inspect_rubric.py
D	backend/mypy.ini
M	backend/pyproject.toml
A	backend/pyrightconfig.json
D	backend/test_dify.py
D	backend/test_e2e_rubric_import.py
D	backend/test_e2e_simple.py.bak
D	backend/test_non_rubric.txt
M	docs/API_ENDPOINTS.md
A	docs/API_V2_MIGRATION.md
M	docs/backend/serializers-views.md
M	docs/frontend/api-integration.md
M	docs/frontend/current-status.md
A	docs/frontend/performance-optimization.md
M	docs/index.md
A	docs/learnings/README.md
A	docs/learnings/codex-security-review-2026-02-24.md
A	docs/learnings/dashboard-backend-api-implementation.md
A	docs/learnings/dashboard-backend-implementation.md
A	docs/learnings/dashboard-code-review-findings.md
A	docs/learnings/dashboard-code-review-summary.md
A	docs/learnings/dashboard-design-analysis.md
A	docs/learnings/dashboard-frontend-implementation-log.md
A	docs/learnings/dashboard-frontend-implementation-plan.md
A	docs/learnings/dashboard-frontend-implementation.md
A	docs/learnings/dashboard-frontend-phase2-code-review.md
A	docs/learnings/dashboard-performance-optimization.md
A	docs/learnings/dashboard-refactor-phase1-backend.md
A	docs/learnings/dashboard-refactor-team-roster.md
A	docs/learnings/dashboard-security-remediation.md
A	docs/learnings/dashboard-testing-implementation.md
A	docs/learnings/dashboard-testing-strategy.md
A	docs/learnings/dashboard-ui-design-review.md
A	docs/learnings/dashboard-ui-review-notes.md
A	docs/learnings/jwt-refresh-security-lessons.md
A	docs/learnings/jwt-refresh-token-implementation.md
A	docs/learnings/pdf-export-implementation.md
A	docs/learnings/profile-backend-implementation.md
A	docs/learnings/revision-chat-api-integration.md
A	docs/learnings/settings-module-implementation.md
A	docs/learnings/sidebar-authentication-loading-fix.md
A	docs/learnings/sidebar-fix-implementation.md
A	docs/learnings/skill-radar-chart-implementation.md
A	docs/learnings/test-account-quick-fill.md
D	docs/planning/ARCHITECTURE_TODO.md
D	docs/planning/ROADMAP.md
D	docs/planning/TODO_ESSAY_ANALYSIS_RESULTS.md
A	docs/plans/2026-02-27-profile-settings-sync-design.md
A	docs/plans/2026-02-27-profile-settings-sync-plan.md
A	docs/plans/dashboard-refactor-plan.md
A	docs/prd/01-landing-page.md
A	docs/prd/02-sign-in.md
A	docs/prd/03-sign-up.md
A	docs/prd/04-dashboard-overview.md
A	docs/prd/05-essay-practice.md
A	docs/prd/06-rubrics.md
A	docs/prd/07-settings.md
A	docs/prd/08-profile.md
A	docs/prd/09-assignments.md
A	docs/prd/10-classes.md
A	docs/prd/11-social-learning-hub.md
A	docs/prd/12-analytics.md
A	docs/prd/13-users.md
A	docs/prd/14-help.md
A	docs/prd/REVISION_CHANGELOG.md
A	docs/prd/images/generated-1771129206361.png
A	docs/prd/pencil-shadcn.pen
A	docs/prd/resources/education-tech.jpg
A	docs/prd/resources/student-writing-1.jpg
A	docs/prd/resources/student-writing-2.jpg
M	frontend/package.json
M	frontend/pnpm-lock.yaml
A	frontend/src/app/api/auth/error/route.ts
A	frontend/src/app/api/auth/getUserInfo/route.ts
M	frontend/src/app/api/auth/login/route.ts
M	frontend/src/app/api/auth/refresh/route.ts
R061	frontend/src/app/api/v1/[...path]/route.ts	frontend/src/app/api/v2/[...path]/route.ts
A	frontend/src/app/api/v2/auth/error/route.ts
A	frontend/src/app/api/v2/auth/getUserInfo/route.ts
A	frontend/src/app/api/v2/auth/login-with-jwt/route.ts
A	frontend/src/app/api/v2/auth/login/route.ts
A	frontend/src/app/api/v2/auth/logout/route.ts
A	frontend/src/app/api/v2/auth/me/route.ts
A	frontend/src/app/api/v2/auth/refresh/route.ts
A	frontend/src/app/dashboard/[role]/error.tsx
A	frontend/src/app/dashboard/[role]/loading.tsx
A	frontend/src/app/dashboard/[role]/page-utils.test.ts
A	frontend/src/app/dashboard/[role]/page-utils.ts
A	frontend/src/app/dashboard/[role]/page.tsx
A	frontend/src/app/dashboard/classes/[id]/edit/page.tsx
A	frontend/src/app/dashboard/classes/[id]/page.tsx
A	frontend/src/app/dashboard/classes/new/page.tsx
A	frontend/src/app/dashboard/classes/page.tsx
M	frontend/src/app/dashboard/essay-analysis/page.tsx
M	frontend/src/app/dashboard/layout.tsx
M	frontend/src/app/dashboard/overview/@area_stats/page.tsx
M	frontend/src/app/dashboard/overview/@bar_stats/page.tsx
M	frontend/src/app/dashboard/overview/@pie_stats/page.tsx
M	frontend/src/app/dashboard/overview/@sales/page.tsx
M	frontend/src/app/dashboard/overview/@submissions/page.tsx
M	frontend/src/app/dashboard/overview/layout.tsx
A	frontend/src/app/dashboard/overview/page.test.tsx
A	frontend/src/app/dashboard/overview/page.tsx
M	frontend/src/app/dashboard/page.tsx
A	frontend/src/app/dashboard/rubrics/_components/RubricsClient.tsx
M	frontend/src/app/dashboard/rubrics/page.tsx
M	frontend/src/app/dashboard/settings/page.tsx
A	frontend/src/app/dashboard/tasks/[id]/edit/page.tsx
A	frontend/src/app/dashboard/tasks/[id]/page.tsx
A	frontend/src/app/dashboard/tasks/new/page.tsx
A	frontend/src/app/dashboard/tasks/page.tsx
M	frontend/src/app/globals.css
M	frontend/src/app/layout.tsx
M	frontend/src/components/layout/app-sidebar.tsx
M	frontend/src/components/layout/page-container.tsx
M	frontend/src/components/layout/simple-auth-context.tsx
M	frontend/src/components/org-switcher.tsx
A	frontend/src/components/ui/animated-table-wrapper.tsx
A	frontend/src/components/ui/animated-table.tsx
A	frontend/src/config/api.ts
M	frontend/src/constants/data.ts
M	frontend/src/features/auth/components/sign-in-view.tsx
M	frontend/src/features/auth/components/user-auth-form.tsx
A	frontend/src/features/classes/__tests__/class-service.test.ts
A	frontend/src/features/classes/components/batch-enroll-dialog.tsx
A	frontend/src/features/classes/components/class-card.tsx
A	frontend/src/features/classes/components/class-detail.tsx
A	frontend/src/features/classes/components/class-form.tsx
A	frontend/src/features/classes/components/class-list.tsx
A	frontend/src/features/classes/components/invite-lecturer-dialog.tsx
A	frontend/src/features/classes/components/join-class-dialog.tsx
A	frontend/src/features/classes/components/student-roster.tsx
A	frontend/src/features/classes/index.ts
A	frontend/src/features/dashboard/components/activity-feed.test.tsx
A	frontend/src/features/dashboard/components/activity-feed.tsx
A	frontend/src/features/dashboard/components/admin-dashboard.test.tsx
A	frontend/src/features/dashboard/components/admin-dashboard.tsx
A	frontend/src/features/dashboard/components/dashboard-header.test.tsx
A	frontend/src/features/dashboard/components/dashboard-header.tsx
A	frontend/src/features/dashboard/components/lecturer-dashboard.test.tsx
A	frontend/src/features/dashboard/components/lecturer-dashboard.tsx
A	frontend/src/features/dashboard/components/student-dashboard.test.tsx
A	frontend/src/features/dashboard/components/student-dashboard.tsx
A	frontend/src/features/dashboard/hooks/useDashboardData.test.ts
A	frontend/src/features/dashboard/hooks/useDashboardData.ts
A	frontend/src/features/dashboard/index.ts
A	frontend/src/features/dashboard/types/dashboard.ts
M	frontend/src/features/essay-analysis/components/essay-submission-form.tsx
M	frontend/src/features/essay-analysis/components/revision-chat.tsx
A	frontend/src/features/essay-feedback/components/feedback-pdf.test.tsx
A	frontend/src/features/essay-feedback/components/feedback-pdf.tsx
A	frontend/src/features/essay-feedback/components/skill-radar-chart.test.tsx
A	frontend/src/features/essay-feedback/components/skill-radar-chart.tsx
A	frontend/src/features/essay-feedback/hooks/useExportPDF.test.ts
A	frontend/src/features/essay-feedback/hooks/useExportPDF.tsx
A	frontend/src/features/essay-feedback/hooks/useSkillRadar.test.ts
A	frontend/src/features/essay-feedback/hooks/useSkillRadar.ts
M	frontend/src/features/essay-feedback/types/index.ts
A	frontend/src/features/overview/components/area-graph.test.tsx
A	frontend/src/features/overview/components/bar-graph.test.tsx
A	frontend/src/features/overview/components/pie-graph.test.tsx
M	frontend/src/features/overview/components/recent-sales.tsx
A	frontend/src/features/overview/components/recent-submissions.test.tsx
A	frontend/src/features/overview/components/recommended-practice.test.tsx
A	frontend/src/features/profile/__tests__/tab-navigation.test.tsx
A	frontend/src/features/profile/components/profile-achievements-tab.tsx
A	frontend/src/features/profile/components/profile-essays-tab.tsx
A	frontend/src/features/profile/components/profile-header.tsx
A	frontend/src/features/profile/components/profile-progress-tab.tsx
A	frontend/src/features/profile/components/profile-stats.tsx
M	frontend/src/features/profile/components/profile-view-page.tsx
A	frontend/src/features/profile/components/tab-navigation.tsx
A	frontend/src/features/profile/hooks/useProfile.ts
A	frontend/src/features/profile/index.ts
A	frontend/src/features/rubrics/__tests__/rubric-service.test.ts
A	frontend/src/features/rubrics/components/rubric-list.tsx
A	frontend/src/features/rubrics/components/visibility-toggle.tsx
A	frontend/src/features/rubrics/hooks/useRubrics.ts
A	frontend/src/features/settings/__tests__/account-section.test.tsx
A	frontend/src/features/settings/__tests__/settings-sidebar.test.tsx
A	frontend/src/features/settings/components/account-section.tsx
A	frontend/src/features/settings/components/api-keys-section.tsx
A	frontend/src/features/settings/components/display-section.tsx
A	frontend/src/features/settings/components/notifications-section.tsx
A	frontend/src/features/settings/components/organization-section.tsx
A	frontend/src/features/settings/components/security-section.tsx
A	frontend/src/features/settings/components/settings-sidebar.tsx
A	frontend/src/features/settings/hooks/useSettings.ts
A	frontend/src/features/settings/index.ts
A	frontend/src/features/settings/store/settingsStore.ts
A	frontend/src/features/tasks/__tests__/task-service.test.ts
A	frontend/src/features/tasks/components/duplicate-task-dialog.tsx
A	frontend/src/features/tasks/components/extend-deadline-dialog.tsx
A	frontend/src/features/tasks/components/task-card.tsx
A	frontend/src/features/tasks/components/task-form-sections.tsx
A	frontend/src/features/tasks/components/task-form-utils.test.ts
A	frontend/src/features/tasks/components/task-form-utils.ts
A	frontend/src/features/tasks/components/task-form.tsx
A	frontend/src/features/tasks/components/task-list.tsx
A	frontend/src/features/tasks/components/task-submissions-table.tsx
A	frontend/src/features/tasks/components/use-task-form.ts
A	frontend/src/features/tasks/index.ts
M	frontend/src/hooks/use-breadcrumbs.tsx
A	frontend/src/hooks/useAuthRefresh.test.ts
A	frontend/src/hooks/useAuthRefresh.ts
A	frontend/src/hooks/useDashboard.ts
A	frontend/src/lib/auth.ts
A	frontend/src/lib/server-api.ts
A	frontend/src/lib/user-normalization.ts
M	frontend/src/service/agent/agent-service.ts
A	frontend/src/service/api/__tests__/auth.test.ts
M	frontend/src/service/api/auth.ts
M	frontend/src/service/api/dify.ts
M	frontend/src/service/api/rubric.ts
A	frontend/src/service/api/v2/__tests__/settings.test.ts
A	frontend/src/service/api/v2/ai-feedback.ts
A	frontend/src/service/api/v2/auth.ts
A	frontend/src/service/api/v2/classes.ts
A	frontend/src/service/api/v2/client.ts
A	frontend/src/service/api/v2/dashboard.ts
A	frontend/src/service/api/v2/index.ts
A	frontend/src/service/api/v2/profile.ts
A	frontend/src/service/api/v2/rubrics.ts
A	frontend/src/service/api/v2/tasks.ts
A	frontend/src/service/api/v2/types.ts
A	frontend/src/stores/__tests__/authStore.test.ts
A	frontend/src/stores/authStore.ts
A	frontend/src/types/auth.ts
M	mkdocs.yml
M	pyproject.toml
M	scripts/README.md
A	scripts/dev/health-check.sh
```

### Commits on develop-agent not in main
```
9d8e97c fix: sync auth context immediately after sign-in
dbe724f fix: stabilize role dashboard fetch and task form flows
110b93e CLAUDE.md: Update Last Updated date to 2026-03-01 (Task 3.7)
7100c14 CLAUDE.md: Fill Key Files section with 7 entries (Task 3.2)
0df1452 CLAUDE.md: Add 6 missing Makefile commands (Task 3.1)
bf9b551 CLAUDE.md: Compress Security Findings (30→4 lines) (Task 3.6)
ac2563a CLAUDE.md: Compress Agent Team Workflow (25→8 lines) (Task 3.5)
5d8f0d3 CLAUDE.md: Remove completed Refactoring Roadmap Phase 1&2 (Task 3.4)
8c886b5 CLAUDE.md: Compress Completed Features (115→22 lines) (Task 3.3)
f47356f CLAUDE.md: Update PRD-05/06 Gap Summary (Task 2.5)
6770a97 CLAUDE.md: Document all 12 api_v2 subdirectories (Task 2.3)
55ef919 CLAUDE.md: Update Data Model Reference (remove ⚠️, add 6 models) (Task 2.2)
fb9d89b CLAUDE.md: Remove implemented endpoints from Missing Endpoints table (Task 2.1)
cd0e62e CLAUDE.md: Remove stale api_v1 entry from Backend Architecture (Task 2.4)
2e82ccf CLAUDE.md: Mark v2 proxy hardcoded URL as Resolved (Task 1.7)
5e277e3 CLAUDE.md: Remove stale API v1 cleanup item from In Progress (Task 1.6)
59bc5d2 CLAUDE.md: Update API Versioning to reflect api_v1 removal (Task 1.5)
71983cf CLAUDE.md: Remove stale api_v1 references from Testing section (Task 1.4)
d3e75a7 CLAUDE.md: Remove duplicate Agent Migration header (Task 1.3)
a54e3d1 CLAUDE.md: Remove duplicate CSRF Protection header with misplaced JWT content (Task 1.2)
bd563f2 CLAUDE.md: Remove duplicate Key Development Context bullets (Task 1.1)
0a87ec1 feat(frontend): add Phase 3 advanced action dialogs for tasks, classes, and rubrics
5790e03 docs(claude-md): update status for PRD-06/09/10 and add session learnings
6b3e9cb feat(frontend): integrate PRD-09/10/06 advanced actions into service layer
16f5169 feat(backend): implement PRD-09/10/06 action endpoints
dc554ff refactor(backend): split api_v2/core/views.py into sub-routers
ada6a67 refactor(backend): apply strict type formatting and clean up docs
fbf6a0a feat(backend): complete python type-system refactor
276883e refactor(backend): initialize domain type core and fix schema defaults
68fce6e fix(types): resolve type errors, optimize queries, and clean up leftovers
0c42c11 docs: update CLAUDE.md with Profile and Settings sync completion status
e23fbc4 feat: integrate settings forms with API hooks
3ff8d1b feat: add role-based tabs to profile view
0581eec test: add role-based rendering test to settings sidebar
89214e1 chore: add .worktrees to gitignore and commit plan
dedf0eb docs: add Settings and Profile functional sync design
8ee32b2 feat: implement Settings (PRD-07) and Profile (PRD-08) modules
8072e6d fix: harden v2 proxy URL fallback and refresh frontend status doc
9bcf1e8 feat: 实现 P0 功能 - Skill Radar Chart + PDF Export + Rubric Visibility
8f59ed6 chore: update .gitignore for test screenshots and temp files
2c85aeb feat: 完成 Dashboard 重构 + Tasks/Classes 模块 (PRD-04/09/10)
6db8bec docs(CLAUDE.md): add session learnings for agent team workflow
eb659f1 docs(CLAUDE.md): update with Dashboard Phase 2 completion status
5d27aa0 feat(auth): add test account quick-fill buttons on login page
f5575e0 fix(sidebar): add loading state and handle empty class state
bd5f5e8 chore: add framer-motion dependency for essay-analysis component
2590fb8 docs(CLADE.md): update with PRD readiness verification and Dashboard refactor plan
c4e552b docs(learnings): add JWT refresh token to recent learnings index
4132bf5 docs(learnings): add JWT refresh token implementation guide
9a6e28c test(schemas): update auth endpoint count for new JWT routes
e12fead test(auth): fix JWT test assertion to use correct field name
8560924 fix(auth): inherit JWTAuth from HttpBearer for proper Ninja integration
5f81cf1 fix(auth): fix JWTAuth class to use Ninja security interface
15692e7 feat(auth): add JWTAuth class and /me/jwt/ endpoint
278bbaf refactor(auth): improve JWT refresh with proper blacklist check
924445d docs: update CLAUDE.md with PRD Gap analysis and technical debt
92066d2 docs(CLAUDE.md): add security warnings and technical debt
c9506d0 fix(auth): correct AuthDataWithRefresh schema field names
8bceb9d docs(learnings): add RevisionChat API integration guide
a08d6af feat(auth): JWT refresh token mechanism with token rotation
593be6f fix(security): RBAC permissions, cookie security, and auth hardening
2be26fa docs(CLAUDE.md): add missing Codex findings (issues 1,8,9)
56bdc7d chore: security fixes + CLAUDE.md update + PRD docs
c5e86c4 docs: update CLAUDE.md with security warnings and technical debt
6607d4d chore: add sensitive files to .gitignore (security fix)
fd2e7ab feat(frontend): improve UI with Modern Minimal design and fix API errors
9c85999 refactor(frontend): migrate API routes from v1 to v2
a352621 refactor(api_v2): migrate from api_v1 to shared core modules
1bef053 feat: create shared core and ai_feedback modules for API v2
773c24b chore: remove deprecated API v1 backend
a59297e feat: add settings for enabled plugins in Claude
2a599ce fix request header format
27df3a9 fix(frontend): correct auth redirect path - /auth/login -> /auth/sign-in
d1a07f3 refactor(essaycoach): comprehensive code quality upgrade and API v2 migration
e09f0ca update
528fffc test(perf): fix performance tests for FilterSchema API
e961929 fix(schemas): use Pydantic V2 compatible FilterSchema syntax
856f982 test(api): add performance tests for API v2
6b9367f test(api): add integration tests for API v2
d55e97a feat(api): implement FilterSchema for standardized query filtering
cf2638c refactor(schemas): migrate to ModelSchema for automatic field mapping
56b43d1 refactor(api_v2): 优化 Django Ninja 代码质量和类型安全
7330404 Fix ruff lint issues
58a2e8d feat: migrate to Django Ninja v2 API with namespaced v1 legacy
b0f367a chore: add migration plan for Django Ninja transition
09fc6c6 chore: remove planning folder from docs
3a94f76 chore: consolidate TODO files and cleanup test artifacts
b3d75e5 fix: resolve pyright type checking errors
49eb0cc chore: translate Chinese comments to English
```

### File Categorization by Domain

#### auth (4 files)
```
backend/api_v2/auth/schemas.py
backend/api_v2/auth/tests/test_settings.py
backend/api_v2/auth/views.py
frontend/src/lib/auth.ts
```

#### proxy (7 files)
```
frontend/src/app/api/v2/auth/error/route.ts
frontend/src/app/api/v2/auth/getUserInfo/route.ts
frontend/src/app/api/v2/auth/login-with-jwt/route.ts
frontend/src/app/api/v2/auth/login/route.ts
frontend/src/app/api/v2/auth/logout/route.ts
frontend/src/app/api/v2/auth/me/route.ts
frontend/src/app/api/v2/auth/refresh/route.ts
```

#### models (20 files)
```
backend/core/migrations/0001_initial.py
backend/core/migrations/0002_add_dashboard_indexes.py
backend/core/migrations/0002_triggers.py
backend/core/migrations/0003_default_groups.py
backend/core/migrations/0003_remove_enrollment_enrollment_user_idx_and_more.py
backend/core/migrations/0004_add_fk_to_m2m.py
backend/core/migrations/0004_alter_submission_table_comment_and_more.py
backend/core/migrations/0005_add_task_missing_fields.py
backend/core/migrations/0005_setup_permissions.py
backend/core/migrations/0006_fix_task_model_duplicates.py
backend/core/migrations/0006_widen_user_email_len.py
backend/core/migrations/0007_class_enrollment_feedback_feedbackitem_markingrubric_and_more.py
backend/core/migrations/0007_markingrubric_visibility_and_more.py
backend/core/migrations/0008_alter_user_table_comment.py
backend/core/migrations/0008_badge_user_preferences_userbadge_and_more.py
backend/core/migrations/0009_deadlineextension_and_more.py
backend/core/migrations/0009_merge_20251213_0440.py
backend/core/migrations/0010_alter_class_options_alter_enrollment_options_and_more.py
backend/core/migrations/0011_fix_rubric_level_constraint.py
backend/core/models.py
```

#### routers (7 files)
```
backend/api_v2/core/routers/classes.py
backend/api_v2/core/routers/dashboard.py
backend/api_v2/core/routers/rubrics.py
backend/api_v2/core/routers/submissions.py
backend/api_v2/core/routers/tasks.py
backend/api_v2/core/routers/units.py
backend/api_v2/core/routers/users.py
```

#### frontend routing (27 files)
```
frontend/src/app/dashboard/[role]/error.tsx
frontend/src/app/dashboard/[role]/loading.tsx
frontend/src/app/dashboard/[role]/page-utils.test.ts
frontend/src/app/dashboard/[role]/page-utils.ts
frontend/src/app/dashboard/[role]/page.tsx
frontend/src/app/dashboard/classes/[id]/edit/page.tsx
frontend/src/app/dashboard/classes/[id]/page.tsx
frontend/src/app/dashboard/classes/new/page.tsx
frontend/src/app/dashboard/classes/page.tsx
frontend/src/app/dashboard/essay-analysis/page.tsx
frontend/src/app/dashboard/layout.tsx
frontend/src/app/dashboard/overview/@area_stats/page.tsx
frontend/src/app/dashboard/overview/@bar_stats/page.tsx
frontend/src/app/dashboard/overview/@pie_stats/page.tsx
frontend/src/app/dashboard/overview/@sales/page.tsx
frontend/src/app/dashboard/overview/@submissions/page.tsx
frontend/src/app/dashboard/overview/layout.tsx
frontend/src/app/dashboard/overview/page.test.tsx
frontend/src/app/dashboard/overview/page.tsx
frontend/src/app/dashboard/page.tsx
frontend/src/app/dashboard/rubrics/_components/RubricsClient.tsx
frontend/src/app/dashboard/rubrics/page.tsx
frontend/src/app/dashboard/settings/page.tsx
frontend/src/app/dashboard/tasks/[id]/edit/page.tsx
frontend/src/app/dashboard/tasks/[id]/page.tsx
frontend/src/app/dashboard/tasks/new/page.tsx
frontend/src/app/dashboard/tasks/page.tsx

#### AI (2 files)
```
backend/api_v2/ai_feedback/schemas.py
backend/api_v2/ai_feedback/views.py
```

#### misc (316 files)
```
.claude/settings.json
.env.example
.gitignore
.sisyphus/boulder.json
.sisyphus/notepads/api-v1-to-v2-migration/decisions.md
.sisyphus/notepads/api-v1-to-v2-migration/issues.md
.sisyphus/notepads/api-v1-to-v2-migration/learnings.md
.sisyphus/notepads/api-v1-to-v2-migration/problems.md
.sisyphus/notepads/default/learnings.md
.sisyphus/plans/api-v1-to-v2-migration.md
.superset/config.json
CLAUDE.md
Makefile
backend/E2E_TEST_RESULTS
backend/E2E_TEST_RESULTS.md
backend/Procfile
backend/TEST_EXECUTION_REPORT.md
backend/TEST_RESULTS_VALIDATION.md
backend/ai_feedback/README.md
backend/ai_feedback/__init__.py
backend/ai_feedback/admin.py
backend/ai_feedback/apps.py
backend/ai_feedback/client.py
backend/ai_feedback/interfaces.py
backend/ai_feedback/models.py
backend/ai_feedback/response_transformer.py
backend/ai_feedback/rubric_parser.py
backend/ai_feedback/schemas.py
backend/ai_feedback/serializers.py
backend/ai_feedback/tests/test_dify_workflow.py
backend/ai_feedback/tests/test_rubric_parser.py
backend/ai_feedback/tests/test_workflow_integration.py
backend/ai_feedback/urls.py
backend/ai_feedback/views.py
backend/analytics/README.md
backend/analytics/admin.py
backend/analytics/apps.py
backend/analytics/models.py
backend/analytics/tests.py
backend/analytics/views.py
backend/api_v2/MIGRATION_REPORT.md
backend/api_v2/TEST_REPORT.md
backend/ai_feedback/migrations/__init__.py
backend/ai_feedback/tests/__init__.py
backend/api_v2/advanced/schemas.py
backend/api_v2/advanced/views.py
backend/analytics/__init__.py
backend/analytics/migrations/__init__.py
backend/api_v2/analytics/schemas.py
backend/api_v2/analytics/views.py
backend/api_v2/api.py
backend/auth/__init__.py
backend/auth/migrations/__init__.py
backend/api_v2/core/schemas.py
backend/api_v2/core/tests/__init__.py
backend/api_v2/core/tests/test_dashboard.py
backend/api_v2/core/tests/test_profile.py
backend/api_v2/core/tests/test_rubrics.py
backend/api_v2/core/views.py
backend/core/tests/__init__.py
backend/api_v2/help/schemas.py
backend/api_v2/help/views.py
backend/api_v2/schemas/__init__.py
backend/api_v2/schemas/base.py
backend/api_v2/social/__init__.py
backend/api_v2/social/schemas.py
backend/api_v2/social/views.py
backend/api_v2/tests/__init__.py
backend/api_v2/tests/test_integration.py
backend/api_v2/tests/test_ninja_api.py
backend/api_v2/tests/test_performance.py
backend/api_v2/tests/test_schemas.py
backend/api_v2/tests/test_task_class_actions.py
backend/api_v2/tests/test_task_class_crud.py
backend/api_v2/tests/test_type_kernel.py
backend/api_v2/types/__init__.py
backend/api_v2/types/common.py
backend/api_v2/types/enums.py
backend/api_v2/types/ids.py
backend/api_v2/users_admin/__init__.py
backend/api_v2/users_admin/schemas.py
backend/api_v2/users_admin/views.py
backend/api_v2/utils/__init__.py
backend/api_v2/utils/auth.py
backend/api_v2/utils/jwt_auth.py
backend/api_v2/utils/permissions.py
backend/api_v2/utils/types.py
backend/auth/README.md
backend/auth/admin.py
backend/auth/apps.py
backend/auth/models.py
backend/auth/serializers.py
backend/auth/tests.py
backend/auth/urls.py
backend/auth/utils.py
backend/auth/views.py
backend/conftest.py
backend/core/__init__.py
backend/core/admin.py
backend/core/apps.py
backend/core/management/__init__.py
backend/core/management/commands/__init__.py
backend/core/management/commands/generate_openapi_schema.py
backend/core/management/commands/seed_db.py
backend/core/rubric_manager.py
backend/core/serializers.py
backend/core/services.py
backend/core/tests/test_legacy_core.py
backend/core/tests/test_rubric_api.py
backend/core/tests/test_rubric_manager.py
backend/core/urls.py
backend/core/views.py
backend/custom_dns.py
backend/dns_bypass_adapter.py
backend/dns_bypass_socket.py
backend/dns_resolver.py
backend/essay_coach/middleware.py
backend/essay_coach/settings.py
backend/essay_coach/urls.py
backend/inspect_rubric.py
backend/mypy.ini
backend/pyproject.toml
backend/pyrightconfig.json
backend/test_dify.py
backend/test_e2e_rubric_import.py
backend/test_e2e_simple.py.bak
backend/test_non_rubric.txt
docs/API_ENDPOINTS.md
docs/API_V2_MIGRATION.md
docs/backend/serializers-views.md
docs/frontend/api-integration.md
docs/frontend/current-status.md
docs/frontend/performance-optimization.md
docs/index.md
docs/learnings/README.md
docs/learnings/codex-security-review-2026-02-24.md
docs/learnings/dashboard-backend-api-implementation.md
docs/learnings/dashboard-backend-implementation.md
docs/learnings/dashboard-code-review-findings.md
docs/learnings/dashboard-code-review-summary.md
docs/learnings/dashboard-design-analysis.md
docs/learnings/dashboard-frontend-implementation-log.md
docs/learnings/dashboard-frontend-implementation-plan.md
docs/learnings/dashboard-frontend-implementation.md
docs/learnings/dashboard-frontend-phase2-code-review.md
docs/learnings/dashboard-performance-optimization.md
docs/learnings/dashboard-refactor-phase1-backend.md
docs/learnings/dashboard-refactor-team-roster.md
docs/learnings/dashboard-security-remediation.md
docs/learnings/dashboard-testing-implementation.md
docs/learnings/dashboard-testing-strategy.md
docs/learnings/dashboard-ui-design-review.md
docs/learnings/dashboard-ui-review-notes.md
docs/learnings/jwt-refresh-security-lessons.md
docs/learnings/jwt-refresh-token-implementation.md
docs/learnings/pdf-export-implementation.md
docs/learnings/profile-backend-implementation.md
docs/learnings/revision-chat-api-integration.md
docs/learnings/settings-module-implementation.md
docs/learnings/sidebar-authentication-loading-fix.md
docs/learnings/sidebar-fix-implementation.md
docs/learnings/skill-radar-chart-implementation.md
docs/learnings/test-account-quick-fill.md
docs/planning/ARCHITECTURE_TODO.md
docs/planning/ROADMAP.md
docs/planning/TODO_ESSAY_ANALYSIS_RESULTS.md
docs/plans/2026-02-27-profile-settings-sync-design.md
docs/plans/2026-02-27-profile-settings-sync-plan.md
docs/plans/dashboard-refactor-plan.md
docs/prd/01-landing-page.md
docs/prd/02-sign-in.md
docs/prd/03-sign-up.md
docs/prd/04-dashboard-overview.md
docs/prd/05-essay-practice.md
docs/prd/06-rubrics.md
docs/prd/07-settings.md
docs/prd/08-profile.md
docs/prd/09-assignments.md
docs/prd/10-classes.md
docs/prd/11-social-learning-hub.md
docs/prd/12-analytics.md
docs/prd/13-users.md
docs/prd/14-help.md
docs/prd/REVISION_CHANGELOG.md
docs/prd/images/generated-1771129206361.png
docs/prd/pencil-shadcn.pen
docs/prd/resources/education-tech.jpg
docs/prd/resources/student-writing-1.jpg
docs/prd/resources/student-writing-2.jpg
frontend/package.json
frontend/pnpm-lock.yaml
frontend/src/app/api/auth/error/route.ts
frontend/src/app/api/auth/getUserInfo/route.ts
frontend/src/app/api/auth/login/route.ts
frontend/src/app/api/auth/refresh/route.ts
frontend/src/app/api/v1/[...path]/route.ts
frontend/src/app/globals.css
frontend/src/app/layout.tsx
frontend/src/components/layout/app-sidebar.tsx
frontend/src/components/layout/page-container.tsx
frontend/src/components/layout/simple-auth-context.tsx
frontend/src/components/org-switcher.tsx
frontend/src/components/ui/animated-table-wrapper.tsx
frontend/src/components/ui/animated-table.tsx
frontend/src/config/api.ts
frontend/src/constants/data.ts
frontend/src/features/auth/components/sign-in-view.tsx
frontend/src/features/auth/components/user-auth-form.tsx
frontend/src/features/classes/__tests__/class-service.test.ts
frontend/src/features/classes/components/batch-enroll-dialog.tsx
frontend/src/features/classes/components/class-card.tsx
frontend/src/features/classes/components/class-detail.tsx
frontend/src/features/classes/components/class-form.tsx
frontend/src/features/classes/components/class-list.tsx
frontend/src/features/classes/components/invite-lecturer-dialog.tsx
frontend/src/features/classes/components/join-class-dialog.tsx
frontend/src/features/classes/components/student-roster.tsx
frontend/src/features/classes/index.ts
frontend/src/features/dashboard/components/activity-feed.test.tsx
frontend/src/features/dashboard/components/activity-feed.tsx
frontend/src/features/dashboard/components/admin-dashboard.test.tsx
frontend/src/features/dashboard/components/admin-dashboard.tsx
frontend/src/features/dashboard/components/dashboard-header.test.tsx
frontend/src/features/dashboard/components/dashboard-header.tsx
frontend/src/features/dashboard/components/lecturer-dashboard.test.tsx
frontend/src/features/dashboard/components/lecturer-dashboard.tsx
frontend/src/features/dashboard/components/student-dashboard.test.tsx
frontend/src/features/dashboard/components/student-dashboard.tsx
frontend/src/features/dashboard/hooks/useDashboardData.test.ts
frontend/src/features/dashboard/hooks/useDashboardData.ts
frontend/src/features/dashboard/index.ts
frontend/src/features/dashboard/types/dashboard.ts
frontend/src/features/essay-analysis/components/essay-submission-form.tsx
frontend/src/features/essay-analysis/components/revision-chat.tsx
frontend/src/features/essay-feedback/components/feedback-pdf.test.tsx
frontend/src/features/essay-feedback/components/feedback-pdf.tsx
frontend/src/features/essay-feedback/components/skill-radar-chart.test.tsx
frontend/src/features/essay-feedback/components/skill-radar-chart.tsx
frontend/src/features/essay-feedback/hooks/useExportPDF.test.ts
frontend/src/features/essay-feedback/hooks/useExportPDF.tsx
frontend/src/features/essay-feedback/hooks/useSkillRadar.test.ts
frontend/src/features/essay-feedback/hooks/useSkillRadar.ts
frontend/src/features/essay-feedback/types/index.ts
frontend/src/features/overview/components/area-graph.test.tsx
frontend/src/features/overview/components/bar-graph.test.tsx
frontend/src/features/overview/components/pie-graph.test.tsx
frontend/src/features/overview/components/recent-sales.tsx
frontend/src/features/overview/components/recent-submissions.test.tsx
frontend/src/features/overview/components/recommended-practice.test.tsx
frontend/src/features/profile/__tests__/tab-navigation.test.tsx
frontend/src/features/profile/components/profile-achievements-tab.tsx
frontend/src/features/profile/components/profile-essays-tab.tsx
frontend/src/features/profile/components/profile-header.tsx
frontend/src/features/profile/components/profile-progress-tab.tsx
frontend/src/features/profile/components/profile-stats.tsx
frontend/src/features/profile/components/profile-view-page.tsx
frontend/src/features/profile/components/tab-navigation.tsx
frontend/src/features/profile/hooks/useProfile.ts
frontend/src/features/profile/index.ts
frontend/src/features/rubrics/__tests__/rubric-service.test.ts
frontend/src/features/rubrics/components/rubric-list.tsx
frontend/src/features/rubrics/components/visibility-toggle.tsx
frontend/src/features/rubrics/hooks/useRubrics.ts
frontend/src/features/settings/__tests__/account-section.test.tsx
frontend/src/features/settings/__tests__/settings-sidebar.test.tsx
frontend/src/features/settings/components/account-section.tsx
frontend/src/features/settings/components/api-keys-section.tsx
frontend/src/features/settings/components/display-section.tsx
frontend/src/features/settings/components/notifications-section.tsx
frontend/src/features/settings/components/organization-section.tsx
frontend/src/features/settings/components/security-section.tsx
frontend/src/features/settings/components/settings-sidebar.tsx
frontend/src/features/settings/hooks/useSettings.ts
frontend/src/features/settings/index.ts
frontend/src/features/settings/store/settingsStore.ts
frontend/src/features/tasks/__tests__/task-service.test.ts
frontend/src/features/tasks/components/duplicate-task-dialog.tsx
frontend/src/features/tasks/components/extend-deadline-dialog.tsx
frontend/src/features/tasks/components/task-card.tsx
frontend/src/features/tasks/components/task-form-sections.tsx
frontend/src/features/tasks/components/task-form-utils.test.ts
frontend/src/features/tasks/components/task-form-utils.ts
frontend/src/features/tasks/components/task-form.tsx
frontend/src/features/tasks/components/task-list.tsx
frontend/src/features/tasks/components/task-submissions-table.tsx
frontend/src/features/tasks/components/use-task-form.ts
frontend/src/features/tasks/index.ts
frontend/src/hooks/use-breadcrumbs.tsx
frontend/src/hooks/useAuthRefresh.test.ts
frontend/src/hooks/useAuthRefresh.ts
frontend/src/hooks/useDashboard.ts
frontend/src/lib/server-api.ts
frontend/src/lib/user-normalization.ts
frontend/src/service/agent/agent-service.ts
frontend/src/service/api/__tests__/auth.test.ts
frontend/src/service/api/auth.ts
frontend/src/service/api/dify.ts
frontend/src/service/api/rubric.ts
frontend/src/service/api/v2/__tests__/settings.test.ts
frontend/src/service/api/v2/ai-feedback.ts
frontend/src/service/api/v2/auth.ts
frontend/src/service/api/v2/classes.ts
frontend/src/service/api/v2/client.ts
frontend/src/service/api/v2/dashboard.ts
frontend/src/service/api/v2/index.ts
frontend/src/service/api/v2/profile.ts
frontend/src/service/api/v2/rubrics.ts
frontend/src/service/api/v2/tasks.ts
frontend/src/service/api/v2/types.ts
frontend/src/stores/__tests__/authStore.test.ts
frontend/src/stores/authStore.ts
frontend/src/types/auth.ts
mkdocs.yml
pyproject.toml
scripts/README.md
scripts/dev/health-check.sh
```


### File Categorization by Domain

#### auth (4 files)
```
backend/api_v2/auth/schemas.py
backend/api_v2/auth/tests/test_settings.py
backend/api_v2/auth/views.py
frontend/src/lib/auth.ts
```

#### proxy (7 files)
```
frontend/src/app/api/v2/auth/error/route.ts
frontend/src/app/api/v2/auth/getUserInfo/route.ts
frontend/src/app/api/v2/auth/login-with-jwt/route.ts
frontend/src/app/api/v2/auth/login/route.ts
frontend/src/app/api/v2/auth/logout/route.ts
frontend/src/app/api/v2/auth/me/route.ts
frontend/src/app/api/v2/auth/refresh/route.ts
```

#### models (20 files)
```
backend/core/migrations/0001_initial.py
backend/core/migrations/0002_add_dashboard_indexes.py
backend/core/migrations/0002_triggers.py
backend/core/migrations/0003_default_groups.py
backend/core/migrations/0003_remove_enrollment_enrollment_user_idx_and_more.py
backend/core/migrations/0004_add_fk_to_m2m.py
backend/core/migrations/0004_alter_submission_table_comment_and_more.py
backend/core/migrations/0005_add_task_missing_fields.py
backend/core/migrations/0005_setup_permissions.py
backend/core/migrations/0006_fix_task_model_duplicates.py
backend/core/migrations/0006_widen_user_email_len.py
backend/core/migrations/0007_class_enrollment_feedback_feedbackitem_markingrubric_and_more.py
backend/core/migrations/0007_markingrubric_visibility_and_more.py
backend/core/migrations/0008_alter_user_table_comment.py
backend/core/migrations/0008_badge_user_preferences_userbadge_and_more.py
backend/core/migrations/0009_deadlineextension_and_more.py
backend/core/migrations/0009_merge_20251213_0440.py
backend/core/migrations/0010_alter_class_options_alter_enrollment_options_and_more.py
backend/core/migrations/0011_fix_rubric_level_constraint.py
backend/core/models.py
```

#### routers (7 files)
```
backend/api_v2/core/routers/classes.py
backend/api_v2/core/routers/dashboard.py
backend/api_v2/core/routers/rubrics.py
backend/api_v2/core/routers/submissions.py
backend/api_v2/core/routers/tasks.py
backend/api_v2/core/routers/units.py
backend/api_v2/core/routers/users.py
```

#### frontend routing (27 files)
```
frontend/src/app/dashboard/[role]/error.tsx
frontend/src/app/dashboard/[role]/loading.tsx
frontend/src/app/dashboard/[role]/page-utils.test.ts
frontend/src/app/dashboard/[role]/page-utils.ts
frontend/src/app/dashboard/[role]/page.tsx
frontend/src/app/dashboard/classes/[id]/edit/page.tsx
frontend/src/app/dashboard/classes/[id]/page.tsx
frontend/src/app/dashboard/classes/new/page.tsx
frontend/src/app/dashboard/classes/page.tsx
frontend/src/app/dashboard/essay-analysis/page.tsx
frontend/src/app/dashboard/layout.tsx
frontend/src/app/dashboard/overview/@area_stats/page.tsx
frontend/src/app/dashboard/overview/@bar_stats/page.tsx
frontend/src/app/dashboard/overview/@pie_stats/page.tsx
frontend/src/app/dashboard/overview/@sales/page.tsx
frontend/src/app/dashboard/overview/@submissions/page.tsx
frontend/src/app/dashboard/overview/layout.tsx
frontend/src/app/dashboard/overview/page.test.tsx
frontend/src/app/dashboard/overview/page.tsx
frontend/src/app/dashboard/page.tsx
frontend/src/app/dashboard/rubrics/_components/RubricsClient.tsx
frontend/src/app/dashboard/rubrics/page.tsx
frontend/src/app/dashboard/settings/page.tsx
frontend/src/app/dashboard/tasks/[id]/edit/page.tsx
frontend/src/app/dashboard/tasks/[id]/page.tsx
frontend/src/app/dashboard/tasks/new/page.tsx
frontend/src/app/dashboard/tasks/page.tsx
```

#### AI (2 files)
```
backend/api_v2/ai_feedback/schemas.py
backend/api_v2/ai_feedback/views.py
```

#### misc (316 files)
```
.claude/settings.json
.env.example
.gitignore
.sisyphus/boulder.json
.sisyphus/notepads/api-v1-to-v2-migration/decisions.md
.sisyphus/notepads/api-v1-to-v2-migration/issues.md
.sisyphus/notepads/api-v1-to-v2-migration/learnings.md
.sisyphus/notepads/api-v1-to-v2-migration/problems.md
.sisyphus/notepads/default/learnings.md
.sisyphus/plans/api-v1-to-v2-migration.md
.superset/config.json
CLAUDE.md
Makefile
backend/E2E_TEST_RESULTS
backend/E2E_TEST_RESULTS.md
backend/Procfile
backend/TEST_EXECUTION_REPORT.md
backend/TEST_RESULTS_VALIDATION.md
backend/ai_feedback/README.md
backend/ai_feedback/__init__.py
backend/ai_feedback/admin.py
backend/ai_feedback/apps.py
backend/ai_feedback/client.py
backend/ai_feedback/interfaces.py
backend/ai_feedback/models.py
backend/ai_feedback/response_transformer.py
backend/ai_feedback/rubric_parser.py
backend/ai_feedback/schemas.py
backend/ai_feedback/serializers.py
backend/ai_feedback/tests/test_dify_workflow.py
backend/ai_feedback/tests/test_rubric_parser.py
backend/ai_feedback/tests/test_workflow_integration.py
backend/ai_feedback/urls.py
backend/ai_feedback/views.py
backend/analytics/README.md
backend/analytics/admin.py
backend/analytics/apps.py
backend/analytics/models.py
backend/analytics/tests.py
backend/analytics/views.py
backend/api_v2/MIGRATION_REPORT.md
backend/api_v2/TEST_REPORT.md
backend/ai_feedback/migrations/__init__.py
backend/ai_feedback/tests/__init__.py
backend/api_v2/advanced/schemas.py
backend/api_v2/advanced/views.py
backend/analytics/__init__.py
backend/analytics/migrations/__init__.py
backend/api_v2/analytics/schemas.py
backend/api_v2/analytics/views.py
backend/api_v2/api.py
backend/auth/__init__.py
backend/auth/migrations/__init__.py
backend/api_v2/core/schemas.py
backend/api_v2/core/tests/__init__.py
backend/api_v2/core/tests/test_dashboard.py
backend/api_v2/core/tests/test_profile.py
backend/api_v2/core/tests/test_rubrics.py
backend/api_v2/core/views.py
backend/core/tests/__init__.py
backend/api_v2/help/schemas.py
backend/api_v2/help/views.py
backend/api_v2/schemas/__init__.py
backend/api_v2/schemas/base.py
backend/api_v2/social/__init__.py
backend/api_v2/social/schemas.py
backend/api_v2/social/views.py
backend/api_v2/tests/__init__.py
backend/api_v2/tests/test_integration.py
backend/api_v2/tests/test_ninja_api.py
backend/api_v2/tests/test_performance.py
backend/api_v2/tests/test_schemas.py
backend/api_v2/tests/test_task_class_actions.py
backend/api_v2/tests/test_task_class_crud.py
backend/api_v2/tests/test_type_kernel.py
backend/api_v2/types/__init__.py
backend/api_v2/types/common.py
backend/api_v2/types/enums.py
backend/api_v2/types/ids.py
backend/api_v2/users_admin/__init__.py
backend/api_v2/users_admin/schemas.py
backend/api_v2/users_admin/views.py
backend/api_v2/utils/__init__.py
backend/api_v2/utils/auth.py
backend/api_v2/utils/jwt_auth.py
backend/api_v2/utils/permissions.py
backend/api_v2/utils/types.py
backend/auth/README.md
backend/auth/admin.py
backend/auth/apps.py
backend/auth/models.py
backend/auth/serializers.py
backend/auth/tests.py
backend/auth/urls.py
backend/auth/utils.py
backend/auth/views.py
backend/conftest.py
backend/core/__init__.py
backend/core/admin.py
backend/core/apps.py
backend/core/management/__init__.py
backend/core/management/commands/__init__.py
backend/core/management/commands/generate_openapi_schema.py
backend/core/management/commands/seed_db.py
backend/core/rubric_manager.py
backend/core/serializers.py
backend/core/services.py
backend/core/tests/test_legacy_core.py
backend/core/tests/test_rubric_api.py
backend/core/tests/test_rubric_manager.py
backend/core/urls.py
backend/core/views.py
backend/custom_dns.py
backend/dns_bypass_adapter.py
backend/dns_bypass_socket.py
backend/dns_resolver.py
backend/essay_coach/middleware.py
backend/essay_coach/settings.py
backend/essay_coach/urls.py
backend/inspect_rubric.py
backend/mypy.ini
backend/pyproject.toml
backend/pyrightconfig.json
backend/test_dify.py
backend/test_e2e_rubric_import.py
backend/test_e2e_simple.py.bak
backend/test_non_rubric.txt
docs/API_ENDPOINTS.md
docs/API_V2_MIGRATION.md
docs/backend/serializers-views.md
docs/frontend/api-integration.md
docs/frontend/current-status.md
docs/frontend/performance-optimization.md
docs/index.md
docs/learnings/README.md
docs/learnings/codex-security-review-2026-02-24.md
docs/learnings/dashboard-backend-api-implementation.md
docs/learnings/dashboard-backend-implementation.md
docs/learnings/dashboard-code-review-findings.md
docs/learnings/dashboard-code-review-summary.md
docs/learnings/dashboard-design-analysis.md
docs/learnings/dashboard-frontend-implementation-log.md
docs/learnings/dashboard-frontend-implementation-plan.md
docs/learnings/dashboard-frontend-implementation.md
docs/learnings/dashboard-frontend-phase2-code-review.md
docs/learnings/dashboard-performance-optimization.md
docs/learnings/dashboard-refactor-phase1-backend.md
docs/learnings/dashboard-refactor-team-roster.md
docs/learnings/dashboard-security-remediation.md
docs/learnings/dashboard-testing-implementation.md
docs/learnings/dashboard-testing-strategy.md
docs/learnings/dashboard-ui-design-review.md
docs/learnings/dashboard-ui-review-notes.md
docs/learnings/jwt-refresh-security-lessons.md
docs/learnings/jwt-refresh-token-implementation.md
docs/learnings/pdf-export-implementation.md
docs/learnings/profile-backend-implementation.md
docs/learnings/revision-chat-api-integration.md
docs/learnings/settings-module-implementation.md
docs/learnings/sidebar-authentication-loading-fix.md
docs/learnings/sidebar-fix-implementation.md
docs/learnings/skill-radar-chart-implementation.md
docs/learnings/test-account-quick-fill.md
docs/planning/ARCHITECTURE_TODO.md
docs/planning/ROADMAP.md
docs/planning/TODO_ESSAY_ANALYSIS_RESULTS.md
docs/plans/2026-02-27-profile-settings-sync-design.md
docs/plans/2026-02-27-profile-settings-sync-plan.md
docs/plans/dashboard-refactor-plan.md
docs/prd/01-landing-page.md
docs/prd/02-sign-in.md
docs/prd/03-sign-up.md
docs/prd/04-dashboard-overview.md
docs/prd/05-essay-practice.md
docs/prd/06-rubrics.md
docs/prd/07-settings.md
docs/prd/08-profile.md
docs/prd/09-assignments.md
docs/prd/10-classes.md
docs/prd/11-social-learning-hub.md
docs/prd/12-analytics.md
docs/prd/13-users.md
docs/prd/14-help.md
docs/prd/REVISION_CHANGELOG.md
docs/prd/images/generated-1771129206361.png
docs/prd/pencil-shadcn.pen
docs/prd/resources/education-tech.jpg
docs/prd/resources/student-writing-1.jpg
docs/prd/resources/student-writing-2.jpg
frontend/package.json
frontend/pnpm-lock.yaml
frontend/src/app/api/auth/error/route.ts
frontend/src/app/api/auth/getUserInfo/route.ts
frontend/src/app/api/auth/login/route.ts
frontend/src/app/api/auth/refresh/route.ts
frontend/src/app/api/v1/[...path]/route.ts
frontend/src/app/globals.css
frontend/src/app/layout.tsx
frontend/src/components/layout/app-sidebar.tsx
frontend/src/components/layout/page-container.tsx
frontend/src/components/layout/simple-auth-context.tsx
frontend/src/components/org-switcher.tsx
frontend/src/components/ui/animated-table-wrapper.tsx
frontend/src/components/ui/animated-table.tsx
frontend/src/config/api.ts
frontend/src/constants/data.ts
frontend/src/features/auth/components/sign-in-view.tsx
frontend/src/features/auth/components/user-auth-form.tsx
frontend/src/features/classes/__tests__/class-service.test.ts
frontend/src/features/classes/components/batch-enroll-dialog.tsx
frontend/src/features/classes/components/class-card.tsx
frontend/src/features/classes/components/class-detail.tsx
frontend/src/features/classes/components/class-form.tsx
frontend/src/features/classes/components/class-list.tsx
frontend/src/features/classes/components/invite-lecturer-dialog.tsx
frontend/src/features/classes/components/join-class-dialog.tsx
frontend/src/features/classes/components/student-roster.tsx
frontend/src/features/classes/index.ts
frontend/src/features/dashboard/components/activity-feed.test.tsx
frontend/src/features/dashboard/components/activity-feed.tsx
frontend/src/features/dashboard/components/admin-dashboard.test.tsx
frontend/src/features/dashboard/components/admin-dashboard.tsx
frontend/src/features/dashboard/components/dashboard-header.test.tsx
frontend/src/features/dashboard/components/dashboard-header.tsx
frontend/src/features/dashboard/components/lecturer-dashboard.test.tsx
frontend/src/features/dashboard/components/lecturer-dashboard.tsx
frontend/src/features/dashboard/components/student-dashboard.test.tsx
frontend/src/features/dashboard/components/student-dashboard.tsx
frontend/src/features/dashboard/hooks/useDashboardData.test.ts
frontend/src/features/dashboard/hooks/useDashboardData.ts
frontend/src/features/dashboard/index.ts
frontend/src/features/dashboard/types/dashboard.ts
frontend/src/features/essay-analysis/components/essay-submission-form.tsx
frontend/src/features/essay-analysis/components/revision-chat.tsx
frontend/src/features/essay-feedback/components/feedback-pdf.test.tsx
frontend/src/features/essay-feedback/components/feedback-pdf.tsx
frontend/src/features/essay-feedback/components/skill-radar-chart.test.tsx
frontend/src/features/essay-feedback/components/skill-radar-chart.tsx
frontend/src/features/essay-feedback/hooks/useExportPDF.test.ts
frontend/src/features/essay-feedback/hooks/useExportPDF.tsx
frontend/src/features/essay-feedback/hooks/useSkillRadar.test.ts
frontend/src/features/essay-feedback/hooks/useSkillRadar.ts
frontend/src/features/essay-feedback/types/index.ts
frontend/src/features/overview/components/area-graph.test.tsx
frontend/src/features/overview/components/bar-graph.test.tsx
frontend/src/features/overview/components/pie-graph.test.tsx
frontend/src/features/overview/components/recent-sales.tsx
frontend/src/features/overview/components/recent-submissions.test.tsx
frontend/src/features/overview/components/recommended-practice.test.tsx
frontend/src/features/profile/__tests__/tab-navigation.test.tsx
frontend/src/features/profile/components/profile-achievements-tab.tsx
frontend/src/features/profile/components/profile-essays-tab.tsx
frontend/src/features/profile/components/profile-header.tsx
frontend/src/features/profile/components/profile-progress-tab.tsx
frontend/src/features/profile/components/profile-stats.tsx
frontend/src/features/profile/components/profile-view-page.tsx
frontend/src/features/profile/components/tab-navigation.tsx
frontend/src/features/profile/hooks/useProfile.ts
frontend/src/features/profile/index.ts
frontend/src/features/rubrics/__tests__/rubric-service.test.ts
frontend/src/features/rubrics/components/rubric-list.tsx
frontend/src/features/rubrics/components/visibility-toggle.tsx
frontend/src/features/rubrics/hooks/useRubrics.ts
frontend/src/features/settings/__tests__/account-section.test.tsx
frontend/src/features/settings/__tests__/settings-sidebar.test.tsx
frontend/src/features/settings/components/account-section.tsx
frontend/src/features/settings/components/api-keys-section.tsx
frontend/src/features/settings/components/display-section.tsx
frontend/src/features/settings/components/notifications-section.tsx
frontend/src/features/settings/components/organization-section.tsx
frontend/src/features/settings/components/security-section.tsx
frontend/src/features/settings/components/settings-sidebar.tsx
frontend/src/features/settings/hooks/useSettings.ts
frontend/src/features/settings/index.ts
frontend/src/features/settings/store/settingsStore.ts
frontend/src/features/tasks/__tests__/task-service.test.ts
frontend/src/features/tasks/components/duplicate-task-dialog.tsx
frontend/src/features/tasks/components/extend-deadline-dialog.tsx
frontend/src/features/tasks/components/task-card.tsx
frontend/src/features/tasks/components/task-form-sections.tsx
frontend/src/features/tasks/components/task-form-utils.test.ts
frontend/src/features/tasks/components/task-form-utils.ts
frontend/src/features/tasks/components/task-form.tsx
frontend/src/features/tasks/components/task-list.tsx
frontend/src/features/tasks/components/task-submissions-table.tsx
frontend/src/features/tasks/components/use-task-form.ts
frontend/src/features/tasks/index.ts
frontend/src/hooks/use-breadcrumbs.tsx
frontend/src/hooks/useAuthRefresh.test.ts
frontend/src/hooks/useAuthRefresh.ts
frontend/src/hooks/useDashboard.ts
frontend/src/lib/server-api.ts
frontend/src/lib/user-normalization.ts
frontend/src/service/agent/agent-service.ts
frontend/src/service/api/__tests__/auth.test.ts
frontend/src/service/api/auth.ts
frontend/src/service/api/dify.ts
frontend/src/service/api/rubric.ts
frontend/src/service/api/v2/__tests__/settings.test.ts
frontend/src/service/api/v2/ai-feedback.ts
frontend/src/service/api/v2/auth.ts
frontend/src/service/api/v2/classes.ts
frontend/src/service/api/v2/client.ts
frontend/src/service/api/v2/dashboard.ts
frontend/src/service/api/v2/index.ts
frontend/src/service/api/v2/profile.ts
frontend/src/service/api/v2/rubrics.ts
frontend/src/service/api/v2/tasks.ts
frontend/src/service/api/v2/types.ts
frontend/src/stores/__tests__/authStore.test.ts
frontend/src/stores/authStore.ts
frontend/src/types/auth.ts
mkdocs.yml
pyproject.toml
scripts/README.md
scripts/dev/health-check.sh
```

