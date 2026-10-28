# Review — W1 `2026-10-27-tenant-delete-archive-guard`（删除仅限已归档租户）

Reviewed against the working tree on branch `fix/tenant-delete-archive-guard-2026-10-27`
(base `b13e6b77`, i.e. W2 PR #434 already merged). Measured diff: backend commit
**12 files, +119 / −22** plus frontend commit **6 files, +13 / −1**; every path inside the
packet's `expectedFiles` set; `doNotTouch` (migrations, `user_membership.go`,
`RemoveMember`/`ensureNotLastOwner`, `pantheon-ops/**`) is untouched. The review question is
the one the packet's `reviewerPosture` asks, so each item is answered with the artefact that
settles it rather than with an assertion.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| The guard is the status, not the member count | `tenant_service.go` DeleteTenant now reads `if row.Status != tenant.TenantStatusArchived { return ErrTenantNotArchived }` with no member-count term in the condition. The member-count query is gone from the guard entirely; the transaction body (disable active memberships, allocate the synthetic code, write `status=deleted`) is byte-identical to before. `TestDeleteTenant_ActiveWithoutMembersStillRefused` pins exactly the TC-02 state: active tenant, zero active members, `ErrTenantNotArchived` returned, row still `active` after the refusal. |
| Red before green, on the regression test itself | [red-run.log](red-run.log): with only the guard hunk reverted (sentinel kept so the test compiles), the regression gets `nil` from `DeleteTenant` and the row reads `status='deleted'`. [green-run.log](green-run.log): same test passes in 1.02s with the fix. The revert never reached a commit. |
| Every tombstone fixture is built through the archive path now | `grep` over the tenant package: all 14 `service.DeleteTenant(...)` sites that expect success are preceded by an `UpdateTenant(Status=archived)`; the remaining call sites are deliberate refusals (`ErrTenantNotFound` for platform-global/unknown ids) that never reach the guard. The 14th site is W2's `TestAddMember_TombstoneTenantStillReportsTenantNotFound`, which the packet's 13-site inventory could not have known about; the first post-rebase full suite failed exactly there, which is itself evidence the guard fires. |
| The error reaches the client as the frozen key, with no leak | `tenant_platform_handler.go` maps `ErrTenantNotArchived` → `common.CodeParamInvalid` + `tenant.not_archived`; the legacy handler mirrors it so `TestLegacyTenantHandlerSentinelMappingRequiresNoInternalLeak` keeps driving a real database and asserts the envelope carries `tenant.not_archived` and **not** the sentinel text. The `requireUnifiedErrorEnvelope` leak list (json:/strconv:/gorm/sql/...) still runs over every error path in that test. |
| Frontend does not offer the impossible action, but does not trust the affordance | `TenantList.tsx:570` adds `|| row.status !== 'archived'` to the delete action's `disabled` with a comment stating the disabled state is the affordance, not the guard. The backend, not the UI, is the enforcement point — and the API doc + runbook now say so in the same words. |
| Docs moved in the same wave | Contract §5 gains the frozen row (`删除未归档租户（成员数是否为 0 不影响判定，V1.6） | 400 | tenant.not_archived`), §9 records V1.6 in both zh and en texts; `docs/api/TENANT_API.md` Delete Tenant section rewrites Errors + Note; `docs/runbooks/TENANT_TROUBLESHOOTING.md` Cannot Delete Tenant section rewrites Symptom/Cause and the quoted envelope. `TENANT_MIGRATION_RUNBOOK.md` was reviewed and contains no non-archived-delete statement — no change needed (recorded in commands.json knownGaps). |

## Behaviour-change audit

- **Breaking on purpose, and narrow**: any caller deleting a non-archived tenant now gets
  `400 tenant.not_archived` instead of a tombstone. This is the contract's own rule (§2.1, and
  §9 V1.3 already said the tombstone is not a lifecycle state); the code was behind the
  contract, not ahead of it. The console path is additionally gated by the disabled affordance.
- **`ErrTenantHasActiveUsers` is Deprecated but not deleted** — its second half (archived
  tenants may carry active members; deletion disables them in-transaction) is still true and
  now owned by the status-only guard. No caller maps it anymore, so the deprecated name is
  inert; its removal is left to the W8 dead-surface wave rather than done here.
- **Legacy handler parity is deliberate**: W8 removes `tenant_handler.go` entirely. Until then,
  leaving it unmapped would regress a test that W1 is not authorised to weaken, so the mapping
  is mirrored with a comment pointing at the removal wave.
- **No silent permission/menu movement**: `check:menu-contract` surface unchanged by this wave
  (the delete action existed before; only its `disabled` condition moved), `audit:i18n-locales`
  3022 keys per locale with missing=0 extra=0 empty=0 (3021 after W2 + this wave's single key).

## What the wave refused to decide

- No data repair for any historical tombstone bypassed without archiving — the bypass path
  never shipped, and the packet puts remediation in `scope.out`.
- No change to the status machine, archive terminality, owner protection or membership disable
  rules — W2's territory, untouched and re-verified by the shared suite.
- The remaining `has_active_members` strings in dated review documents are historical records
  and were left alone.

## Verdict

The wave does exactly what the packet authorises, the red/green differential is on the new
regression test itself, the fixture inventory correction (13 → 14) is documented rather than
hidden, and every surface the packet's `expectedFiles` names moved together: guard, sentinel,
handler mapping, i18n (5 locales), UI affordance, contract, API doc, runbook. Ready to merge.

> Added 2026-10-28: the Machine Readable block below retro-fits this already-merged review to the
> strict `check-review.mjs` contract. This closes the debt registered in `.harness/STATUS.md`
> (merged evidence predating the strict checker); the verdict matches the prose verdict above.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-delete-archive-guard",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-delete-archive-guard/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-delete-archive-guard/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-delete-archive-guard/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
