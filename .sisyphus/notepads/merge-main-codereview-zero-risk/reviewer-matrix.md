# Reviewer Ownership Matrix by Risk Slice

This matrix assigns primary and backup reviewers for critical risk slices to ensure explicit accountability during code reviews.

| Risk Slice              | Primary Reviewer | Backup Reviewer | Specific Files Under Review                                  | Risk Level |
|-------------------------|------------------|-----------------|--------------------------------------------------------------|------------|
| **Auth/JWT/Cookies**    | Security Lead    | Backend Lead    | `backend/api_v2/auth/views.py`, `frontend/src/lib/auth.ts` | Critical   |
| **RBAC/Permissions**    | Security Lead    | Backend Lead    | `backend/api_v2/utils/permissions.py`                        | Critical   |
| **API Proxy Boundary**  | Security Lead    | Frontend Lead   | `frontend/src/app/api/v2/[...path]/route.ts`                 | High       |
| **Models/Migrations**   | Data Architect   | Backend Lead    | `backend/core/models.py`, `backend/core/migrations/0005-0009*.py` | Critical |
| **Task/Class/Dashboard Routers** | Backend Lead | Integration Lead| `backend/api_v2/core/routers/*.py`                         | High       |
| **Role Dashboard Routing** | Frontend Lead  | Backend Lead    | `frontend/src/app/dashboard/[role]/page.tsx`                 | High       |
| **AI Feedback Integration** | Integration Lead | Security Lead   | `backend/api_v2/ai_feedback/views.py`                        | High       |
