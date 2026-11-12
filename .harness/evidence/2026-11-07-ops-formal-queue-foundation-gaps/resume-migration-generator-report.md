平台层 P0 已修复并完成定向验证。dirty 状态在 schema 推断前以 `migrate.ErrDirty` 拒绝启动，原记录保留；readiness 拒绝 dirty、损坏及歧义状态，fresh／legacy／clean 兼容行为保持可用。

修改仅限：

- [migrate.go](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/migrate.go:109)：启动保护与 readiness。
- [migrate_test.go](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/migrate_test.go:452)：替换自动恢复预期。
- [migrate_dirty_bootstrap_test.go](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/migrate_dirty_bootstrap_test.go:19)：真实 MySQL 回归。

验证结果：

- `go test -race -count=1 -json -timeout 10m ./pkg/database` → **0**，161.787 秒，零失败／跳过。
- 75 个 dirty、48 个未知状态、8 个兼容用例通过。
- `go vet ./pkg/database`、`go build ./pkg/database`、diff／gofmt 检查 → **0**。
- 隔离测试库剩余 **0**；修复前红灯和后续失败记录均保留。

精确文件路径、SHA256、命令退出码及证据哈希见[最终收据](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-migration-receipt.json)。

本 adapter 工作完成；独立评审、完整共享发布及 Ops 消费仍由 root 收口，未声明任务批准。
