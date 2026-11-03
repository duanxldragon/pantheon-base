# Summary — 2026-10-31-audit-p2-doc-metadata-and-index

## AUD-008：三份规范为什么保留 contracts 版

三份文件都在定义同一套约定，但只有一份被检查器实现：

| 文件 | 改前 | 改后 |
| --- | --- | --- |
| `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md` | 321 行，字段定义 + 目录映射 + 校验命令 | **唯一权威**，新增 §11 覆盖范围 |
| `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md` | 302 行，§2 又写一遍字段清单与示例 | §2 改为指针，只保留 §3 `doc_type` 与 §4 `status` 的取值语义 |
| `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` | 102 行，独立约定（字段、状态、README 规则） | 12 行指针 + `status: Archived` |

判据是“同一个问题只有一个答案”：`scripts/frontmatter-check.mjs` 实现在 contracts 版（`REQUIRED_BASE_FIELDS`、
`linked_contracts` 条件必填、`index_group`/`retention_reason` 目录映射），所以 contracts 版留作权威，
另两份不再重复定义。harness 版没有直接删除——删除需单独立项，且 `HARNESS_ENGINEERING_CONTRACT` 仍引用其路径；
改为指针并归档后，两处引用同时改为指向 schema。

副作用：`HARNESS_ENGINEERING_CONTRACT`(zh/en) 的文档治理条款原先把 `DOCUMENT_FRONTMATTER_SPEC.md`
称作校验依据，等于把一份从未被门禁实现的文件当权威。本次改为引用 schema，并注明旧文件已归档。

## AUD-009：两处与代码相反的结论

1. **`system_dept` / `system_post`**：原文归 `platform-global`（倾向），理由是“组织是组织，租户是租户”。
   代码是相反的：两表都带 `tenant_id`，service 嵌入 `tenant.Scoper`（`dept_service.go:28`、`post_service.go:26`），
   创建时写 `TenantID: s.TenantOwnerID()`（`:88`、`:144`），读写走 `s.Scoped(...)` 过滤。改为 `tenant-owned`
   并把这些行号写进表格。
   **影响面**：任何按原文做数据权限设计的下游，都会把部门/岗位当成跨租户共享，从而漏掉租户内过滤。
2. **§4 租户识别方式**：原文写“全部待决策，禁止按示例实现”，而 `X-Tenant-Id` + 会话 claim 早已实现并冻结。
   改为两节：§4.1 已实现（`X-Tenant-Id` 仅平台能力可指定 / 会话 claim 切换重签 / compat 固定 `tenant_id = 0`），
   §4.2 仍未实现（子域名、自定义域名、客户端自带 claim）。deny-by-default 语义标注为已冻结而非待决。
3. **`biz_*` 登记行**：加 V2 预留说明——截至合同 V1.10 无业务表登记、无业务表带 `tenant_id`，
   与合同 §2.6 逐字一致。这一条是 W2 定下业务域单租户语义后必须补的，否则读者会把预留行读成现状。

中英两份同步改，避免出现“中文已更正、英文还是待决策”的新漂移。

## AUD-010：为什么选“声明边界”而不是“扩大强制”

方案 (a) 一次性把 `docs/designs`、`docs/contracts`、`docs/api`、`docs/operations` 纳入强制，等于让
113 份无元数据文档在同一个 PR 里变红。剩下的只有两种走法：阻塞所有 PR，或加一份永不缩减的白名单——
后者正是 `AI_QUALITY_GOVERNANCE` 记录过的失败模式。

选 (b) 后门禁做三件事：

1. 打印扫描总数与带元数据数（`415 / 302 / 113`）；
2. 打印强制目录与强制文档数（4 个目录、4 份文档）；
3. 在 schema §11 写明强制与不强制目录及理由，并规定“扩大强制必须同时改 §11 与 `ENFORCED_DIR_PREFIXES`”。

这样“全绿”的含义从“全部合规”变成“被检查部分合规”，与事实一致；同时留下一条明确的升级路径。

## W4 遗留：7 份 legacy 任务包补齐 frontmatter

这 7 份以 `# Task Packet:` 开头、没有 YAML 头，W4 的机械判据对它们只能返回“状态无处落”。本次补齐：

- `title` 取自各自 `.harness/archive/<月份>/tasks/<id>/manifest.json`，不另行编写；
- `layer` 取自各自文档的 `## Primary Layer` 段（`2026-09-02-foundation-release-v0-10-26-and-ops-sync`
  因此为 `inheritance-sync`，其余为 `platform`），不按印象填；
- `status: Archived`，与 manifest `completed` 及已归档证据一致；
- `linked_contracts` 指向实际相关合同：6 份指向 `PLATFORM_CONTRACT`，发布文档对齐那份指向
  `DOCUMENT_GOVERNANCE_CONTRACT`，租户就绪那份指向 `TENANT_CONTRACT_V1`。

结果：`docs/harness/tasks/*.task.md` 92/92 带 frontmatter，`grep -L '^---$'` 输出 0；
`--report-legacy` 的旧式正文元信息头计数归零。

## 显式 gap

- 方案 (a) 未做，113 份文档仍不带元数据（schema §11.2 已声明）。
- scope 矩阵 §5 “维护责任”仍是 2026-09-10 的历史登记，未改（不在 AUD-009 的三处范围内）。
- `scripts/harness/check-task-packet.mjs` 仍未校验 doc status 与证据是否一致（W8 接线）。
