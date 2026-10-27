# Review — W2 `2026-10-27-tenant-member-integrity`（租户成员完整性）

Reviewed against the working tree on branch `fix/tenant-member-integrity-2026-10-27`
(base `c26c75e1`). Measured diff: **12 files, +489 / −12**, every path inside the packet's
`expectedFiles.modify`; `doNotTouch` (`backend/pkg/database/migrations/**`,
`backend/modules/system/iam/user/user_membership.go`, `frontend/src/index.ts`, `pantheon-ops/**`)
is untouched. The review question is the one the packet's `reviewerPosture` asks, so each of its
five items is answered with the artefact that settles it rather than with an assertion.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Every test id now maps to a real `system_user` row | `grep` over the tenant package: every `AddMember` call site is preceded by `mustInsertTenantUser(s)` except the ids that are *deliberately* ghosts — `424242` (unknown-user rejection, `tenant_service_test.go:440` and `:503`) and `601` (the phantom owner written straight to `tenant_memberships`, `:523`). Those two are the defect under test, not stale fixtures. |
| A phantom owner row no longer satisfies the last-owner invariant | `TestRemoveMember_PhantomOwnerDoesNotProtectRealOwner`: one real owner plus one raw-inserted phantom owner → removing the real owner returns `ErrLastOwner`, and the list still reports 2 rows. Red before the fix (`red-without-fix.log`: *Expected error with "tenant membership last owner" in chain but got nil*), green after. |
| `AddMember` still returns `ErrTenantNotFound` for a tombstone before reaching the user check | `TestAddMember_TombstoneTenantStillReportsTenantNotFound` passes **in both halves of the differential**, which is the point: the ordering is a characterisation test, so the fix is proven not to have moved the guard. `TestAddMember_TombstoneTenant...` asserts `assert.Equal(t, ErrTenantNotFound, err)` with an unknown user id, i.e. the tenant error wins when both are wrong. |
| The member dialog no longer accepts free-text ids and sends the selected id | `member-dialog-open.png` / `member-dialog-selected.png`: the field is a searchable `Select` whose option values are user ids returned by the API, labelled `username · nickname`. `handleAddMember` posts `user_id: values.userId` typed as `number` by `Form.useForm<{ userId: number; role: string }>()`, so free text cannot reach the wire. |
| No new endpoint or dependency was added | The diff adds no route registration, no `package.json` / `go.mod` change, and reuses the existing `getUserList` client. `check:menu-contract` still reports 19/23/102/23 and `check:system-page-admission` 16 — the permission and menu surfaces did not move. |

## Boundary audit — what the wave refused to decide

`scope.out` puts cross-tenant membership policy in W3/W4, and the implementation holds that line in a
way a reviewer has to be able to see. `memberUserExists` filters on `deleted_at IS NULL` only — no
`tenant_id`, no `status`. Two consequences were checked rather than assumed:

- `BootstrapService.MigrateExistingUsersToDefaultTenant` (`tenant_bootstrap.go:99`) inserts users whose
  owning tenant is *not* the migration target. A tenant-scoped guard would break it.
- `frontend/tests/smoke-core/tenant-hostile-browser-matrix.spec.ts` exercises cross-membership that a
  tenant-scoped guard would reject.

`TestAddMember_DoesNotDecideCrossTenantMembership` pins the boundary as a passing assertion that a
cross-tenant add **succeeds today**, so W4 cannot land by accident — it has to edit that test on
purpose. That is the right shape for a deferred decision.

The asymmetry between the two user reads is also deliberate and is documented in three places (code
comment, `docs/api/TENANT_API.md`, `summary.md`): adding is permissive about `status`, the owner count
is not, because a disabled account cannot sign in to repair a tenant. `TestRemoveMember_DisabledUserOwnerDoesNotCount`
covers the second half.

## Behaviour-change audit

This wave changes observable behaviour in exactly one way: a POST to `/system/tenant/:id/members` with
an id that names no live user now returns an envelope `404 / user.not_found` instead of writing a row.
That is the packet's intent, and the contract document was updated in the same change (section 6 errors
plus the status table). No route, request shape, permission code, menu, seed, schema or migration moved;
the i18n additions are four new keys per locale with no existing key or value edited, so the
"keep i18n as-is" rule is respected in the additive direction the packet allows.

## Findings

- **P3, orphaned key (deliberate, for W7):** `system.tenant.memberUserIdPlaceholder` ("Enter user ID")
  is no longer referenced now that the field is a selector with a search placeholder. It was **not**
  deleted, because deleting keys is outside this wave's mandate. W7 owns wording and should either
  retire it or repurpose it.
- **P3, packet path error:** `frontend/src/locales/**/system.json` in `expectedFiles.modify` does not
  exist in this repository; the real locale resources are `frontend/src/i18n/resources/*.ts`. Recorded
  in `commands.json` → `knownGaps` so the next wave's packet can be corrected rather than re-litigated.
- **P3, bounded candidate page:** the picker fetches one page of 50 users and filters locally; a tenant
  whose addable users sit beyond that page will not see them until the operator searches a different
  viewpoint or W6/W3 adds real search. The cap is stated in a single comment at the constant, as the
  packet instructed, and the empty state is explicit rather than silent.
- **Not a code finding, recorded anyway:** the first full-suite reading in this wave was invalidated by
  three concurrent `go test ./...` invocations saturating MySQL (`modules/system/i18n`,
  `panic: test timed out after 10m0s`). The discarded number is described in `knownGaps`; the adopted
  number is a single serial run. Two dozen orphan clone databases from that period still need the
  maintainer's disposal decision.

## Verdict

Approved. The four defects are each covered by a test that was demonstrated red against the pre-fix
service and handler and green against the final tree, the ordering guard is proven unchanged by a test
that passes on both sides of the differential, the boundary the packet drew at W3/W4 is enforced by an
assertion instead of by silence, and the whole backend and frontend gate set reproduces the Phase 0
numbers (46 packages ok, 34 files / 230 frontend tests, 3021 i18n keys × 5 locales). The remaining
items are P3 follow-ups assigned to later waves, not blockers.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-member-integrity",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/system/iam/tenant/tenant_service.go",
      "backend/modules/system/iam/tenant/tenant_platform_handler.go",
      "frontend/src/modules/system/iam/tenant/TenantList.tsx",
      "docs/api/TENANT_API.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 authorisation-adjacent: AddMember is the only write path into tenant_memberships and it has no foreign key behind it, so every future wave that reads memberships inherits this existence guard; the cross-tenant policy it deliberately does not decide is pinned by TestAddMember_DoesNotDecideCrossTenantMembership, which W4 must edit explicitly.",
      "P3 wording debt: system.tenant.memberUserIdPlaceholder is orphaned by the selector change and left in place for W7 to retire.",
      "P3 packet defect: expectedFiles.modify names frontend/src/locales/**/system.json, a path that does not exist in this repository.",
      "P3 capability cap: the member picker reads one bounded page of 50 users and filters locally; users beyond that page are unreachable until a real search exists."
    ],
    "notes": "No new edge enters the graph: the change adds a read of system_user on the membership write path and a JOIN on the owner count, both inside the tenant service, and reuses the user-list endpoint the frontend already had. The sensitive flow is the membership write itself — it is now gated on existence, and the owner invariant is computed over live users only, which closes the escalation path where a phantom row could lock out or hand over a tenant. The hub risk is TenantList.tsx, which grew a second data source; it is bounded by permission (canBrowseUsers) and by a single page fetch, and the viewpoint mismatch is surfaced instead of hidden. The measured verification is a red/green differential on the two production files plus a mounted-route test, so the behaviour change is evidenced rather than described."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-member-integrity/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-member-integrity/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-member-integrity/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
