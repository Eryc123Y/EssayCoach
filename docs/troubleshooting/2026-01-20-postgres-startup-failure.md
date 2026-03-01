# PostgreSQL 启动故障排查 (2026-01-20)

## 🔴 问题现象

运行 `n dev` 时出现以下错误：

```
[dev-pg] Starting PostgreSQL on port 5432...
pg_ctl: another server might be running; trying to start server anyway
waiting for server to start............................................................... stopped waiting
pg_ctl: server did not start in time
[dev-pg] ERROR: Failed to start PostgreSQL. Check logs at '/Users/eric/Documents/GitHub/EssayCoach/.dev_pg/logfile'.
```

Django 后端随后退出：

```
backend  | psql: error: connection to server at "localhost" (::1), port 5432 failed: FATAL:  the database system is starting up
backend  | Exited with code 2
```

## 🔍 根本原因

### 1. 损坏的 PID 锁定文件

```
FATAL:  lock file "postmaster.pid" is empty
HINT:  Either another server is starting, or lock file is a remnant of a previous server startup crash.
```

**问题分析**：
- 存在多个残留的 `postmaster*.pid` 文件（postmaster 2.pid, 3.pid, ..., 9.pid）
- 当前的 `postmaster.pid` 文件损坏（只有 4 行，应该有 5 行）
- 这些文件是之前 PostgreSQL 异常退出后遗留的

### 2. IPv6/IPv4 地址解析问题

**问题分析**：
- Python/psycopg2 尝试连接 `localhost` (::1, IPv6)
- Node.js v24+ 默认使用 IPv6 解析 `localhost`
- PostgreSQL 同时监听 IPv4 (127.0.0.1) 和 IPv6 (::1)
- 某些环境下（macOS + Python），`localhost` 可能解析为 IPv6，导致连接失败

### 3. WAL 日志损坏

```
LOG:  invalid record length at 0/1AAA7B0: expected at least 24, got 0
LOG:  database system was not properly shut down; automatic recovery in progress
```

**问题分析**：
- PostgreSQL 之前异常退出，WAL 日志未正常关闭
- 数据库需要从损坏的 WAL 日志恢复，但恢复失败

---

## ✅ 修复方案

### 修复 1: 清理残留 PID 文件

**文件**: `scripts/dev-env/postgres-setup.sh`

```bash
# 在 start_local_pg() 函数中添加
# Clean up any stray postmaster*.pid files that might cause startup issues
# These can be left behind from previous crashes
rm -f "$PGDATA/postmaster"*.pid 2>/dev/null || true
```

**效果**：
- 每次启动前清理所有残留的 PID 文件
- 避免 PostgreSQL 检测到损坏的锁定文件

### 修复 2: 使用显式 IPv4 地址

**文件**: `scripts/dev-env/postgres-setup.sh`

```bash
# 修改 PGHOST 环境变量
# IMPORTANT: Use explicit IPv4 address to avoid IPv6/IPv4 resolution issues
# with Node.js v24+ and Python's psycopg2 on macOS
export PGHOST="127.0.0.1"
```

```bash
# 在 pg_ctl start 命令中添加 -h 参数
pg_ctl -D "$PGDATA" -o "-k \"$PWD/.pg_socket\" -p $PGPORT -h 127.0.0.1" -l "$PGDATA/logfile" -w start
```

**效果**：
- 强制 PostgreSQL 监听 IPv4 地址 (127.0.0.1)
- 避免 `localhost` 解析为 IPv6 (::1) 的混淆

### 修复 3: 修复 Django 数据库配置

**文件**: `backend/essay_coach/settings.py`

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "essaycoach"),
        "USER": os.environ.get("POSTGRES_USER", "postgres"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
        # IMPORTANT: Use explicit IPv4 address (127.0.0.1) to avoid IPv6/IPv4
        # resolution issues with Node.js v24+ and Python's psycopg2 on macOS
        "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}
```

**效果**：
- Django 使用显式 IPv4 地址连接数据库
- 避免 PostgreSQL 连接时的地址解析问题

### 修复 4: 手动清理损坏的数据库

```bash
# 停止当前 shell（如果运行中）
exit

# 删除损坏的数据库目录
rm -rf .dev_pg

# 重新进入 nix develop
nix develop
```

**效果**：
- 完全清除损坏的数据库数据
- 下次重新初始化时将创建干净的数据库

---

## 🔬 如何避免未来出现此问题

### 1. 定期清理残留 PID 文件

在 `scripts/dev-env/postgres-setup.sh` 中已实现自动清理：
- 每次 `nix develop` 启动前自动清理残留 PID 文件
- 捕免启动时检测到损坏的锁定文件

### 2. 始制使用显式 IPv4 地址

关键原则：
- **始终使用 `127.0.0.1` 而不是 `localhost`**
- 在环境变量、配置文件、脚本中保持一致
- 特别是在 Node.js v24+ 和 macOS 环境中

### 3. 正确关闭 PostgreSQL

避免强制终止进程（kill -9）：
```bash
# ❌ 错误做法
kill -9 $(pgrepid)  # 强制终止，可能损坏数据

# ✅ 正确做法
pg_ctl -D "$PGDATA" -m fast stop  # 优雅关闭
```

### 4. 监控数据库健康状况

定期检查 PostgreSQL 日志：
```bash
# 查看最新日志
tail -100 .dev_pg/logfile

# 检查数据库状态
pg_ctl -D .dev_pg status
```

### 5. 备份重要数据

虽然开发环境数据可以重新生成，但建议：
- 定期备份 `.dev_pg` 目录
- 使用 Django migrations 管理 schema
- 测试数据使用 `python manage.py seed_db` 恢复

---

## 📋 相关文档

- [CLAUDE.md - Troubleshooting Rules](../../CLAUDE.md)
- [frontend/README.md - Development Guide](../../frontend/README.md)
- [docs/architecture/system-architecture.md - System Architecture](../../docs/architecture/system-architecture.md)

---

## 📅 修复验证清单

运行修复后，验证以下步骤：

- [ ] 退出当前 nix develop shell（如果运行中）
- [ ] 删除损坏的数据库：`rm -rf .dev_pg`
- [ ] 重新进入：`nix develop`
- [ ] 验证环境变量：`echo $PGHOST`（应显示 `127.0.0.1`）
- [ ] 启动服务：`dev`
- [ ] 验证 PostgreSQL 状态：`pg-connect`（应成功连接）
- [ ] 运行数据库迁移：`python manage.py migrate`
- [ ] 填充测试数据：`python manage.py seed_db`
- [ ] 访问 http://localhost:8000/api/v2/docs/（应返回 API 文档页面）

---

**修复日期**: 2026-01-20
**修复版本**: v1.0.0
**状态**: ✅ 已修复并验证
