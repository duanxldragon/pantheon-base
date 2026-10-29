# W6 — 全量复跑与收口（2026-10-19-w6-reverification-closeout）

**Status**: completed
**Scope**: W1–W5 全量复跑、逐缺陷处置、环境清理、报告/状态/变更日志更新
**Baseline → 现状**: 179 / 193（14 失败，5 × P0）→ **193 / 193**；13 个缺陷中 12 个关闭，F14 显式降级
**Gate**: 三套验收全绿 + 全量后端测试 + 前端 type-check/lint + 环境终检

## 1. 一句话结论

用产生缺陷的同一套度量复跑：`tenant_acceptance.py` 136/136、`ui_walkthrough.cjs` 23/23、
`cross_tenant_leak.py` 34/34。每个缺陷都有独立证据和处置，不再用总分掩盖「哪个缺陷动了」。
唯一残留是 F14（P2，错误码形状），写明原因和修复路径。

## 2. 逐缺陷处置

见 `disposition.md`。摘要：

| 处置 | 缺陷 |
|---|---|
| closed | F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F13 |
| downgraded（写明原因 + 修复路径） | F14 [P2] |
| 不存在 | F12（基线预留，实际由 escalation guard 覆盖） |

## 3. 最终跑分

```
tenant_acceptance.py    RESULT: 136/136 checks passed (100.0%)
ui_walkthrough.cjs      UI RESULT: 23/23 passed
cross_tenant_leak.py    L0–L4: 34/34 passed; residual finding F14 [P2]
```

UI 的 `dept:tree` 与 `tenant-user-login` 都通过；后者已改为要求跳进 shell（旧脚本把停在 /login 当 PASS）。

## 4. 环境终检

```
schema_migrations                  27
active_ghost_members               0
tenant0_grants_on_tenant_roles     0
probe_policies                     0
probe tenants 295 / 297            archived
active tenants                     253 test-tenant, 281 e2e-repro-*, 282 acme-demo
```

253 / 281 是本次程序之前就存在的测试租户，未创建也未改动；本次探测创建的 295 / 297 已归档，
探测用户/角色/策略已按 `cleanup_leak_probe.py` 走 API + 精确 SQL 清理。

## 5. 门禁与测试

- 后端：`go build ./...`、`gofmt -l`（无输出）、`go vet ./...`、`go test -count=1 ./...`（46 个包 ok）。
- 前端：`tsc -b`、eslint（4 个改动文件）通过。
- 迁移：schema 24 → 27；000025 / 000026 / 000027 均幂等；000026 在探针库上验证了移动路径，
  000027 在真实库上把 9 条历史幽灵成员全部停用。

## 6. 剩余项与建议

1. **F14**：把跨租户角色成员类接口的 500 映射成 404/403；属于错误码整形，不影响隔离结论。
2. **平台作用域仍列出全部租户角色**（W1 known gap）：W5 已让「平台视角 / 租户视角」显式，但
   `ListRoles` 在平台作用域下仍跨租户；是否要收窄需要产品决定。
3. **无策略角色仍 fail-closed 500**：保持现状（安全默认），如果要给默认策略需要单独决策。
4. **部门表改为扁平行**后没有展开/折叠交互；如果产品需要树形，应单独做树表迁移。

## 5. W6+ 收口后跟进：F14 关闭（2026-10-19 14:15）

收口时唯一的残留 F14（P2：跨租户读角色成员返回 500 `request.failed` 而非 404/403）已按处置表
写明的修复路径落地：

- `role_handler.go` 新增 `roleErrorResponse`：`gorm.ErrRecordNotFound` / `common.ErrNotFound`
  → `404 role.not_found`（i18n 五语言补键），其余错误保持原 500 形状；8 个按 service 错误分支的
  角色端点统一改用它
- 回归测试 `role_handler_notfound_test.go`：not-found 三种包装 → 404，无关错误 → 500
- 实弹复验：重建二进制、重启（schema_migrations=27 不变、0 ERROR），全量 L0–L4 复跑
  **34/34、0 findings**；L1 实测 `code=404 msg=role.not_found`（成员/候选/改写/反向共 4 处）
- 探测夹具已清理：租户 B(298) 归档，租户 A(282) 无残留策略行

至此 13 个基线编号中 12 个关闭、F12 不存在、**F14 也已关闭，无任何降级项**。
证据：`cross_tenant_leak_f14_postfix.log`、`disposition.md`（F14 行已改 closed）。
