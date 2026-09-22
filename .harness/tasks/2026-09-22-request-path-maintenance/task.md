# Task Packet — 2026-09-22-request-path-maintenance

## 目标

把 session inventory、登录日志 retention 等同步维护操作从普通读请求路径移出，降低尾延迟、锁竞争和不可预测的请求耗时。

## 范围

In：`governSessionInventory` 调用点、login/operation log retention 调用点、后台 job/显式维护接口、指标和测试。

Out：不删除保留策略；不降低审计保留要求。

## 验收标准

- 普通列表请求不执行全量 cleanup/purge。
- 维护任务具备互斥、节流、失败重试或明确告警策略。
- 保留策略仍可通过显式维护入口执行。
- 请求路径和后台维护路径分别有测试与日志/指标证据。
- 维护失败不会伪装成列表数据为空。

## 验证

```text
go test ./modules/auth/session ./modules/auth/login ./modules/system/audit
go vet ./modules/auth/session ./modules/auth/login ./modules/system/audit
```

## 依赖与证据

- blockedBy：export-and-session-pagination
- evidenceDir：`.harness/evidence/2026-09-22-request-path-maintenance`
- human gate：保留策略和运维触发方式需维护者确认。

