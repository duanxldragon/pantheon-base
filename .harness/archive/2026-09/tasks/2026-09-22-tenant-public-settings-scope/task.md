# Task Packet — 2026-09-22-tenant-public-settings-scope

## 目标

使公开设置查询和缓存严格遵守当前租户上下文，避免多租户模式下进程级 `publicCache` 跨租户复用。

## 范围

In：`backend/modules/system/config/setting/**`、tenant context、公开设置路由和测试。

Out：不实现完整 SaaS 租户管理、不改变单租户兼容模式行为。

## 验收标准

- multi mode 下查询使用 `tenantScope()` 或等价明确 scope。
- cache key 包含 tenant namespace；compat/global 行为保持兼容。
- tenant A/B 的同名 public setting 不会互相覆盖或读取。
- 更新、刷新、跨实例 refresh signal 后本地缓存失效语义有测试。
- `/setting/public` 的公开接口行为、是否允许 tenant header、错误码在合同中写清。

## 验证

```text
go test ./modules/system/config/setting ./internal/middleware ./pkg/tenant
go vet ./modules/system/config/setting ./internal/middleware ./pkg/tenant
```

## 依赖与证据

- blockedBy：none
- blocks：export-and-session-pagination
- evidenceDir：`.harness/evidence/2026-09-22-tenant-public-settings-scope`
- human gate：多租户隔离语义需维护者确认。

