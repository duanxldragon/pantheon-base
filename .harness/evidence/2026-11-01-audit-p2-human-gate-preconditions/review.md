# Review — 2026-11-01-audit-p2-human-gate-preconditions

## 结论

**approved with documented P2 follow-up。**

三条 P2 的动作全部保留给维护者，本包只补前置条件。判定为"通过并附已记录的 P2 后续"而不是
"通过"，是因为三条 P2 本身**仍未关闭**——它们的状态没有因为本包而改变，改变的是"能不能执行"。

## 逐条 reviewer posture

### 1. 预检脚本是只读的

`000031_preflight.sql` 六条语句逐条核对：全是 `SELECT`。没有 `FOR UPDATE`、没有 `LOCK`、
没有临时表、没有 `information_schema` 之外的写路径。文件头写了 READ ONLY 与理由。

一处需要注意：脚本**故意不做容错分支**。表不存在时第 3/6 条会直接报错。这不是缺陷——
只读脚本一旦开始分支判断（"如果表不存在就跳过"），执行者就无法确认自己看的是哪一条读数。
runbook §4.1 明确写了 version=31 时这是预期行为。

### 2. 预检不可能低估行数

这是本包唯一真正重要的性质：`rows_to_be_dropped` 是执行者批准破坏性 DDL 的依据。

- 第 3 条是 `SELECT COUNT(*) FROM permission_role_data_scope_policy`，无 WHERE、无 LIMIT、
  无租户过滤。**故意不加任何过滤**：加 `tenant_id = 0` 或按角色过滤都会低估。
- 第 6 条 `LIMIT 20` 只用于人眼抽样，不参与计数。
- 负向 A 把第 3 条改成 `WHERE 1=0`，用例红在
  `preflight reports rows_to_be_dropped=0, want 2`。这是唯一能证明"低估会被抓住"的验证。

反向检查（我自己找的漏洞）：如果将来有人为了"只看有效行"给第 3 条加 `WHERE`，负向 A 不会红
（因为它测的是 0 与 2 的差别，不是过滤条件）。这条风险靠 runbook §4.1 的读数表承担——表里写明
"第 3 条 = 将销毁的行数，不加过滤"。它是文档约束，不是测试约束。**这一点记在这里，因为它是
本包最弱的一环。**

### 3. 预检不随二进制发布，且该性质有断言

`migrate.go:21` 是 `//go:embed migrations/*.sql`，不递归，子目录天然不进 `migrationFS`。
但这是**模式**的性质，不是目录的性质——有人把模式改成 `migrations` 就会把预检脚本当成迁移文件。

测试里加了断言 `migrationFS.ReadFile("migrations/preflight/...")` 必须失败，并负向验证过
（改模式 → `preflight script is embedded in migrationFS`）。所以这条性质不靠注释维持。

### 4. 三条 P2 的动作没有被代做

逐条核对：

- `AUD-013-prod`：没有对任何生产库执行语句；预检只在 `testmysql` 的一次性库上跑。
- `AUD-014-followup`：`module.go`、`csrf_middleware.go`、`casbin_middleware.go` 一行未改
  （`git status` 显示这三个文件 modified，但那是 W6 的改动，本包未追加）。
- `FREEZE-DECLARATION`：宣告文本 `status: Draft`，签署块全空。

### 5. 冻结宣告未签署，且写明不能签的真实原因

宣告 §1 没有写"待维护者择期签署"这类含糊话，而是写了具体事实：HEAD `ef00738`、
`VERSION 0.18.1`、150 modified / 9 deleted / 49 untracked、整改产物未进 `main`。
结论是"今天不具备签署条件，且原因不是流程性的"。

反向检查：这段话会不会让读者以为本包没做完？会——但那是事实。把"整改完成"写成"可以冻结"
才是错的：冻结的对象是提交，而包含整改的提交还不存在。

### 6. 读数是否可复现

`commands.json` 里 22 条命令全部带 `cwd` 与读数。三条需要说明：

- `go test -short ./...` 的 `ok=47 / FAIL=0`：第一次跑时用管道接 `tail`，退出码来自 `tail`
  而不是 `go test`，读数不可信。重跑时把输出重定向到文件并显式 `echo EXIT=$?`，
  才得到可信读数。**这条记在这里，因为它是我自己差点用错的读数方式。**
- `-race` 未跑（本机需 `PATH` 加 msys64/mingw64/bin）。竞争读数引自 W7 证据，不是本次实测。
  宣告 §3.1 显式写了这一点，没有把 W7 的读数冒充成本次的。
- `tsc -b` 与本包改动无关（本包未改前端），跑它是为了确认工作区基线干净。

## 发现的残留（新增 1 条 P3）

`AUD-013-ops-migrate-entry`（P3）：`k8s/README.md:52` 写 "run migrations manually"，
但 `Dockerfile:41` 只构建 `./cmd/server`，镜像内没有手工迁移入口；而 `PANTHEON_AUTO_MIGRATE=false`
恰恰意味着迁移在启动时自动执行。可用的入口 `cmd/tenantmigration` 只在仓库内，且名字与职责不符。

当前不造成故障（自动路径有效），但它会让"按文档手工迁移"的操作者找不到入口。修法二选一：
把 `tenantmigration` 打进镜像并在文档给出命令，或改掉 README 措辞承认迁移随部署自动执行。
**本包不改它**——它属于部署制品设计，不在"补 human gate 前置条件"的范围内。

## 遗留（不在本包可关闭范围）

1. `AUD-013-prod`（P2）：预检与执行规程就绪，仍需维护者选放行路径并执行；另需 `000031`
   先合入 `main`（当前 untracked）。
2. `AUD-014-followup`（P2）：清单与执行步骤就绪，仍需维护者书面确认无外部集成方。
3. `FREEZE-DECLARATION`（P2）：文本就绪，仍需整改产物进 `main` 后由维护者签署。

三条均不阻断冻结（冻结本身也在这三条里，这是 programme 的原始设计，不是本包的疏漏）。

## Machine Readable

```json
{
  "taskId": "2026-11-01-audit-p2-human-gate-preconditions",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "The three P2s this packet addresses are all actions that belong to the maintainer, so the packet deliberately performs none of them. What it does instead is remove the reason they were not executable: AUD-013-prod asked a human to confirm a table's rows are disposable, while nothing existed that could report how many rows there were, so the packet adds a six-statement read-only preflight script and a test that asserts every number it surfaces on a real schema-30 database seeded with two rows, then actually applies 000031 to confirm the prediction held. The preflight is safety-critical in a narrow sense that shaped its design: rows_to_be_dropped is the number a human approves an irreversible DROP against, so it carries no WHERE clause and no tenant filter, because any filter would under-report, and the negative verification changes it to WHERE 1=0 and confirms the test fails on that exact assertion rather than somewhere else. The script is embedded by the test rather than copied into the runbook, since a copy drifts the first time the table shape changes and then the operator runs a different file than the one that was asserted. Whether it ships to production is pinned by an assertion too, because //go:embed migrations/*.sql does not recurse today but that is a property of the pattern, not of the directory; widening it to migrations would turn the preflight into a malformed migration file, and the negative verification proves the assertion catches that. Investigating the deploy path corrected two of my own beliefs. First, I had recorded that no migration CLI exists; cmd/tenantmigration does exist and its status subcommand is genuinely read-only, which is why the runbook uses it for the version check and why its absence from the image became a new P3 rather than being written off. Second, and more consequential, the DROP cannot be decoupled from the deploy: with PANTHEON_AUTO_MIGRATE=false the startup path runs RunMigrations, and the image only builds cmd/server, so the moment a pod starts the table is dropped, serialized across replicas by the mysql driver's GET_LOCK with a ten-second wait. That is why the preflight must happen before the deploy and why k8s/README's instruction to run migrations manually describes an entry point the image does not contain. For AUD-014-followup the packet produces a teardown inventory precise enough to execute mechanically, and the inventory found what a summary sentence hides: one route group becomes empty and should be deleted whole while the other keeps fifteen live routes and must survive, and TENANT_INITIALIZATION_GUIDE.md documents login with the legacy path even though it sits outside the contract system, so editing only SYSTEM_AUTH_CONTRACT would leave readers following the guide with a 404. For FREEZE-DECLARATION the packet writes the declaration text and then declines to sign it, stating the real reason rather than a procedural one: HEAD is the pre-remediation snapshot with 150 modified, 9 deleted and 49 untracked files, so the remediation is not in main and the commit that would be frozen does not exist yet. What this review does not claim: the preflight reports how many rows will die but not whether they still matter, so step 6 still requires a human to read the sample rows; the protection against someone later adding a WHERE clause to the row count is documentation, not a test, which is the weakest link in this packet and is recorded as such; -race was not run here and the race reading in the declaration is cited from W7 rather than measured now; and all three P2s remain open, so the packet's verdict is approved-with-follow-up rather than approved.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-01-audit-p2-human-gate-preconditions/manifest.json",
    "evidence": ".harness/evidence/2026-11-01-audit-p2-human-gate-preconditions/commands.json",
    "reviewFile": ".harness/evidence/2026-11-01-audit-p2-human-gate-preconditions/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md",
      "docs/runbooks/DECOMMISSION_LEGACY_AUTH_ROUTES_2026-12-31.md"
    ]
  }
}
```
