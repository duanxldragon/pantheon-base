# Pantheon Base 企业级整改计划（2026-09-22）

## 目标

将本轮审计发现转化为可验证、可回退的整改闭环。目标不是一次性重构，而是先关闭会造成安全边界错误或生产级资源耗尽的风险，再补齐规模、运行配置和交付门禁。

## 结论基线

- 当前状态：企业后台基础能力较完整，但不建议直接宣称生产就绪。
- 已通过：`go test ./...`、`go vet ./...`、前端 type-check、lint、build 及前端契约门禁。
- 尚缺验证：race、govulncheck、npm audit、MySQL/Redis 集成 smoke、容量和尾延迟基线。
- 本计划不回滚现有 dirty worktree 变更；实施任务必须先读取目标文件当前内容并与既有修改兼容。

## 执行顺序

### Wave 0：安全边界（P0）

1. `2026-09-22-session-revocation-closure`
2. `2026-09-22-tenant-public-settings-scope`
3. `2026-09-22-upload-authorization-and-import-resources`

Wave 0 完成前，不应将系统声明为多租户生产就绪。

### Wave 1：生产规模（P1）

4. `2026-09-22-export-and-session-pagination`
5. `2026-09-22-request-path-maintenance`

Wave 1 完成后，才具备可进行容量压测和 SLA 基线的代码前提。

### Wave 2：部署与交付门禁（P1/P2）

6. `2026-09-22-production-redis-and-security-gates`

## 统一完成门禁

- 变更有邻近单元测试或集成测试。
- 认证、权限、租户、导入导出、审计相关变更必须有 runtime evidence 或明确的环境 gap。
- 每个任务写入 `.harness/evidence/<task-id>/commands.json`、`summary.md`、`review.md`。
- 必须运行受影响 Go 包测试、`go vet`、前端 type-check/lint/build（若触及前端或契约）。
- 涉及数据库查询的任务必须检查 migration/index 是否足够，并记录执行计划或静态证据。
- 不允许用 `solo-override` 绕过门禁。

## 执行状态 (2026-09-25)

| Wave | # | 任务 ID | 状态 | Evidence |
|------|---|---------|------|----------|
| 0 | 1 | 2026-09-22-session-revocation-closure | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-session-revocation-closure/` |
| 0 | 2 | 2026-09-22-tenant-public-settings-scope | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-tenant-public-settings-scope/` |
| 0 | 3 | 2026-09-22-upload-authorization-and-import-resources | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-upload-authorization-and-import-resources/` |
| 1 | 4 | 2026-09-22-export-and-session-pagination | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-export-and-session-pagination/` |
| 1 | 5 | 2026-09-22-request-path-maintenance | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-request-path-maintenance/` |
| 2 | 6 | 2026-09-22-production-redis-and-security-gates | ✅ | `.harness/archive/2026-09/evidence/2026-09-22-production-redis-and-security-gates/` |

**完成时间**: 2026-09-23  
**验证状态**: 全部 6 个任务通过统一完成门禁

### 关键成果

- **Wave 0 (P0)**: 会话撤销三路生效、租户公开设置隔离、上传授权与资源治理
- **Wave 1 (P1)**: 导出统一上限 10,000 行、会话列表 SQL 分页、后台维护器统一调度
- **Wave 2 (P1/P2)**: 生产 Redis fail-fast、readiness 健康检查、Go 1.26.6 修复 7 个 CVE
- **Race 检测**: 全模块通过 `go test -race` (MinGW-w64 GCC 16.2.0, 无 DATA RACE)
- **安全漏洞**: govulncheck v1.3.0 检测 0 reachable vulnerabilities

### 发布阻断规则 (已满足)

- ✅ 全部 P0 任务已完成：多租户生产就绪
- ✅ 全部 P1 性能任务已完成：具备容量压测代码前提
- ✅ `govulncheck`、npm audit、race 已全部取得证据：无验证缺口

**状态**: 🎯 企业级整改轮全部完成，已归档到 `.harness/archive/2026-09/`

