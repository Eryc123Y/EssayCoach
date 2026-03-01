# Profile Backend API Implementation

**Date**: 2026-02-26
**PRD**: PRD-08 Profile
**Status**: ✅ Complete

---

## Overview

实现了 PRD-08 Profile 需要的后端 API 端点，包括用户统计、徽章系统和进度数据。

---

## API Endpoints

### 1. User Statistics

```
GET /api/v2/core/users/{user_id}/stats/
```

**Response Schema**: `UserStatsOut`

```typescript
{
  total_essays: number;
  average_score: number | null;
  total_submissions: number;
  last_activity: string | null;  // ISO 8601 datetime
}
```

**Permissions**:
- 学生只能查看自己的统计数据
- 讲师/管理员可以查看任何用户的统计数据

**Implementation Details**:
- `total_essays`: 从 Submission 表聚合
- `average_score`: 从 FeedbackItem 表计算平均分
- `last_activity`: 最近一次提交的时间

---

### 2. User Badges

```
GET /api/v2/core/users/{user_id}/badges/
```

**Response Schema**: `BadgeOut[]`

```typescript
{
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string | null;
}[]
```

**Permissions**:
- 学生可以查看自己和其他学生的徽章（社交学习）
- 学生不能查看讲师/管理员的徽章
- 讲师/管理员可以查看任何用户的徽章

**Implementation Details**:
- Badge 模型存储徽章定义
- UserBadge 模型存储用户获得的徽章
- 当前返回真实数据，MVP 后可完善徽章获取逻辑

---

### 3. User Progress

```
GET /api/v2/core/users/{user_id}/progress/?period=month|week
```

**Response Schema**: `UserProgressOut`

```typescript
{
  user_id: number;
  entries: {
    date: string;       // ISO 8601 datetime
    essay_count: number;
    average_score: number | null;
  }[];
}
```

**Query Parameters**:
- `period`: `week` (最近 12 周) 或 `month` (最近 6 个月，默认)

**Permissions**:
- 学生只能查看自己的进度
- 讲师/管理员可以查看任何用户的进度

**Implementation Details**:
- 按周/月聚合提交数据
- 计算每个时期的提交数量和平均分数
- 使用 FeedbackItem 计算分数

---

## Database Models

### Badge Model

```python
class Badge(models.Model):
    badge_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    icon = models.CharField(max_length=50)
    criteria = models.JSONField(default=dict)  # 获取条件
    created_at = models.DateTimeField(auto_now_add=True)
```

### UserBadge Model

```python
class UserBadge(models.Model):
    user_badge_id = models.AutoField(primary_key=True)
    user_id_user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge_id_badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
```

**Migration**: `core/migrations/0008_badge_user_preferences_userbadge_and_more.py`

---

## Files Modified/Created

### Backend

| File | Change |
|------|--------|
| `backend/core/models.py` | Added Badge, UserBadge models |
| `backend/api_v2/core/schemas.py` | Added UserStatsOut, BadgeOut, ProgressEntryOut, UserProgressOut |
| `backend/api_v2/core/views.py` | Added get_user_stats, get_user_badges, get_user_progress |
| `backend/api_v2/core/tests/test_profile.py` | Created with 18 tests |

---

## Testing

**Test Command**: `uv run pytest api_v2/core/tests/test_profile.py -v`

**Results**: 18 tests passing

| Test Class | Tests | Coverage |
|------------|-------|----------|
| TestUserStats | 5 | Stats endpoint permissions + data |
| TestUserBadges | 5 | Badges endpoint permissions + data |
| TestUserProgress | 7 | Progress endpoint periods + permissions |
| TestProfileIntegration | 1 | Full profile workflow |

---

## Security Considerations

1. **RBAC Permissions**: 所有端点都实现了基于角色的访问控制
2. **User Existence Check**: 在进行任何操作前验证用户是否存在
3. **Data Isolation**: 学生只能访问自己的数据（除公开徽章外）

---

## Future Enhancements (Post-MVP)

1. **Badge Earning Logic**: 自动授予徽章的逻辑（如第一次提交、提交 10 篇等）
2. **Profile Privacy Settings**: 用户控制profile可见性
3. **Avatar Upload**: 头像上传功能
4. **Bio/Introduction**: 个人简介字段
5. **Progress Export**: 进度数据导出功能

---

## Usage Examples

### Get Your Own Stats

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v2/core/users/1/stats/
```

### Get Another Student's Badges (Social Learning)

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v2/core/users/2/badges/
```

### Get Monthly Progress

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v2/core/users/1/progress/?period=month"
```

---

## API Response Examples

### Stats Response

```json
{
  "total_essays": 5,
  "average_score": 82.5,
  "total_submissions": 5,
  "last_activity": "2026-02-25T14:30:00Z"
}
```

### Badges Response

```json
[
  {
    "id": 1,
    "name": "First Essay",
    "description": "Submitted your first essay",
    "icon": "icon-essay",
    "earned_at": "2026-02-20T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Prolific Writer",
    "description": "Submitted 5 essays",
    "icon": "icon-pencil",
    "earned_at": "2026-02-25T14:30:00Z"
  }
]
```

### Progress Response

```json
{
  "user_id": 1,
  "entries": [
    {
      "date": "2026-01-01T00:00:00Z",
      "essay_count": 2,
      "average_score": 78.5
    },
    {
      "date": "2026-02-01T00:00:00Z",
      "essay_count": 3,
      "average_score": 85.0
    }
  ]
}
```
