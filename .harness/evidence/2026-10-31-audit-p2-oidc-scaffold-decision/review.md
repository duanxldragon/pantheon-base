# 复核记录：OIDC 脚手架去留（AUD-005）

对照任务包 `executionRoles.reviewerPosture` 逐条自查。复核人：本轮执行者（自审）；维护者已授权"按计划推进"，最终签署仍归维护者。

## 1. 决策记录是否含被否方案与理由，而不是只写结论

**通过。** `decision.md` §3 用表格列出 (a)(b)(c) 三方案的做法、代价、结论，并在 §3 末段专门论证"为什么 (a) 优于 (b)"（矛盾被消除 vs 被改名；设计输入由 799 行设计文档承担，不需要一份未获批准的代码草稿）。§4 单独论证"为什么列不跟着删"。

## 2. 合同条款是否与所选方案逐字一致

**通过。** `SYSTEM_AUTH_CONTRACT.md §7.3` 在"未明确身份源前不提前实现"条款下追加了处置说明，四个要点与决策一一对应：删了什么（`backend/modules/auth/oidc/` 587 行）、保留什么（四列 + `000029`）、什么延后（drop 列）、决策与证据在哪。英文版 `SYSTEM_AUTH_CONTRACT.en.md:146` 同步，语义等价。

## 3. 选 (a) 时代码删除与列删除是否分两步，未在同一次提交完成

**通过。** 本次只有代码删除；`000029_oidc_fields.{up,down}.sql` 一字未改（`git status` 中该文件不在变更列表）。drop 列被显式写成延后事项，且理由（不可逆 + 需确认无环境启用 + 历史迁移不可改写）写进了合同与决策记录两处。

## 4. `.env.example` 的 `PANTHEON_OIDC_*` 状态是否与方案一致

**通过（附带一处任务包路径更正）。** 仓库根 `.env.example` 从未登记 `PANTHEON_OIDC_*`，与"该能力从未对外承诺"一致，因此无需删除任何配置行。任务包 `expectedFiles.modify` 写的是 `backend/.env.example`——该路径不存在，已在本次执行中更正为仓库根 `.env.example`，并在 `commands.json` 里留了一条 `status: failed` 的读数记录这次路径错误，避免下一位执行者重复踩。

## 5. `000029` 迁移是否未被改写

**通过。** 文件未出现在变更列表。同时确认 `migrate_test.go:30,102-106` 对该迁移的列/索引断言仍然有效（迁移未变 → 断言前提未变）。

## 6. 额外自查（不在 reviewerPosture 清单内，但本次必须回答）

**6.1 删除是否留下悬挂引用？** 否。删除后 `grep -rn "auth/oidc\|oidc\." backend --include=*.go | wc -l` = 0；`go build ./...` 与 `go vet ./...` 均 exit 0。

**6.2 是否误删了与 OIDC 无关的东西？** 否。删除范围严格限定在 `backend/modules/auth/oidc/` 一个目录（4 文件）。`modules/auth/{login,mfa,security,session}` 与 `module.go` 未改动，`go test -short ./modules/auth/...` 全绿。

**6.3 是否遗漏了"实现已批准"的证据？** 已穷尽检索：`.harness/archive/2026-09/tasks/2026-09-08-p1-sso-oidc-implementation/` 为空目录；design 任务的 completion 明写"implementation deferred"；`SYSTEM_AUTH_CONTRACT.md` 与 `OIDC_RESPONSE_CONTRACT_2026-10-27.md` 同向禁止提前实现。不存在被忽略的批准记录。

**6.4 删除是否影响下游 `pantheon-ops`？** 不影响，但机制需要说清。ops 是**源码副本式**消费（`go.mod` 声明同一模块路径），因此它当前仍有自己的一份 `backend/modules/auth/oidc/`（4 文件）。实测该副本的**包外引用为 0**（`grep -rn "auth/oidc" pantheon-ops/backend --include=*.go | grep -v "modules/auth/oidc/"` → 0），包内 5 处命中都是 OIDC 库自身的 `oidc.Provider` / `oidc.IDToken` 用法。因此：
- 本次 base 删除**不会**让 ops 立刻少文件，也不会让 ops 编译失败；
- 下一次 `npm run rebuild:from-base` 会把这个目录随 `sharedPaths` 一并移除，属于顺带清理而非破坏；
- 若 ops 未来想启用 OIDC，必须先回 base 重新走决策，而不是在副本里"续写"。

## 结论

**通过。** 剩余事项只有一条延后项（drop 列），已按合同 §8 的纪律登记，不阻断维护冻结。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-oidc-scaffold-decision",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/auth/oidc/ (deleted: config.go 77 + handler.go 115 + provider.go 92 + service.go 303 = 587 lines)",
      "docs/contracts/SYSTEM_AUTH_CONTRACT.md §7.3 (disposition note)",
      "docs/contracts/SYSTEM_AUTH_CONTRACT.en.md (mirrored)",
      "backend/pkg/database/migrations/000029_oidc_fields.{up,down}.sql (untouched)",
      "docs/designs/SSO_OIDC_DESIGN.md (untouched, stays Draft)"
    ],
    "checks": ["sensitive-flow"],
    "findings": [
      "P3: system_user keeps its four oidc_* columns and migration 000029. Dropping columns is irreversible and needs proof that no environment ever enabled the feature, so contract §8's two-step discipline applies: delete code, observe one release, then file a separate drop migration. The deferral is recorded in SYSTEM_AUTH_CONTRACT §7.3 rather than left as a verbal promise.",
      "P3: pantheon-ops still carries its own copy of backend/modules/auth/oidc/ (4 files, 0 references outside the package). This deletion will not break ops, and the next rebuild:from-base removes the copy as incidental cleanup.",
      "P3: the comment inside migration 000029 saying 'the oidc scaffolding reads and writes ...' is now a historical statement. Not rewriting a released migration is deliberate; the divergence is explained by contract §7.3.",
      "P3: no backend was started and no MySQL/Redis was contacted. The deleted package had zero references and zero routes, so the runtime surface is byte-identical before and after and there is no runtime difference to compare. The four-column assertion in migrate_test.go needs a real MySQL and did not run under -short, but it targets an unmodified migration and does not depend on the deleted code."
    ],
    "notes": "The decisive evidence for option (a) over (b) was not the line count. SSO_OIDC_DESIGN.md is still Draft, its design task's completion note says 'Implementation (Phase 2, ~9 hours) is deferred for future execution after design approval', and .harness/archive/2026-09/tasks/2026-09-08-p1-sso-oidc-implementation/ is an empty directory - the archive contains no record that implementation was ever approved. So these 587 lines were written ahead of both the design and the contract, and SYSTEM_AUTH_CONTRACT.md:168 explicitly forbids implementing real SSO/OIDC before the identity source is settled. Between contract and code, the code had to yield. Deleting is not the same as losing design input: the 799-line design document with CSRF/state/nonce, JIT provisioning, account binding and four IdP configuration samples is untouched. Reference count was 0 before and 0 after, go build ./... and go vet ./... exit 0, and the auth module's own tests (login/mfa/security/session) stay green. Gates: task-packet exit 0, doc-links 0 findings, structure/encoding 0 findings, duplication PASS."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-oidc-scaffold-decision/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/contracts/SYSTEM_AUTH_CONTRACT.md",
      "docs/designs/SSO_OIDC_DESIGN.md",
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md"
    ]
  }
}
```
