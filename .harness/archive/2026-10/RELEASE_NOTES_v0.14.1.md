# Release v0.14.1 (Patch)

发布日期：2026-09-29

## 概要

v0.14.0 之后的收口 patch，无功能性变更。

## 变更内容

- **fix(deps)**: 补齐 tenant 测试缺失的依赖声明（`stretchr/testify`、`gorm.io/driver/sqlite`），修复干净环境跑 `system/iam/tenant` 测试时的解析失败。
- **chore(harness)**: 将 `.harness/tasks/2026-09-29-ops-ssrf-protection-integration` 的 manifest 状态从 `in-progress` 同步为 `completed`（ops 仓库侧已于 2026-09-29 完成，base 内为同步副本）。

## 验证 evidence

- `go mod tidy` 通过，`go.sum` 无额外变更
- `go vet ./pkg/... ./modules/system/iam/...` 通过
- `go test ./modules/system/iam/tenant/` 编译通过

## 兼容性

完全向后兼容，无 Breaking Changes。
