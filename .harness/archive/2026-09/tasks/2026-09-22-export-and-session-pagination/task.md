# Task Packet — 2026-09-22-export-and-session-pagination

## 目标

消除全量导出和全量会话扫描，将分页、过滤、统计和导出上限统一为数据库可控的生产规模实现。

## 范围

In：i18n、setting audit、post、dict 等导出路径，`auth/session.ListAllSessions`，相关 DTO、索引和测试。

Out：不引入异步任务系统，除非现有同步 hard cap 无法满足合同；不改变导出字段格式。

## 验收标准

- 每个同步导出都有统一 hard cap，并在响应或错误码中可识别截断/超限。
- 会话过滤下推 SQL，数据库执行 `COUNT` 与 `LIMIT/OFFSET` 或 keyset，不再全量 Scan 后内存分页。
- active/revoked/total 统计与分页结果一致。
- 对关键查询检查索引和 `EXPLAIN`，记录静态或运行时证据。
- 大数据 fixture 或 benchmark 覆盖上限、分页和内存行为。

## 验证

```text
go test ./modules/auth/session ./modules/system/i18n ./modules/system/config/setting ./modules/system/org/post ./modules/system/config/dict
go test -bench . ./modules/auth/session ./modules/system/i18n ./modules/system/config/setting
go vet ./modules/auth/session ./modules/system/i18n ./modules/system/config/setting ./modules/system/org/post ./modules/system/config/dict
```

## 依赖与证据

- blockedBy：session-revocation-closure、tenant-public-settings-scope
- blocks：request-path-maintenance
- evidenceDir：`.harness/evidence/2026-09-22-export-and-session-pagination`
- human gate：导出兼容性和容量上限需维护者确认。

