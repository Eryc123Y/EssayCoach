# EssayCoach 架构改进 TODO 清单

**状态**: 规划中 | **更新日期**: 2026-01-23 | **优先级**: 分阶段执行

---

## 📋 Executive Summary

EssayCoach 当前采用 Next.js + Django 架构，整体合理但存在以下核心问题：

| 问题           | 严重性 | 优先级  | 预期工作量 | 目标完成 |
| -------------- | ------ | ------- | ---------- | -------- |
| 认证机制混乱   | 🔴 高  | Phase 1 | 10 小时    | Week 1-2 |
| 生产部署缺失   | 🔴 高  | Phase 3 | 10 小时    | Month 1  |
| API 代理双重化 | 🟡 中  | Phase 3 | 5 小时     | Month 1  |

---

## 🎯 分阶段执行计划

### Phase 1: 认证安全加固（**立即执行，Week 1-2**）

#### 1.1 Token 刷新机制

**当前问题**:
- ❌ DRF Token 无过期时间（永久有效）
- ❌ 无自动刷新机制
- ❌ 登出后 Token 仍有效

**目标**:
- ✅ 实现 Access Token（短期）+ Refresh Token（长期）
- ✅ 自动刷新逻辑在 API 层
- ✅ 登出时清除所有 Token

**涉及文件**:

```
Backend:
- [ ] backend/auth/models.py (添加 RefreshToken 模型)
- [ ] backend/auth/views.py (添加 refresh 端点)
- [ ] backend/essay_coach/settings.py (JWT 配置，如使用 djangorestframework-simplejwt)

Frontend:
- [ ] frontend/src/service/request.ts (添加 401 重试逻辑)
- [ ] frontend/src/service/api/auth.ts (添加 refreshToken 函数)
- [ ] frontend/src/store/auth.ts (Zustand 中添加刷新逻辑)
```

**验收标准**:
- [ ] Token 自动刷新在 401 响应时触发
- [ ] Refresh Token 有效期 > 7 天
- [ ] 登出清除所有 Token 和 Cookie

**Effort**: 6 小时

---

#### 1.2 去除客户端 Token 读取（安全加固）

**当前问题**:
- ❌ `frontend/src/service/request.ts` 使用 `document.cookie` 读取 Token
- ❌ XSS 攻击可获取 Token（httpOnly: false）
- ❌ Token 暴露在浏览器 DevTools

**目标**:
- ✅ HttpOnly Cookie 存储 Token（仅服务器读取）
- ✅ 前端无需访问 Token 值
- ✅ 通过 API Route 中间件或 Next.js 中间件自动注入

**涉及文件**:

```
Frontend:
- [ ] frontend/src/app/api/v1/[...path]/route.ts (移除 Token 注入，或改为中间件)
- [ ] frontend/src/service/request.ts (移除 document.cookie 访问)
- [ ] frontend/src/middleware.ts (创建 - 添加 Cookie 自动传递)
- [ ] frontend/src/service/api/auth.ts (更新登录流程)

Backend:
- [ ] backend/auth/views.py (确保 Cookie 设置 HttpOnly=True, Secure=True)
```

**验收标准**:
- [ ] Token 不在浏览器应用代码中可见
- [ ] API 调用自动携带 Cookie
- [ ] HttpOnly 标志设置正确

**Effort**: 4 小时

---

#### 1.3 认证状态统一管理

**当前问题**:
- ❌ 认证状态分散：Cookie + React Context + Zustand
- ❌ 状态不同步导致 UI 错误
- ❌ 登出时多处需要手动清除

**目标**:
- ✅ 单一源的真相（Zustand store）
- ✅ 登录/登出 原子性操作
- ✅ 自动同步 Cookie ↔ Store

**涉及文件**:

```
Frontend:
- [ ] frontend/src/store/auth.ts (新建/重构)
  - [ ] token 状态
  - [ ] user 状态
  - [ ] isLoading 状态
  - [ ] setToken() 原子操作
  - [ ] logout() 原子操作
  - [ ] initializeAuth() 初始化
  
- [ ] frontend/src/components/layout/simple-auth-context.tsx (重构/移除)
  - [ ] 迁移到 Zustand
  - [ ] 移除重复逻辑
  
- [ ] frontend/src/app/layout.tsx (添加 auth 初始化)
  - [ ] useEffect 调用 initializeAuth()
```

**验收标准**:
- [ ] 单一 Zustand store 管理所有认证状态
- [ ] 登出时所有状态原子清除
- [ ] 页面刷新后正确恢复认证状态

**Effort**: 4 小时

---

### Phase 2: 认证状态管理优化（**Week 2-3**）

#### 2.1 请求拦截器标准化

**当前问题**:
- ❌ 每个 API 调用都手动处理 Token
- ❌ 无统一的错误处理
- ❌ 无请求超时、重试机制

**目标**:
- ✅ 统一的请求拦截器
- ✅ 自动 401 → refresh → 重试
- ✅ 全局错误处理

**涉及文件**:

```
Frontend:
- [ ] frontend/src/service/api-client.ts (新建)
  - [ ] createApiClient() 工厂函数
  - [ ] 请求拦截器（注入 headers）
  - [ ] 响应拦截器（处理 401）
  - [ ] 错误处理标准化
  - [ ] 重试逻辑
  
- [ ] frontend/src/service/api/auth.ts
- [ ] frontend/src/service/api/rubric.ts
- [ ] frontend/src/service/api/essay.ts
  - [ ] 更新为使用新的 API client
```

**验收标准**:
- [ ] 所有 API 调用使用统一的 client
- [ ] 401 自动重试成功率 > 95%
- [ ] 错误消息统一格式

**Effort**: 6 小时

---

#### 2.2 中间件路由保护

**当前问题**:
- ❌ 未认证用户可访问 `/dashboard`
- ❌ 无统一的路由保护机制
- ❌ 前端无法验证 Token 有效性

**目标**:
- ✅ Next.js 中间件验证所有受保护路由
- ✅ 无效 Token 自动重定向到登录
- ✅ 清晰的路由保护规则

**涉及文件**:

```
Frontend:
- [ ] frontend/src/middleware.ts (新建/增强)
  - [ ] 定义受保护路由列表
  - [ ] 验证 access_token Cookie 存在
  - [ ] Token 过期验证
  - [ ] 重定向到 /auth/sign-in
  
- [ ] frontend/src/app/layout.tsx (配置中间件)
```

**验收标准**:
- [ ] 无 Token 不能访问 `/dashboard/*`
- [ ] 无效 Token 自动重定向
- [ ] 登录后可访问 Dashboard

**Effort**: 3 小时

---

### Phase 3: 生产部署方案（**Month 1-2**）

#### 3.1 移除 Next.js API Route 代理

**当前问题**:
- ❌ `frontend/src/app/api/v1/[...path]/route.ts` 增加延迟
- ❌ Token 注入逻辑在前端（应在后端或网关）
- ❌ 生产环境多一层网络跳转

**目标**:
- ✅ 前端直连 Django Backend
- ✅ Token 通过 Cookie 自动携带（HttpOnly）
- ✅ 减少延迟 ~20-50ms

**涉及文件**:

```
Frontend:
- [x] 分析 frontend/src/app/api/v1/[...path]/route.ts (77行)
- [ ] 移除文件 (rm frontend/src/app/api/v1/[...path]/route.ts)
- [ ] 更新 frontend/.env.local
  NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
  
- [ ] 更新 frontend/src/service/request.ts
  - [ ] 移除 /api/v1 代理（直接调用 NEXT_PUBLIC_API_URL）
  
Backend:
- [ ] 确保 CORS 配置允许前端地址
- [ ] 验证 Cookie 设置正确（HttpOnly, Secure, SameSite）
```

**验收标准**:
- [ ] 前端直连 Django 成功
- [ ] 所有 API 请求工作正常
- [ ] 延迟对比测试（代理 vs 直连）

**Effort**: 2 小时

---

#### 3.2 Docker 容器化（完整部署）

**当前问题**:
- ❌ `docker-compose.yml` 仅包含 PostgreSQL
- ❌ Django 无容器配置
- ❌ Next.js 无容器配置
- ❌ 生产部署方案缺失

**目标**:
- ✅ 完整的 docker-compose.yml（所有服务）
- ✅ 生产级 Dockerfile（Django + Next.js）
- ✅ 网络隔离、环境变量管理

**涉及文件**:

```
Root:
- [ ] docker/Dockerfile.django (新建)
  - [ ] 基础镜像: python:3.12-slim
  - [ ] 安装依赖（uv）
  - [ ] 收集静态文件
  - [ ] 暴露端口 8000
  
- [ ] docker/Dockerfile.nextjs (新建)
  - [ ] 基础镜像: node:22-alpine
  - [ ] 安装依赖（pnpm）
  - [ ] 构建产物
  - [ ] 暴露端口 3000
  
- [ ] docker-compose.yml (更新)
  - [ ] postgres: 现有配置保留
  - [ ] backend: 新增 Django 服务
  - [ ] frontend: 新增 Next.js 服务
  - [ ] networks: 内部网络
  - [ ] volumes: 数据持久化
  
- [ ] .dockerignore (新建)
- [ ] .dockerignore (Django)
- [ ] .dockerignore (Next.js)
```

**验收标准**:
- [ ] `docker-compose up` 启动所有服务
- [ ] 所有服务健康检查通过
- [ ] 可访问 http://localhost:5100 (frontend)
- [ ] API 请求正常

**Effort**: 8 小时

---

#### 3.3 Nginx 反向代理配置

**当前问题**:
- ❌ 无反向代理配置
- ❌ 生产环境直接暴露两个端口不安全
- ❌ CORS 配置复杂

**目标**:
- ✅ Nginx 统一入口 `:80`
- ✅ 请求路由到对应后端服务
- ✅ SSL/TLS 支持（生产）
- ✅ 性能优化（缓存、压缩）

**涉及文件**:

```
Root:
- [ ] docker/nginx/nginx.conf (新建)
  upstream django {
    server backend:8000;
  }
  
  upstream nextjs {
    server frontend:3000;
  }
  
  server {
    listen 80;
    
    # API 直连 Django
    location /api/v1/ {
      proxy_pass http://django;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 前端（含 SSR）
    location / {
      proxy_pass http://nextjs;
      proxy_set_header Host $host;
    }
  }

- [ ] docker-compose.yml (添加 nginx 服务)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
```

**验收标准**:
- [ ] 访问 http://localhost 正常
- [ ] `/api/v1/*` 路由到 Django
- [ ] `/` 路由到 Next.js
- [ ] 性能指标正常

**Effort**: 4 小时

---

#### 3.4 环境变量标准化

**当前问题**:
- ❌ 环境变量分散：`.env`、`.env.local`、`.env.example`
- ❌ 无统一的命名规范
- ❌ 敏感信息易泄露

**目标**:
- ✅ 单一 `.env` 文件（开发）
- ✅ `.env.example` 模板清晰
- ✅ 生产环境通过容器环境变量注入
- ✅ 统一命名：`ESSAY_COACH_*` 前缀

**涉及文件**:

```
Root:
- [ ] .env.example (创建/更新)
  # Django
  ESSAY_COACH_DEBUG=False
  ESSAY_COACH_SECRET_KEY=your-secret-key
  ESSAY_COACH_POSTGRES_USER=postgres
  ESSAY_COACH_POSTGRES_PASSWORD=postgres
  ESSAY_COACH_POSTGRES_DB=essaycoach
  
  # Dify AI
  ESSAY_COACH_DIFY_API_KEY=your-key
  ESSAY_COACH_DIFY_BASE_URL=https://api.dify.ai/v1
  
  # Frontend
  ESSAY_COACH_API_URL=http://127.0.0.1:8000

- [ ] .env (开发本地，.gitignore)
- [ ] .env.prod (生产配置示例)
- [ ] docs/ENVIRONMENT_SETUP.md (环境变量文档)

Backend:
- [ ] backend/essay_coach/settings.py (更新环变量加载)
  DEBUG = os.getenv('ESSAY_COACH_DEBUG', 'False').lower() == 'true'

Frontend:
- [ ] frontend/.env.local (移除，使用根目录 .env)
- [ ] frontend/next.config.ts (读取环变量)
```

**验收标准**:
- [ ] `.env.example` 完整且清晰
- [ ] 开发环境可通过 `.env` 配置
- [ ] 生产环境通过容器环境变量配置
- [ ] 无敏感信息在代码中

**Effort**: 3 小时

---

### Phase 4: 可选优化（**Month 2+**）

#### 4.1 缓存策略（Redis）

**目标**:
- ✅ API 响应缓存
- ✅ Token 黑名单存储
- ✅ Session 存储（可选）

**涉及文件**:
- `backend/essay_coach/settings.py` (Redis 配置)
- `backend/core/cache.py` (缓存工具)
- `docker-compose.yml` (Redis 服务)

**Effort**: 8 小时

---

#### 4.2 API 限流和监控

**目标**:
- ✅ 防止暴力攻击
- ✅ API 性能监控
- ✅ 错误追踪

**涉及文件**:
- `backend/middleware/rate_limit.py`
- `Prometheus/Grafana` 集成

**Effort**: 12 小时

---

#### 4.3 OAuth 集成（可选）

**目标**:
- ✅ Google/GitHub 单点登录
- ✅ 简化注册流程

**Effort**: 16 小时

---

## 📊 执行时间表

```
Week 1:
  ✅ Phase 1.1: Token 刷新机制 (6h)
  ✅ Phase 1.2: 去除客户端 Token 读取 (4h)
  ⏳ Phase 1.3: 认证状态统一 (开始)

Week 2:
  ✅ Phase 1.3: 认证状态统一 (完成)
  ✅ Phase 2.1: 请求拦截器 (6h)
  ✅ Phase 2.2: 中间件路由保护 (3h)

Week 3:
  ⏳ Phase 3.1: 移除 API Route 代理 (2h)
  ⏳ Phase 3.2: Docker 容器化 (8h)

Week 4:
  ⏳ Phase 3.3: Nginx 反向代理 (4h)
  ⏳ Phase 3.4: 环境变量标准化 (3h)

Month 2+:
  ⏳ Phase 4: 可选优化
```

---

## 🔍 验收和测试

### 单元测试

```bash
# Backend
uv run pytest backend/auth/

# Frontend
pnpm test
```

### 集成测试

```bash
# 本地开发
make dev

# 验证清单
- [ ] 登录成功
- [ ] 登出成功
- [ ] Token 自动刷新
- [ ] 无效 Token 重定向
- [ ] 所有 API 请求成功
```

### 性能测试

```bash
# 代理 vs 直连延迟对比
- [ ] 测试 10 个 API 调用平均延迟
- [ ] 对比 Phase 3.1 前后差异
```

---

## 📝 文档更新

每个 Phase 完成后更新以下文档：

- [ ] `docs/AUTHENTICATION.md` (完整认证流程)
- [ ] `docs/DEPLOYMENT.md` (生产部署指南)
- [ ] `docs/ENVIRONMENT_SETUP.md` (环变量配置)
- [ ] `frontend/README.md` (API 调用文档)
- [ ] `backend/README.md` (认证配置文档)

---

## 🚀 部署清单

### 本地测试

```bash
# Phase 1 完成后
make migrate
make dev
# 手动测试登录/登出/Token 刷新

# Phase 3 完成后
docker-compose up -d
# 访问 http://localhost 验证
```

### 生产部署

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 推送到 Registry
docker tag essaycoach-backend:latest registry.example.com/essaycoach-backend:latest
docker push registry.example.com/essaycoach-backend:latest

# 部署到 K8s（可选）
kubectl apply -f k8s/
```

---

## 📞 负责人和联系方式

| Phase | 负责人 | 状态 | 联系方式 |
| ----- | ------ | ---- | -------- |
| 1     | TBD    | 待定 | -        |
| 2     | TBD    | 待定 | -        |
| 3     | TBD    | 待定 | -        |
| 4     | TBD    | 待定 | -        |

---

## 参考资源

- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HTTP Cookie Security](https://owasp.org/www-community/controls/Cookie_Security)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Last Updated**: 2026-01-23
**Next Review**: 2026-01-30
