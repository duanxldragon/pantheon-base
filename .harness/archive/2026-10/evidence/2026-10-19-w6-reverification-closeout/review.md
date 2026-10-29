# W6 review — 全量复跑与收口

对照 `docs/contracts/TENANT_CONTRACT_V1.md`（§2.2 成员关系、§2.3.1 读写义务）、
`docs/contracts/PLATFORM_CONTRACT.md` 与父任务包 §验收标准，复核本次复跑与收口。

## 1. 度量一致性

复跑使用与基线完全相同的三套度量与同一运行环境（`pantheon_base`、`tenant_mode=multi`、后端 8081 / 前端 5174）：

| 套件 | 基线 | 收口 | 断言数 |
|---|---|---|---|
| `tenant_acceptance.py` | 130/136 | **136/136** | 136 |
| `ui_walkthrough.cjs` | 22/23 | **23/23** | 23 |
| `cross_tenant_leak.py` | 27/34 | **34/34** | 34 |
| **合计** | **179/193** | **193/193** | 193 |

断言总数未变，说明不是靠删减或放宽用例换来的绿。两处用例被修正后反而更严格：
`tenant-user-login` 旧版停在 `/login` 也算 PASS，现在要求真正进入 shell；`dept:tree` 从只数根节点改为验证子节点可见。

## 2. 逐缺陷处置

`disposition.md` 对每个 F-id 给出 closed / downgraded 与证据路径，满足父任务「聚合分数不能作为收口信号」的要求：

- 12 项 closed：F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F13。
- 1 项 downgraded：F14（P2，跨租户角色成员接口返回 500 而非 404/403，无数据泄露），写明修复路径，未声称已修。
- F12 标注为「不存在」，不是用「已关闭」凑数。

## 3. 门禁复核

- 后端 `go build ./...` / `gofmt -l`（无输出）/ `go vet ./...` / `go test -count=1 ./...`（46 包 ok）。
- 前端 `tsc -b`、eslint（4 个改动文件）通过。
- 迁移 `schema_migrations` 24 → 27；000025 / 000026 / 000027 幂等，000027 在真实库停用 9 条历史幽灵成员。
- 环境终检：`active_ghost_members = 0`、`tenant0_grants_on_tenant_roles = 0`、`probe_policies = 0`；探测租户 295/297 已归档。

## 4. 未关闭项（显式）

| 项 | 级别 | 说明 |
|---|---|---|
| F14 错误码整形 | P2 | 不影响隔离结论；需要单独任务把 tenant-scope miss 映射为 404。 |
| 平台作用域列出全部租户角色 | 产品决策 | W5 已让视角显式，是否收窄 `ListRoles` 需维护者决定。 |
| 无策略角色 fail-closed 500 | 设计决策 | 安全默认保持不变；若需默认策略应另立任务。 |
| 部门扁平表无展开/折叠 | 体验 | 已满足 F6 的「子部门可见」；树表交互是独立需求。 |

## 5. 复核结论

193 项断言全绿，每个缺陷都有独立处置，无 P0/P1 残留；剩余项均为已记录的产品/体验决策或 P2 错误码整形。
本波可以收口，父任务状态改为 completed，交付判定为「可交付，附书面限制」。

## Machine Readable

```json
{
  "taskId": "2026-10-19-w6-reverification-closeout",
  "verdict": "approved with documented P2 follow-up",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w6-reverification-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w6-reverification-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w6-reverification-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
