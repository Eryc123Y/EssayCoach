# API v2 Migration - Environment Configuration

## Quick Start

To use API v2 (recommended):
```bash
# Add to frontend/.env.local
NEXT_PUBLIC_API_VERSION=v2
```

To temporarily switch back to v1:
```bash
# Change in frontend/.env.local
NEXT_PUBLIC_API_VERSION=v1
```

## Migration Status

### ✅ Completed
- [x] Backend v2 API (44 tests passing)
- [x] Frontend v2 route proxy
- [x] Auth services (login, getUserInfo)
- [x] Rubric services (list, detail, import, delete)
- [x] AI Feedback services (dify, agent-service)
- [x] Feature flag system

### 🔄 In Progress
- [ ] E2E testing
- [ ] Production rollout

## Files Modified for v2

### API Routes
- `frontend/src/app/api/v2/[...path]/route.ts` - v2 proxy handler
- `frontend/src/app/api/auth/login/route.ts` - uses `/api/v2/auth/login/`
- `frontend/src/app/api/auth/getUserInfo/route.ts` - uses `/api/v2/auth/me/`

### Services
- `frontend/src/service/api/rubric.ts` - all endpoints use v2
- `frontend/src/service/api/dify.ts` - uses v2 endpoints
- `frontend/src/service/agent/agent-service.ts` - uses v2 baseUrl

### New v2 Service Layer
- `frontend/src/service/api/v2/auth.ts` - auth + rubric services
- `frontend/src/service/api/v2/ai-feedback.ts` - AI feedback services
- `frontend/src/service/api/v2/types.ts` - shared types
- `frontend/src/service/api/v2/index.ts` - exports

### Configuration
- `frontend/src/config/api.ts` - API version control

## Testing Checklist

Before full rollout, verify:

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (proper error)
- [ ] Get user info after login
- [ ] Token persistence across page reloads
- [ ] Logout clears cookies

### Rubric Management
- [ ] List all rubrics
- [ ] View rubric detail with items
- [ ] Create new rubric
- [ ] Update existing rubric
- [ ] Delete rubric
- [ ] Import rubric from PDF

### Essay Analysis
- [ ] Submit essay for analysis
- [ ] Poll for workflow status
- [ ] View analysis results
- [ ] Error handling for failed analyses

### Cross-Version Compatibility
- [ ] Data created in v1 works in v2
- [ ] No data loss during migration
- [ ] Response formats are compatible

## Rollback Plan

If issues are found in production:

1. Change `NEXT_PUBLIC_API_VERSION=v1` in environment
2. Redeploy frontend
3. Frontend immediately switches back to v1
4. Backend v1 remains available
5. Fix issues in v2
6. Re-enable v2 when ready

## Timeline

- **Week 1**: Deploy with v2 default, monitor metrics
- **Week 2**: If stable, remove v1 API routes
- **Week 4**: Remove v1 backend code (after 1 month stability)

## Monitoring

Track these metrics during rollout:
- API error rates (should be < 1%)
- Response times (should be < 500ms p95)
- User-reported issues
- Feature parity (no functionality loss)