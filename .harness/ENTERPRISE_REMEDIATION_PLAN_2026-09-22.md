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

## 发布阻断规则

- 任一 P0 任务未完成：阻断多租户或高敏配置生产发布。
- 任一 P1 性能任务未完成：允许小规模内部试运行，但不得承诺高并发 SLA。
- `govulncheck`、npm audit、race、MySQL/Redis smoke 未全部取得证据：发布说明必须标记为验证缺口。

