---
title: 文档元数据三合一、scope 矩阵修正与门禁覆盖边界（AUD-008/009/010）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md
  - docs/contracts/DOCUMENT_METADATA_AND_STATUS.md
  - docs/contracts/TENANT_CONTRACT_V1.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-doc-metadata-and-index

## Goal

三条问题同源：**规范有多份，门禁只覆盖一小块，没人说得清“合规”到底指什么**。

- 三份 frontmatter 规范并存（`docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 102 行 /
  `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md` 321 行 / `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`
  302 行），检查器只实现了 contracts 版；
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` 的 §4 写着“租户识别方式全部待决策，禁止按示例实现”，
  而 `X-Tenant-Id` + session claim 早已实现并冻结；§:62 把 `system_dept/post` 归为 `platform-global`，
  代码里两者都带 `tenant_id`；
- `frontmatter-check.mjs:154-172` 的 `expectedIndexGroup` / `expectedStatuses` 只对
  `docs/superpowers/specs/` 与 `docs/archive/{examples,baselines,upgrade}/` 返回非空，其余目录
  **缺 frontmatter 不会报错**——120 份 docs 无元数据，“检查通过”只代表“已登记文档合规”。

本包把“唯一权威规范 + 明确覆盖边界 + 与代码一致的 scope 矩阵”一次收敛。

## Primary Layer

platform

## Dependency Layers

- `platform`（文档规范、检查器、设计文档）
- 不触碰租户运行时、迁移或业务代码。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: none
- Downstream Sync Note: 规范合并会影响 ops 侧写文档的习惯，但不需要同步发布；在 base 合并后
  ops 下次 `rebuild:from-base` 自然获得同一份规范。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `doc-metadata`
- Portable Failure Class: `spec-duplication`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - method-health
  - architecture-fitness

交付层级：**L1**（规范与检查器，无运行面）。

## Contract Anchors

- `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md`：拟定为唯一权威。
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`：`status` 语义（与 W4 共用）。
- `docs/contracts/TENANT_CONTRACT_V1.md`：scope 矩阵的权威事实来源。
- `scripts/frontmatter-check.mjs`：门禁实现，判据以此为准。

## Scope

### In

- **AUD-008**：三份规范合一。保留 `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md` 为唯一权威；
  `DOCUMENT_METADATA_AND_STATUS.md` 收敛为“status 语义”专章（不重复字段定义）；
  `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 改为 3–5 行指针（指向 contracts 版），
  并在其 frontmatter 标 `status: Archived`。
- **AUD-009**：修正 `TENANT_RESOURCE_SCOPE_MATRIX.md`——§4 的“全部待决策/禁止按示例实现”改为
  已冻结事实（`X-Tenant-Id` 需平台能力 + session claim + compat 兜底）；`:62` 的 `dept/post`
  归类改为 `tenant-scoped`（代码证据：`dept_service.go:28`、`post_service.go:26` 均带 `tenant_id`）。
  若该文档整体已失去权威性，改为在文首声明“以 `TENANT_CONTRACT_V1` 为准”，并逐节标注失效点。
  - **追加（2026-10-31，W2 已定方案 C 后产生）**：§3 唯一键表里的 `biz_*` 行（`:73`，“新增时逐表登记 / 按评审”）
    需标注为 **V2 预留入口**，并写明“截至 V1.10 无任何业务表登记、无业务表带 `tenant_id`”，
    与 `TENANT_CONTRACT_V1 §2.6` 逐字一致。否则读者会把一个预留行读成“业务表已经在用租户唯一键”。
- **AUD-010**：给元数据门禁一个**明确边界**，二选一并写进规范：
  - (a) 扩大覆盖：对 `docs/designs`、`docs/contracts`、`docs/api`、`docs/operations` 强制要求
    frontmatter，并在 `frontmatter-check.mjs` 的 `expectedIndexGroup` 增加对应分支；
  - (b) 显式声明不覆盖：在 `DOCUMENT_FRONTMATTER_SCHEMA.md` 增加“覆盖范围”一节，列明
    不要求元数据的目录（`docs/history`、`docs/release-notes`、`docs/runbooks` 等）与理由，
    并让检查器输出一行“本次检查覆盖 N/M 份文档”，消除“全绿=全覆盖”的误读。
- 无论选 (a) 还是 (b)，检查器输出必须能回答“这次到底检查了多少份”。

### Out

- 批量给 120 份无元数据文档补 frontmatter（若选 (a)，只对新增/触碰的文件生效，存量登记为 gap）。
- 改写 `docs/designs/README.md` 的索引条目（属 W3 `entry-doc-truthfulness`）。
- 修改租户运行时、中间件或迁移。
- 修改 `docs/history/**`。
- 把 `DOCUMENT_FRONTMATTER_SPEC.md` 直接删除（先降级为指针并归档，删除需单独立项）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-doc-metadata-and-index.task.md`
- `.harness/tasks/2026-10-31-audit-p2-doc-metadata-and-index/manifest.json`
- `.harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/{commands.json,summary.md,review.md}`

### Modify

- `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md`
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`
- `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md`
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`
- `scripts/frontmatter-check.mjs`

### Do Not Touch

- `docs/history/**`
- `docs/designs/README.md`（归 W3）
- `backend/**`（只读取证，不改）
- `backend/pkg/database/migrations/**`
- `.github/workflows/**`（checker 接线归 W8）

## Implementation Notes

- 三合一的判据是“同一个问题只有一个答案”：字段定义在 schema 版，状态语义在 metadata 版，
  harness 版只剩指针。任何一条定义出现两处，本包就不算完成。
- 改 `frontmatter-check.mjs` 时要保持向后兼容：存量文档在选 (a) 时不应一次性变红，
  用“新增/触碰文件强制 + 存量白名单递减”的方式推进，白名单必须有到期说明。
- scope 矩阵的修正必须引用代码行号，不能只改结论——它当初写“待决策”也是因为没引用代码。
- `dept/post` 归类错误影响的不只是文档：任何按该文档做数据权限设计的下游都会做错，
  所以这条要在 `summary.md` 里单独说明影响面。
- 检查器输出加“覆盖 N/M”是一行改动，但它把“全绿”的语义从“全部合规”修正为“已检查部分合规”，
  这是本轮文档治理里性价比最高的一条。

## Verification Plan

- `npm run check:docs-frontmatter`（改后仍通过，且输出包含覆盖计数）
- `node scripts/frontmatter-check.mjs --report-legacy`（存量清单可读）
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- `node --test tests/docs/frontmatter-check.test.mjs`（检查器单测必须跟着改）
- 反证：`grep -n "tenant_id" backend/modules/system/org/{dept,post}/*_service.go`（scope 矩阵依据）
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p2-doc-metadata-and-index`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-doc-metadata-and-index/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §8.2/§8.3、`docs/contracts/TENANT_CONTRACT_V1.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/review.md`

## Evidence Required

- `commands.json`：三条规范改前改后的字段对照、检查器覆盖计数、单测读数
- `summary.md`：三合一取舍（为什么 contracts 版胜出）、覆盖边界选 (a) 还是 (b) 及理由、
  `dept/post` 归类错误的影响面
- `review.md`：逐条 reviewer posture

## Human Gates

- 选 (a) 会让大量存量文档进入强制范围，需维护者确认推进节奏与白名单到期时间。
- `TENANT_RESOURCE_SCOPE_MATRIX.md` 若整体降级为“以合同为准”，等于放弃一份设计文档的权威性，
  需维护者确认。
- 修改 `frontmatter-check.mjs` 会影响所有后续 PR，需一位非作者复核。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 字段定义只存在于一处，harness 版已降级为指针并归档
- [x] scope 矩阵的结论均有代码行号支撑
- [x] 检查器输出能回答“覆盖了多少份文档”
- [x] 检查器单测已同步更新

## Execution Result（2026-10-31）

- **AUD-008（三份规范收敛）**：`docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md` 成为字段定义的唯一权威；
  `DOCUMENT_METADATA_AND_STATUS.md`(zh/en) §2 改为“字段定义在 schema，本文只管 `doc_type`/`status` 两个
  枚举的取值语义”；`docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 重写为 12 行指针 + `status: Archived`；
  `HARNESS_ENGINEERING_CONTRACT`(zh/en) 的文档治理条款改为引用 schema 版。
- **AUD-009（scope 矩阵）**：`system_dept`/`system_post` 从 `platform-global`（倾向）改为 `tenant-owned`，
  附 `dept_service.go:28/88/112`、`post_service.go:26/144` 行号；§4 从“全部待决策，禁止按示例实现”改为
  “已实现（`X-Tenant-Id`、会话 claim、compat 固定上下文）/ 仍未实现（子域名、自定义域名、客户端自带 claim）”
  两节；`biz_*` 行标注为 V2 预留并对齐合同 V1.10 §2.6（无业务表登记、无业务表带 `tenant_id`）。中英同步。
- **AUD-010（门禁覆盖边界）**：选方案 (b) —— 声明边界而非全量强制。`scripts/frontmatter-check.mjs` 新增
  `ENFORCED_DIR_PREFIXES` / `summarizeCoverage()`，输出改为“扫描 N 份 / M 份带元数据 / N−M 份不强制 +
  强制目录清单”；`DOCUMENT_FRONTMATTER_SCHEMA.md` 新增 §11 覆盖范围（强制 4 个目录 + 不强制目录及理由）。
  单测新增 `summarizeCoverage` 用例。
- **W4 遗留（7 份 legacy 任务包）**：为 `2026-07-29-sonar-ts-final`、`2026-07-30-local-consolidation`、
  `2026-08-21-sonarcloud-remediation`、`2026-09-01-release-docs-reconciliation`、
  `2026-09-01-release-gate-sonar-cleanup`、`2026-09-02-foundation-release-v0-10-26-and-ops-sync`、
  `2026-09-29-v0140-release-completion` 补 frontmatter（title 取自各自 manifest，`layer` 取各自
  Primary Layer 段，`status: Archived`，`linked_contracts` 指向实际相关合同）。
- **未做（显式）**：没有扩大强制范围（方案 a）；`docs/history`、`docs/release-notes` 等存量文档未批量补元数据。
