# Summary — S1 `2026-10-27-s1-api-surface-narrowing`（收窄导出面）

分支 `refactor/s1-api-surface-narrowing-2026-10-27`（叠在 S1 删除波之上，两者都改
`error.go` 相邻 hunk）。实测本波 **3 文件 +11 / −9**。

## 做了什么（RC 编号对照）

| RC | 对象 | 处置 |
|---|---|---|
| RC-004 | `common.IsI18nMessageKey` | **改名 `isI18nMessageKey`**：唯一调用者是同文件 `ResolveErrorMessageKey`；`pkg/common/http/response.go` 的独立私有等价物按 packet 属 RC-019（S2 波），本波不合并 |
| RC-007 | `rbacbind.InsertRoleMenu` / `InsertUserRole`（单数） | **改名 `insertRoleMenu` / `insertUserRole`**：仅被同文件 `EnsureRoleMenu`(:100)/`EnsureUserRole`(:116) 调用；测试用的是批量复数变体，不受影响 |
| RC-029 | `permissionServiceErrorCode` | **保留（假阳性）**：packet 说"单一调用点"，漏了 `permission_handler_test.go:22` 直接驱动它。程序 Out 明确禁止改测试断言为重构让路，故恢复原名并补注释说明保留原因 |
| RC-006 | `database.RunAutoMigrate` | **保留导出**（packet 默认 + 人工门按 auto-mode 授权取默认 keep，待维护者复核）；实现时复核 0 调用者 |
| RC-008 | `contracts.ProtectedGroupWithRedis` | **保留导出**（packet 自身建议就是 keep + 记录） |

## 验证

- `go build ./...` / `go vet ./...` exit 0 —— 编译期探针证明被收窄的名字没有隐藏消费者
- 定向测试：`pkg/common/...`、`pkg/rbacbind/...`（0.234s）、`modules/system/iam/permission/...`
  （10.708s）全 ok / 0 FAIL
- `pantheon-ops/backend` `go build ./...` exit 0 —— overlay 不消费被收窄的名字
- grep 复核：`IsI18nMessageKey` 0 命中；单数 `Insert*` 仅存在于 `pkg/rbacbind` 内部

## 边界

- `route_groups.go` 与 `migrate.go` 在 doNotTouch，未改动（RC-006/RC-008 只记决策）。
- 未合并 pkg/common 与 pkg/common/http 的 key 逻辑（RC-019 属 S2，需等价测试）。
- 错误码映射行为零变化：`CodeForError` 仍是唯一映射，permission 错误类测试原样通过。
