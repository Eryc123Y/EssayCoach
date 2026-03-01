# Codex Security Review - Learning Document (2026-02-24)

## Summary

A comprehensive security audit was conducted using OpenAI Codex, identifying 9 critical issues across the EssayCoach codebase. This document summarizes the findings, fixes applied, and lessons learned.

> Historical note: references to `api_v1` paths in this learning record describe the code state at review time.

## Review Team

- **Team Lead**: team-lead
- **Code Reviewer**: reviewer (feature-dev:code-reviewer)
- **Code Architect**: architect (feature-dev:code-architect)
- **Code Explorer**: explorer (feature-dev:code-explorer)

## Issues Identified

### Critical Issues (3)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Single source of truth失效 | High | Documented |
| 2 | RBAC 权限缺失 | Critical | ✅ Fixed |
| 3 | Auth refresh 不完整 | High | Pending |

### High Issues (3)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 4 | v1/v2 迁移叙事冲突 | Medium | ✅ Fixed (api_v1 deleted) |
| 5 | 导航暴露未实现模块 | Medium | ✅ Fixed |
| 6 | classes 接口缺字段 | Medium | Documented |

### Medium Issues (3)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 7 | 新旧流程并存 | Low | Documented |
| 8 | v2 proxy 硬编码 | Low | Documented |
| 9 | 残留空目录 | Low | Documented |

---

## Fixes Applied

### 1. Cookie Security Hardening (httpOnly)

**Files Modified**:
- `frontend/src/app/api/auth/login/route.ts`
- `frontend/src/app/api/v2/auth/login/route.ts`

**Changes**:
```typescript
// Before
res.cookies.set('user_role', normalizedUser.role, {
  httpOnly: false,  // ❌ Vulnerable to XSS
  sameSite: 'lax',
});

// After
res.cookies.set('user_role', normalizedUser.role, {
  httpOnly: true,   // ✅ Server-side only
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
});
```

**Why It's Correct**:
- `httpOnly: true` prevents client-side JavaScript from accessing cookies
- `sameSite: 'strict'` prevents CSRF attacks
- `secure: true` (production) ensures cookies only sent over HTTPS

**OWASP Reference**: A07:2021 Identification and Authentication Failures

---

### 2. RBAC Permission Checks

**Files Modified**:
- `backend/api_v2/core/views.py` (Users CRUD endpoints)
- `backend/api_v2/utils/permissions.py` (NEW)

**Changes**:
```python
# NEW: Permission utilities
class IsAdminOrLecturer:
    allowed_roles = ["admin", "lecturer"]

    def check(self, request: HttpRequest) -> None:
        user = getattr(request, "auth", None)
        if not has_role(user, self.allowed_roles):
            raise PermissionDenied("Requires admin or lecturer role")

# Applied to endpoints
@router.post("/users/", response=UserOut)
def create_user(request: HttpRequest, data: UserIn):
    # Only admin and lecturer can create users
    user = request.auth
    if user.user_role not in ["admin", "lecturer"]:
        raise HttpError(403, "Only admin and lecturer can create users")
    # ...
```

**Why It's Correct**:
- Students cannot create/modify/delete other users
- Admin and lecturer roles have appropriate privileges
- Follows principle of least privilege

**OWASP Reference**: A01:2021 Broken Access Control

---

### 3. Navigation Cleanup (404 Links)

**Files Modified**:
- `frontend/src/constants/data.ts`

**Changes**:
```typescript
// Commented out unimplemented pages
// TODO: Assignments - PRD-09 Not implemented yet
// {
//   title: 'Assignments',
//   url: '/dashboard/assignments',  // 404
//   ...
// },
```

**Why It's Correct**:
- Users no longer encounter 404 pages from navigation
- TODO comments preserve intent for future implementation
- Aligns frontend navigation with actual implementation status

---

### 4. API v1 Cleanup

**Files Deleted**:
- `backend/api_v1/` (entire directory)
- `frontend/src/app/api/v1/` (entire directory)

**Why It's Correct**:
- CLAUDE.md stated api_v1 was "pending deletion"
- All active development targets API v2
- Removes technical debt and confusion

---

## Key Insights

### 1. Documentation Drift

CLAUDE.md claimed to be "single source of truth" but other docs had conflicting information. This highlights the importance of:
- Regular documentation audits
- Single authoritative sources
- Automated documentation where possible

### 2. Security First

The RBAC and cookie issues were present because:
- Development focused on functionality over security
- No security review process in place
- Team was rushing to MVP

**Lesson**: Security should be built in from the start, not added later.

### 3. Team Collaboration

The agent-based review process was effective:
- **reviewer** focused on code quality and security
- **architect** analyzed PRD alignment and gaps
- **explorer** verified file states and configurations

**Pattern**: Divide and verify - each agent independently confirmed findings.

---

## Areas for Improvement

1. **Pre-commit Security Checks** - Add automated security scanning
2. **Documentation CI** - Verify documentation accuracy
3. **PRD vs Code Sync** - Regular gap analysis
4. **Permission Testing** - Add RBAC test coverage

---

## Related Files

- `CLAUDE.md` - Updated with Security Warnings and Technical Debt
- `backend/api_v2/utils/permissions.py` - New permission utilities
- `backend/api_v2/core/views.py` - RBAC checks added
- `frontend/src/app/api/auth/login/route.ts` - Cookie security
- `frontend/src/components/layout/simple-auth-context.tsx` - HttpOnly adapter

---

## References

- [OWASP Top 10:2021](https://owasp.org/www-project-top-ten/)
- [A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [A07:2021 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
