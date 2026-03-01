# JWT Refresh Token 实现 - 学习文档

**日期**: 2026-02-24
**作者**: backend-dev
**任务**: P0 - JWT Refresh Token Mechanism (~14h)

---

## 概述

实现了一个完整的 JWT 认证系统，包含 Token Rotation 和 Blacklist 机制，以解决原有 Token 认证的安全问题。

### 解决的问题

1. **原有问题**: 使用 DRF Token Auth，token 永不过期，存在安全风险
2. **OWASP 风险**: A07:2021 Identification and Authentication Failures
3. **需求**: 需要有过期机制 + 安全刷新机制

---

## 技术实现

### 1. 核心模块 (`backend/api_v2/utils/jwt_auth.py`)

#### 主要函数

```python
# JWT token 对生成
def create_jwt_pair(user: User) -> JWTPair:
    """
    使用 djangorestframework-simplejwt 生成 access + refresh token 对

    特点:
    - access token: 24 小时过期
    - refresh token: 7 天过期
    - 包含 custom claims: user_id, email, role
    """

# Token 刷新（带 Rotation）
def refresh_jwt_token(refresh_token: str) -> JWTPair | None:
    """
    刷新 token 对，实现 Token Rotation

    安全流程:
    1. 验证旧 refresh token 是否有效且未 blacklist
    2. 从 token 中提取 user_id 并验证用户存在
    3. 创建 BRAND NEW token 对（关键：不是复用旧的）
    4. 将旧 refresh token 加入 blacklist
    5. 返回新 token 对

    为什么这样设计？
    - 即使攻击者截获了旧 refresh token，一旦用户使用过就失效
    - 每次刷新都换全新 token，最小化泄露风险
    """

# Token Blacklist
def blacklist_jwt_token(token: str) -> bool:
    """
    将 token 加入 blacklist（使用 SimpleJWT 内置机制）

    用于用户 logout 时主动使 token 失效
    """
```

#### JWTAuth 类

```python
class JWTAuth(HttpBearer):
    """
    Django Ninja 安全认证类

    继承 HttpBearer 以正确集成 Ninja 的认证系统
    authenticate() 方法会被 Ninja 自动调用
    """

    def authenticate(self, request, token: str) -> User | None:
        """
        验证 JWT token 并返回用户
        - 使用 SimpleJWT 的 AccessToken 验证
        - Fallback 到 manual JWT decode
        """
```

---

### 2. API 端点 (`backend/api_v2/auth/views.py`)

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/v2/auth/login-with-jwt/` | POST | 无 | 登录并返回 JWT token 对 |
| `/api/v2/auth/refresh/` | POST | 无 | 使用 refresh token 获取新 token 对 |
| `/api/v2/auth/logout-jwt/` | POST | 无 | Logout 并 blacklist refresh token |
| `/api/v2/auth/me/jwt/` | GET | JWTAuth | 获取当前用户信息（JWT 版本） |

---

### 3. Schemas (`backend/api_v2/auth/schemas.py`)

```python
class RefreshTokenIn(Schema):
    """刷新请求 - 只需要 refresh token"""
    refresh: str

class RefreshTokenOut(Schema):
    """刷新响应 - 返回新 token 对"""
    access: str
    refresh: str
    expires_at: str  # ISO 格式

class AuthDataWithRefresh(Schema):
    """登录响应 - 包含完整 token 信息"""
    token: str       # access token
    refresh: str     # refresh token
    expires_at: str  # access token 过期时间
    user: UserOut    # 用户信息
```

---

### 4. Django 配置 (`backend/essay_coach/settings.py`)

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=24),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,   # 关键：每次刷新换新 token
    "BLACKLIST_AFTER_ROTATION": True,  # 关键：旧 token 自动失效
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    # ... 其他配置
}
```

---

### 5. 依赖 (`backend/pyproject.toml`)

```toml
dependencies = [
    # ...
    "djangorestframework-simplejwt>=5.5.1",  # 新增
]
```

---

## 为什么这样实现是对的

### 1. Token Rotation 的必要性

**问题场景**（没有 Rotation）:
```
1. 攻击者窃取用户的 refresh token
2. 即使用户修改密码，攻击者仍可刷新 token
3. 攻击者可以无限期访问账户
```

**有 Rotation 的场景**:
```
1. 攻击者窃取 refresh token
2. 用户使用一次刷新后，旧 token 失效
3. 攻击者的 token 无法再使用
4. 如果攻击者和用户同时刷新，后端可以检测到异常
```

### 2. Blacklist 的作用

```
- 防止已 logout 的 token 继续使用
- 配合 Rotation，确保每次刷新后旧 token 失效
- 提供 revoke 机制（如用户被封禁时可立即失效所有 token）
```

### 3. 使用 SimpleJWT 而非手动实现

**优势**:
- 成熟稳定，经过大量生产环境验证
- 内置 Blacklist 支持
- 自动处理过期验证
- 完善的测试覆盖

---

## 遇到的问题和解决方案

### 问题 1: Django Ninja 集成

**现象**: 最初 JWTAuth 类不工作，Ninja 不识别

**原因**: 没有正确继承 `HttpBearer`，方法命名不符合 Ninja 约定

**解决方案**:
```python
# 正确做法
class JWTAuth(HttpBearer):
    def authenticate(self, request, token: str) -> User | None:
        # Ninja 会自动调用这个方法
```

### 问题 2: Schema 字段名不一致

**现象**: 前端无法获取正确的 token 字段

**原因**: `AuthDataWithRefresh` 使用了 `access` 作为字段名，但其他端点用 `token`

**解决方案**: 统一使用 `token` 作为 access token 的字段名

### 问题 3: Token Rotation 逻辑

**现象**: 最初只是简单复用旧的 refresh token

**改进**: 改为创建全新的 token 对，然后 blacklist 旧的

```python
# 错误做法
refresh = RefreshToken(old_refresh)
new_access = refresh.access_token  # 复用旧的 refresh

# 正确做法
new_pair = create_jwt_pair(user)  # 全新 token 对
blacklist_jwt_token(old_refresh)  # 然后失效旧的
```

---

## 测试覆盖

### 关键测试用例

```python
# 1. 登录返回 token 对
def test_login_with_jwt_returns_tokens():
    """验证登录端点返回 access + refresh token"""

# 2. 刷新返回新 token（验证 Rotation）
def test_refresh_token_returns_new_tokens():
    """
    验证刷新后端返回新 token 对
    并且新旧 token 不同（Rotation）
    """

# 3. 无效 refresh token 拒绝
def test_refresh_token_invalid_token():
    """验证过期的 token 被拒绝"""

# 4. Token Blacklist 测试
def test_logout_jwt_blacklists_token():
    """验证 logout 后 refresh token 无法再使用"""
```

---

## 改进空间

### 已完成
- ✅ Token Rotation
- ✅ Blacklist 机制
- ✅ 完整的测试覆盖
- ✅ Django Ninja 集成

### 未来可以优化

1. **Refresh Token 存储**
   - 当前：依赖 SimpleJWT 的默认行为
   - 改进：可将 refresh token 存储在 Redis，支持更灵活的过期策略

2. **并发刷新检测**
   - 当前：没有检测并发刷新
   - 改进：如果同一 refresh token 在短时间内被多次使用，可能是被盗用，可以主动让用户重新认证

3. **多设备支持**
   - 当前：所有设备共享 refresh token
   - 改进：每个设备独立的 refresh token，用户可以单独撤销某个设备

4. **刷新 token 续期**
   - 当前：refresh token 7 天后强制过期
   - 改进：可以实现"滑动窗口"，用户活跃时自动延长 refresh token 有效期

5. **监控和告警**
   - 当前：没有异常检测
   - 改进：检测异常刷新模式（地理位置、时间、频率等）

---

## 安全考量总结

| 风险 | 缓解措施 |
|------|---------|
| Token 泄露 | httpOnly cookies（前端配合），短过期时间 |
| Token 重用攻击 | Token Rotation + Blacklist |
| 无限期访问 | Access token 24h 过期，Refresh token 7d 过期 |
| 中间人攻击 | 生产环境强制 HTTPS（secure flag）|
| CSRF | sameSite=strict, 使用 Bearer token 而非 cookies |

---

## 参考资料

- [djangorestframework-simplejwt 文档](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Ninja 安全文档](https://django-ninja.dev/operation-parameters/#security)
- [OWASP JWT 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JWT 标准](https://tools.ietf.org/html/rfc7519)

---

## 总结

本次 JWT Refresh Token 实现完成了一个安全的认证系统，核心特性包括：

1. **Token Rotation**: 每次刷新都换新 token，防止重用攻击
2. **Blacklist**: 支持主动失效 token，完善 logout 流程
3. **Django Ninja 集成**: 使用 HttpBearer 正确集成到 Ninja 框架
4. **完整测试**: 覆盖正常流程、错误处理、边界情况

这个实现为后续的功能开发（如 Tasks、Classes 模块）提供了安全的认证基础。
