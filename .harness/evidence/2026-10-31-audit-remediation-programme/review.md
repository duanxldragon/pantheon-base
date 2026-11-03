# Review — 2026-10-31-audit-remediation-programme

programme 不评审产品代码，只做两件事：**证明 9 个子包真的收了**，**证明 28 条审计条目没有静默遗漏**。

## 1. 9 个子包是否真的收口（不读散文，只读 manifest 与 evidence）

判据是 `scripts/harness/task-evidence-state.mjs` 引入的那条规则：manifest `status: completed`
必须有 evidence 目录下的 `commands.json` + `summary.md`，且任务文档 frontmatter 与之一致。
逐个核对结果：

| 子包 | manifest | 证据三件套 | 任务文档 frontmatter |
| --- | --- | --- | --- |
| W1 lowcode-generator-build | completed | 齐全 | Archived |
| W2 business-route-tenant-context | completed | 齐全 | Archived |
| W3 entry-doc-truthfulness | completed | 齐全 | Archived |
| W4 doc-lifecycle-archive | completed | 齐全 | Archived |
| W5 doc-metadata-and-index | completed | 齐全 | Archived |
| W6 dead-code-legacy-surface | completed | 齐全（收口时补齐 `knownGaps` 与 Machine Readable） | Archived |
| W7 token-cache-race | completed | 齐全 | Archived |
| W8 ci-checker-wiring | completed | 齐全 | Archived |
| W9 oidc-scaffold-decision | completed | 齐全 | Archived |

`check-task-packet` 92 文件 0 error；`check-evidence --strict` 12 文件 0 error；
`check-review --strict` 12 文件 0 error。

## 2. 28 条 → 着落表（逐条可追）

| 条目 | 类别 | 着落 | 状态 |
| --- | --- | --- | --- |
| AUD-001 | 功能完整性 | W1 | **已修复**（四处断裂一起闭合，含编译闸门与建表证据） |
| AUD-002 | 架构/安全/文档 | W2 | **已处置**（方案 C：业务域 V1 不参与租户隔离，合同 §2.6 + 结构断言） |
| AUD-003 | 文档准确性 | W3 | **已修复**（版本号单源、配额改"度量展示"、community files 列全） |
| AUD-004 | 文档/架构 | W3 | **已修复**（DESIGN 新增 §3.4 租户章，§3.3/§4.3/§9 更正） |
| AUD-005 | 过度设计 | W9 | **已处置**（删 587 行不可达实现；列与迁移保留，drop 登记为延后） |
| AUD-006 | 文档生命周期 | W4 | **已修复**（69 份任务包 → Archived） |
| AUD-007 | 文档索引 | W3 | **已修复**（designs 索引 62/62，如实声明 5 份缺 `.en.md`） |
| AUD-008 | 文档冗余 | W5 | **已修复**（字段定义只留 schema 一处，其余改指针） |
| AUD-009 | 文档一致性 | W5 | **已修复**（scope 矩阵 `dept/post` 改 tenant-owned 附行号，§4 区分已实现/未实现） |
| AUD-010 | 工程治理 | W5 | **已修复**（门禁自报覆盖范围与强制目录清单） |
| AUD-011 | 跨仓文档 | W4 | **已处置**（ops 侧副本属消费仓，base 侧登记并随 release 同步） |
| AUD-012 | 无效代码 | W6 | **已删除**（两个 hook + `scaffold.Generate`） |
| AUD-013 | 无效 schema | W6 | **已删除**（`000031` drop；down 形状经收口复核修正）。**生产执行归维护者**：W12 补了只读预检脚本 + 断言用例 + 执行规程（`docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md`） |
| AUD-014 | 重复 API | W6 | **已处置**（保留 + Deprecated + `Sunset: 2026-12-31`，下线属维护者 gate）。**W12 补了下线清单**（精确到文件与行号，`docs/runbooks/DECOMMISSION_LEGACY_AUTH_ROUTES_2026-12-31.md`） |
| AUD-015 | 工程成本 | W8 | **已修复**（race 每 PR 2→1，coverage 上传仍有输入） |
| AUD-016 | 文档可执行性 | W3 | **已修复**（`cd backend && go run ./cmd/server`，`system_init.sql` 标历史） |
| AUD-017 | 文档状态语义 | W4 | **已修复**（6 份未实现设计降 `Draft` + 未实现声明） |
| AUD-018 | 孤立文档 | W4 | **已修复**（6 份设计入链或降级） |
| AUD-019 | 索引 | W4 | **已修复**（7 份 `TENANT_*` 移入 `docs/reviews/` 并重算链接） |
| AUD-020 | 仅测试使用 | W6 | **已删除**（`readRoleKeysFromContext`，测试改 `common.GetRoleKeys`） |
| AUD-021 | 退役组件使用 | **W10（programme 之后）** | **已修复**（真正成因是门禁对该目录的整目录豁免，不是那行 import；撤豁免后被检文件 102→106，塞回 `FilterPanel` 会让门禁变红。残留 `AUD-021b`：目录本身 1,894 行死代码未删） |
| AUD-022 | 大组件 | **未立项** | 按设计不处理（审计原话"不建议为拆而拆"） |
| AUD-023 | 跨域依赖 | **未立项** | 按设计不处理（审计原话"可接受，出现第三个跨域依赖再抽契约"） |
| AUD-024 | 文档时间点 | W3 | **已修复**（删除 2026-10-03 门禁快照，改"以最近一次 required checks 为准"） |
| AUD-025 | 文档维护规则 | **W10（programme 之后）** | **已修复**（`frontmatter-check` 增加 90 天复核窗口计数 + `--report-overdue`，规则写入 `DOCUMENT_METADATA_AND_STATUS` §6.5 中英双版；实测 144 份逾期，刻意不阻断。残留 `AUD-025-review-round`：144 份需人工复核） |
| AUD-026 | 并发正确性 | W7 | **已修复**（2 × DATA RACE → 0，值拷贝 + RoleKeys 深拷贝） |
| AUD-027 | 工程治理 | W8 | **已修复**（11 个空转 checker 各有归宿，新接线的都负向验证过会红） |
| AUD-028 | 无效导出 | **W10（programme 之后）** | **已修复**（删除空转的 `context.WithTimeout`，原地写明为何不设 timeout；`go build`/`vet`/`gofmt` 三清） |

**着落口径（两个时点，别混读）**：

- **programme 收口时（2026-11-01 上午）**：28 = 23 已着落到子包 + 5 未立项。未立项的 5 条里
  2 条（AUD-022/023）是审计自己判定"不建议处理"，3 条（AUD-021/025/028）**仍 open**。
  当时明确拒绝"programme 收口 = 28 条全清"这种读法，并把 gap 写进 `residualFindings`。
- **现在（W10 之后）**：28 = 23 子包 + 3 由 W10 收口 + 2 按审计建议不处理。
  三条 P3 是**另立一包**做的，不是 programme 自己收的——所以这张表的"W10（programme 之后）"
  一列不能读成"programme 本来就算了"。

W10 的包与证据：`2026-10-31-audit-p3-residual-closeout` /
`.harness/evidence/2026-10-31-audit-p3-residual-closeout/`。三条各自都有负向读数，
且都在 `residualFindings` 里留了新的 P3 残留（`AUD-021b` / `AUD-025-review-round`）——
收口不是把问题清成零，是把问题说清楚。

**第三个时点（W12 之后）**：W12 没有关闭任何一条 P2——它做的是给三条 human-gated P2 补前置条件
（只读预检、下线清单、冻结宣告文本）。所以上表的"已处置/已删除"读的是**代码与文档侧**的完成态；
三条 P2 的**动作**（生产执行 DROP、真正下线 legacy 端点、签署冻结宣告）仍未发生，登记在
`.harness/STATUS.md` 的 open 残留表里。把 W12 读成"P2 已关闭"是错的。

另：`AUD-025-review-round` 的份数从 144 走到 143——W11 更新 `docs/designs/MODULE_CONTRACT.md`
（§4.3 真实内容变更）后它退出逾期集合，属规则期望的处置，不是数字漂移。

## 3. 7 项冻结门槛

全部达成，逐项读数见 `summary.md` 与各子包 `commands.json`。第 6 项带 human gate 残留
（legacy 端点真正下线、`000031` 生产库执行），第 7 项的 race 半边依赖 CI 的 `-race` 腿。

## 4. 收口复核的自我更正

- W6 的 `000031.down` 被复核推翻：初版以"往返 exit 0"为判据，实际重建出的表多一条
  `role_key` 全局唯一索引。改用 `SHOW CREATE TABLE` 逐字节对比后暴露，已修复 + 补回归用例。
  这条说明"命令能跑通"不等于"结果是那个结果"。
- W6 的 `commands.json` 自述 `check-evidence` passed，实际 FAIL（缺 `knownGaps`）。已更正。

## 5. 本 programme 不做什么

不代替维护者宣告冻结；不把 P3 包装成任务；不为了凑"全绿"去动 `pkg/security/ssrf`、
大组件、dashboard 缓存、`docs/harness` 与 `.harness` 的合并、历史评审报告。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-remediation-programme",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Closure is read from manifests and evidence rather than from prose: nine sub-packets are completed, each with the three evidence files on disk and a task doc whose frontmatter agrees, and the three strict checkers that enforce exactly that agreement (task-packet 94 files / evidence 15 files / review 15 files — the +2 in each over the programme's own 92/13/13 are the two follow-on packets, W10 and W11) report zero errors. The one P2 left open is the freeze declaration itself: the programme's own Human Gates put that act with the maintainer, so this packet delivers 9/9 and 7/7 readings and stops there rather than declaring the freeze on the maintainer's behalf. The landing table accounts for all 28 audit items, and it deliberately does not round up: 23 map to a sub-packet and 5 did not — two of those five (AUD-022 large components, AUD-023 cross-domain import) are items the audit itself recommended leaving alone, and three (AUD-021 retired FilterPanel, AUD-025 the 90-day Active review rule, AUD-028 the unused cancel export) were left open at programme closeout and written down as such rather than absorbed into a '28/28 cleared' claim. Those three were subsequently closed by a separate packet, 2026-10-31-audit-p3-residual-closeout, which is deliberately not counted as programme work: it removed a whole-directory gate exemption rather than the one stray import the audit described, added a reported-but-not-enforced 90-day review window over 144 overdue docs, and deleted a context.WithTimeout that bounded nothing because InitTracer takes no context — each with a negative reading, and each leaving a new P3 residue rather than a clean zero. The accounting therefore has two readings depending on when it is taken, and the table says which column is which. Seven freeze gates are met; two of them carry human gates that a programme cannot close on its own (the real teardown of the legacy /system/* auth routes on 2026-12-31, and executing the irreversible 000031 drop against production), and the race half of gate 7 is only observable while CI keeps its -race leg. The closeout review also overturned one of its own sub-packets: W6 had accepted 'up/down/up exits 0' as proof the migration rollback was faithful, but comparing SHOW CREATE TABLE between a schema migrated straight to version 30 and one migrated to 31 and rolled back showed the down file recreated a role_key-only unique index that 000024 had removed — a rollback that silently reinstates cross-tenant role_key uniqueness. That is fixed with a regression test proven to fail on the defective file, and W6's evidence that mislabelled its own strict-checker run as passing is corrected in place.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-remediation-programme/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-remediation-programme/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-remediation-programme/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/contracts/PLATFORM_CONTRACT.md",
      "docs/harness/HARNESS_ENGINEERING_CONTRACT.md"
    ]
  }
}
```
