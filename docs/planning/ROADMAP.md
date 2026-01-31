# EssayCoach 开发路线图

**更新日期**: 2026-01-23 | **状态**: 规划中

---

## 🎯 核心目标

1. **安全性**: 解决认证机制的 XSS 风险和 Token 管理问题
2. **可维护性**: 统一认证状态管理，减少复杂度
3. **生产就绪**: 完整的容器化部署方案和监控

---

## 📅 Q1 2026 里程碑

### Week 1: 认证安全加固（🔴 关键路径）

**开始日期**: 2026-01-27  
**预期完成**: 2026-02-02  
**工作量**: 14 小时

#### 核心任务

1. **Token 刷新机制** (6h)
   - 实现 JWT 或双 Token（Access + Refresh）
   - Django 后端刷新端点
   - 前端自动刷新逻辑

2. **去除客户端 Token 读取** (4h)
   - 移除 `document.cookie` 访问
   - 实现 HttpOnly Cookie
   - 测试 XSS 防护

3. **认证状态统一** (4h)
   - 迁移到 Zustand
   - 原子化登录/登出
   - 移除 React Context 重复

**验收标准**:
- ✅ 所有认证测试通过
- ✅ 无安全漏洞扫描告警
- ✅ Token 不在客户端 JavaScript 可见

---

### Week 2-3: 认证完善（🟡 高优先级）

**开始日期**: 2026-02-03  
**预期完成**: 2026-02-16  
**工作量**: 12 小时

#### 核心任务

1. **请求拦截器标准化** (6h)
   - 统一的 API client
   - 401 自动重试
   - 全局错误处理

2. **中间件路由保护** (3h)
   - Next.js 中间件
   - Token 验证
   - 自动重定向

3. **测试和文档** (3h)
   - 单元测试
   - 集成测试
   - API 文档更新

**验收标准**:
- ✅ 无未授权访问 Dashboard
- ✅ 所有 API 集成测试通过
- ✅ 性能基准测试完成

---

### Week 4: 生产部署基础（🟡 中优先级）

**开始日期**: 2026-02-17  
**预期完成**: 2026-02-23  
**工作量**: 14 小时

#### 核心任务

1. **移除 API Route 代理** (2h)
   - 前端直连 Django
   - 移除 77 行代码
   - 测试 API 延迟改进

2. **Docker 容器化** (8h)
   - Django Dockerfile
   - Next.js Dockerfile
   - docker-compose.yml 完整配置
   - 健康检查

3. **Nginx 反向代理** (4h)
   - 统一入口配置
   - 路由规则
   - SSL/TLS 支持

**验收标准**:
- ✅ `docker-compose up` 启动成功
- ✅ 所有服务健康
- ✅ http://localhost 可访问

---

## 📊 工作量预估

| 阶段           | 周期        | 人天 | 优先级 | 状态 |
| -------------- | ----------- | ---- | ------ | ---- |
| 认证安全加固   | W1          | 2    | 🔴 高  | 待启 |
| 认证完善       | W2-3        | 1.5  | 🟡 中  | 待启 |
| 生产部署基础   | W4-5        | 1.75 | 🟡 中  | 待启 |
| 优化和文档     | W6+         | 1    | 🟢 低  | 待启 |
| **总计**       | **6 周**    | **6** | -      | -    |

---

## 🔄 依赖关系

```
Week 1: 认证安全加固
  └─ Week 2: 认证完善
      └─ Week 3: 生产部署
          └─ Week 4: 优化和文档
```

**关键路径**: 安全性 → 完善 → 部署

---

## 👥 团队分工建议

### 安全性团队（优先）

**负责人**: [待分配]  
**任务**: Phase 1.1, 1.2, 1.3

```
- Token 刷新机制（2h）
- HttpOnly Cookie 实现（2h）
- 状态管理重构（4h）
- 测试和验证（4h）
```

### 后端团队

**负责人**: [待分配]  
**任务**: Token 刷新端点、CORS 配置、Docker 化

### 前端团队

**负责人**: [待分配]  
**任务**: 拦截器、中间件、状态管理、UI 测试

---

## 🔐 安全检查清单

### Phase 1 安全性验证

- [ ] Cookie 设置 `HttpOnly: true`
- [ ] Cookie 设置 `Secure: true`（HTTPS）
- [ ] Cookie 设置 `SameSite: Strict`
- [ ] 无 `document.cookie` 访问
- [ ] 无 Token 在 localStorage
- [ ] CORS 白名单严格配置
- [ ] CSRF Token 验证（如使用）
- [ ] Token 过期时间 < 1 小时
- [ ] Refresh Token 有效期 > 7 天
- [ ] 登出清除所有 Token

### Phase 3 部署安全性

- [ ] Docker 镜像签名验证
- [ ] 环境变量不在镜像中
- [ ] 敏感信息通过 secrets 管理
- [ ] 网络隔离（Docker networks）
- [ ] HTTPS 强制（Nginx）

---

## 📈 性能基准

### 当前状态（Phase 0）

```
API 延迟（带代理）: 120-150ms
  Browser → 127.0.0.1:5100 (Next.js)
      ↓ 10-20ms
  Next.js → 127.0.0.1:8000 (Django)
      ↓ 100-130ms
  Django → PostgreSQL
      ↓ 10-50ms
  返回响应
```

### 目标状态（Phase 3）

```
API 延迟（无代理）: 100-130ms
  Browser → 127.0.0.1:8000 (Django)
      ↓ 100-130ms
  Django → PostgreSQL
      ↓ 10-50ms
  返回响应

改进: -20-30ms（~15-20% 性能提升）
```

### 测试方法

```bash
# 使用 Apache Bench
ab -n 100 -c 10 http://localhost:5100/api/v1/rubrics/

# 对比 Phase 1 前后
before_avg=125  # ms
after_avg=100   # ms
improvement=$((($before_avg - $after_avg) * 100 / $before_avg))
echo "改进: ${improvement}%"
```

---

## 🧪 测试策略

### 单元测试

```bash
# 后端认证测试
make test-auth

# 前端服务层测试
cd frontend && pnpm test
```

### 集成测试

```bash
# 本地完整流程
make dev

# 手动测试清单
- [ ] 登录
- [ ] 访问 Dashboard
- [ ] 编辑 Rubric
- [ ] 提交作业
- [ ] Token 刷新（检查网络包）
- [ ] 登出
- [ ] 访问受保护路由（应重定向）
```

### 安全测试

```bash
# XSS 测试
# - 尝试在评论中注入 <script>
# - 验证 Token 无法通过 JavaScript 访问

# CORS 测试
# - 从其他源的 AJAX 请求应被拒绝

# 暴力破解测试
# - 检查登录端点限流
```

### 性能测试

```bash
# 部署后性能基准
./scripts/benchmark.sh before-phase-3
./scripts/benchmark.sh after-phase-3
```

---

## 📚 文档计划

### 更新现有文档

1. **README.md**
   - 添加快速启动命令
   - 更新架构图

2. **docs/DESIGN_PHILOSOPHY.md**
   - 保持现有 "Academic Precision" 设计原则

3. **AGENTS.md**
   - 更新开发环境说明

### 新增文档

1. **docs/AUTHENTICATION.md** (新)
   - 完整认证流程图
   - Token 刷新机制说明
   - Cookie 安全配置

2. **docs/DEPLOYMENT.md** (新)
   - 容器化部署
   - Nginx 配置
   - 生产检查清单

3. **docs/ENVIRONMENT_SETUP.md** (新)
   - 环境变量完整列表
   - 开发 vs 生产配置差异

4. **docs/API_CLIENT.md** (新)
   - 前端 API 调用文档
   - 拦截器使用方法
   - 错误处理指南

---

## ⚠️ 风险和缓解措施

### 风险 1: 认证 Token 泄露（严重）

**现象**: XSS 攻击获取 Token  
**影响**: 用户账户被劫持  
**缓解**:
- Phase 1.2 中实现 HttpOnly Cookie
- 定期安全审计
- Content Security Policy (CSP) 配置

**优先级**: 🔴 立即

---

### 风险 2: API 延迟增加（低）

**现象**: Phase 3 移除代理后发现 Django 性能差  
**影响**: 用户体验下降  
**缓解**:
- 提前进行性能测试
- 识别 Django 瓶颈
- 实施缓存策略（Phase 4）

**优先级**: 🟡 监控

---

### 风险 3: 容器化失败（中）

**现象**: Docker Compose 启动服务挂起  
**影响**: 无法部署  
**缓解**:
- 逐步测试（先 Postgres，再 Django，再 Next.js）
- 使用健康检查确保就绪
- 完整的错误日志记录

**优先级**: 🟡 风险缓解

---

## 🎓 学习资源

### 推荐阅读

1. **Django Token Authentication**
   - https://www.django-rest-framework.org/api-guide/authentication/

2. **Next.js Middleware and Cookies**
   - https://nextjs.org/docs/app/building-your-application/routing/middleware

3. **HTTP Security Headers**
   - https://owasp.org/www-project-web-security-testing-guide/

4. **Docker Best Practices**
   - https://docs.docker.com/develop/dev-best-practices/

### 团队培训

- Week 1: 认证机制培训（1h）
- Week 3: Docker 基础培训（2h）
- Week 4: 安全审计工作坊（2h）

---

## 🚀 部署清单

### 本地验证（每个 Phase 完成后）

```bash
# Phase 1 完成后
make migrate
make dev
# 手动验证登录/登出/Token 刷新

# Phase 3 完成后
docker-compose up -d
# 验证所有服务启动
docker-compose ps
# 访问 http://localhost 和 http://localhost/api/v1/rubrics/
```

### 暂存环境部署

```bash
# 在 staging 环境部署完整 Phase 3 方案
docker-compose -f docker-compose.staging.yml up -d

# 运行完整的集成测试
./scripts/integration-test.sh staging
```

### 生产部署

```bash
# 1. 验证所有测试通过
make test

# 2. 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 3. 推送到容器仓库
docker-compose -f docker-compose.prod.yml push

# 4. 部署到生产
# - Kubernetes 或
# - Docker Swarm 或
# - 云服务（AWS ECS，Azure ACI 等）

# 5. 健康检查和监控
# - 检查所有服务运行状态
# - 验证 API 响应
# - 监控日志和指标
```

---

## 📞 沟通和审批

### 每周同步

- **时间**: 每周一 10:00 AM
- **参与**: 产品、后端、前端、QA
- **内容**: 进度报告、风险识别、问题解决

### Phase 完成审批

| Phase | 审批人 | 标准                  |
| ----- | ------ | --------------------- |
| 1     | 安全   | 安全审计通过          |
| 2     | 产品   | 集成测试 100% 通过    |
| 3     | 运维   | 容器启动和健康检查通过 |
| 4     | 所有   | 生产检查清单 100% 完成 |

---

## 版本发布计划

### v1.1 (目标: 2026-02-28)

**内容**:
- ✅ 认证机制重构（Phase 1）
- ✅ 认证完善（Phase 2）
- ✅ 基础部署方案（Phase 3）

**发布类型**: Minor Release

**发布说明**:
```markdown
## v1.1.0 - 2026-02-28

### 🔐 安全改进
- Token 刷新机制
- HttpOnly Cookie 安全加固
- XSS 防护

### 🏗 架构改进
- 统一认证状态管理
- Docker 容器化部署
- Nginx 反向代理配置

### 🐛 Bug 修复
- 修复 Token 过期导致的白屏
- 修复 CORS 错误

### 📚 文档
- 完整的认证文档
- 部署指南
```

---

## 📋 相关文件

- [ARCHITECTURE_TODO.md](./ARCHITECTURE_TODO.md) - 详细任务清单
- [AGENTS.md](./AGENTS.md) - 开发环境配置
- [README.md](./README.md) - 项目概述

---

**下次审查日期**: 2026-01-30
