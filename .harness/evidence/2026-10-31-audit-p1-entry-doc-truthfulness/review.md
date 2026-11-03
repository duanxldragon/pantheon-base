# 评审：W3 入口文档真实性

评审对象：`README.md`、`README.en.md`、`DESIGN.md`、`DESIGN.en.md`、`docs/README.md`、`docs/README.en.md`、`docs/designs/README.md`、`docs/designs/README.en.md`（+223/-57，8 文件）。

## 逐条 reviewer posture

1. **五组失真的反证是否支持新表述？**
   是。AUD-003a 有 `git show origin/main:VERSION` = 0.18.2；AUD-003b 有 `grep -rn "quota\|Quota" backend/modules/system/iam/user backend/modules/system/iam/role` = 0 命中；AUD-003c 有 `ls CONTRIBUTING.md .github/ISSUE_TEMPLATE` 的三份模板；AUD-004 的每一句都能落到 `TENANT_CONTRACT_V1` 的节号（§1 Out / §2.3 / §2.4.1 / §2.6 / §3 / §4 / §6）；AUD-016 由 `backend/go.mod` 的 module 根决定；AUD-007 由 `ls docs/designs/*.md | wc -l` 与缺 `.en.md` 的 5 份文件名反证；AUD-024 的替换依据是 `ci.yml` / `release-gate.yml` 里的 job 名。没有一条新表述依赖历史评审报告的结论。

2. **README 是否不再硬编码 release 号，是否引入未实现的功能？**
   版本表已无版本数字，正文全文 `grep "pantheon-base-v0\.[0-9]*\.[0-9]*"` = 0。没有新增路线图、没有新增“将支持”类措辞；反而删掉了两处旧承诺（“0 个阻塞性失败”“SonarCloud 已通过”）。唯一新增的能力描述是把已交付的租户 CRUD/成员/切换/运营/配额展示写清，且同时写明“超限不拒绝写入”。

3. **DESIGN 租户章是否与合同一致，是否把未做面写成已做？**
   一致。§3.4 的模型（共享库 + 行级 `tenant_id`、`tenant_id = 0` 为平台级）、双模（`compat` / `multi`，`multi` 是 `compat` 超集、单向切换）、上下文优先级（`X-Tenant-Id` → JWT → 平台作用域兜底 → compat 兜底、非 compat 缺失时 fail-closed）、Casbin domain（`tenant:<id>`、先全局后域、不合并）逐条对应合同 §3/§4/§6。未做面写得很硬：配额强制、独立 schema、跨租户联邦、自定义域名、自助注册与计费，加上 W2 定的“业务域单租户语义”。§3.3 现为现状表并带判据（目录/`grep` 命中数），不再是路线图。

4. **docs/README 的命令能否照抄执行？**
   能。顺序是 `docker compose up -d` → 应用迁移 + runtime seed（默认启动路径自动执行；`PANTHEON_AUTO_MIGRATE=true` 仅开发用）→ `cd backend && go run ./cmd/server`。并显式写明在仓库根执行 `go run ./backend/cmd/server` 会失败，以及 `database/system_init.sql` 只是历史参考。`docs/README.en.md` 无本地启动章节，未虚构一条。

5. **designs 索引条目数与目录内中文主文档数是否一致？**
   一致：62 份主文档全部被引用（逐文件 grep 无 MISSING），`.en.md` 声明为 57/62 并点名缺失 5 份，与 `ls` 实测吻合。

6. **改动范围是否守在边界内？**
   是。`git diff --stat` 只有 8 份入口文档；`backend/**`、`frontend/**`、`.github/**`、`VERSION`、`CHANGELOG.md`、`docs/release-notes/**`、`docs/history/**`、`docs/reviews/**` 均未改动。

## 发现的问题（已在本轮内修正）

- 首轮读完 `README.md` 仍发现 `Go 1.26.6 修复 7 个 stdlib CVE` 与同文件“工具链基线 Go 1.26.10”、`backend/go.mod` 的 `go 1.26.10` 冲突。它落在无相对时间标记的“关键成果”段里，读起来像当前状态。已把该段整体标注为 2026-09-22 当轮记录，并把版本句改成指向 `go.mod` 的表述。

## 遗留（显式登记，不阻断）

- `README.en.md` 对多租户能力**沉默**（漏写，非错写）：补写属于能力面扩充，不在本包 In 范围，登记为后续文档项。
- 8 份 `docs/TENANT_*_2026-*.md` 仍在 `docs/` 根：已登记为非一线入口，物理归档/合并由 W4 处置。
- 5 份设计文档永久无英文副本：已在索引内如实声明，本包不补。

## 结论

通过。入口文档与代码之间不再有“可被一条 grep 推翻”的陈述；新增的两条机制（版本号单源、门禁状态不写入文档）针对的是失真成因，不是这一次的具体错字。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p1-entry-doc-truthfulness",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "README.md",
      "README.en.md",
      "DESIGN.md",
      "DESIGN.en.md",
      "docs/README.md",
      "docs/README.en.md",
      "docs/designs/README.md",
      "docs/designs/README.en.md"
    ],
    "checks": [
      "cycle",
      "hub",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "Documentation truthfulness only: version source of truth, quota wording, community files, gate-status wording, DESIGN tenant chapter. No product code, migration, workflow or gate touched."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p1-entry-doc-truthfulness/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/review.md",
      "changeRef": "none",
      "planRefs": [
              "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md"
      ]
  }
}
```
