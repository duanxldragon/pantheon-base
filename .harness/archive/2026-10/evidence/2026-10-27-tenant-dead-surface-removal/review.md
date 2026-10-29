# Review — W8 `2026-10-27-tenant-dead-surface-removal`

Reviewed against branch `refactor/tenant-dead-surface-removal-w8-2026-10-27`
(stacked on W5). Each `reviewerPosture` item is answered with the artefact
that settles it; the five-location search is in
[reference-search.md](reference-search.md), the per-test mapping in
[test-migration.md](test-migration.md).

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| The five-location search in evidence is fresh, not copied from this packet | Re-run on this branch (2026-10-27, post-W5 stack) with output quoted in reference-search.md; the ops-overlay section reflects a finding the packet did not predict: pantheon-ops carries inherited duplicates of all four files. |
| Every deleted file has zero references in the final tree | `grep -rn "NewHandler\|RegisterRoutes(engine\|BootstrapService\|MigrateExistingUsersToDefaultTenant" backend --include=*.go` returns empty after the comment trim at `tenant_service.go` (the packet's verification grep is reproduced in commands.json). The gin-bound helper `parseTenantMemberPagination` moved into `tenant_platform_handler.go` — recorded as the compile-forced deviation it is. |
| The pagination test survived in a service-level file | `TestNormalizeTenantMemberPagination` appended to `tenant_service_test.go`, assertions verbatim. |
| The envelope, no-leak and sentinel assertions now run against PlatformHandler | `tenant_platform_handler_test.go` drives the mounted path shape `/api/v1/system/tenant...` through `NewPlatformHandler`: 10 bind-error cases + `requireUnifiedErrorEnvelope` (same leak list), sentinel mapping (404 `tenant.not_found`, 400 `tenant.code_taken`, 400 `tenant.not_archived`), plus the two pagination/bounded-contract tests rewritten to the platform envelope. The two `/tenants/my` subtests died with the endpoint; replacement surface recorded. |
| No mounted route, middleware or response shape changed | `system_modules.go` untouched (packet `doNotTouch`); `git diff` touches no route registration; production additions are one relocated unexported function and a comment trim. Response shapes asserted by the new tests are the ones the mounted handler already produced. |
| `go test ./...` still passes with the same or higher test count for the package | Tenant package: 126 pass / 0 skip / 0 fail (baseline 119, same all-`--- PASS`-lines counting) — higher, with 0 skips (DSN set, honoring the packet's warning). Full backend suite: recorded in commands.json with a direct exit code. |

## Fact-checks run during review

- The new tests do not carry phantom fixture ids: memberships are created via
  `AddMember` after `mustInsertTenantUser(s)` (real `system_user` rows), and
  the inactive-membership fixture inserts user 106 before the raw
  `Membership` row — per the packet's W2 note.
- The pagination rewrite asserts the platform envelope
  (`{"code":200,"data":{...},"message":"success"}`), not the legacy raw-JSON
  shape — the shape W5's TENANT_API.md alignment documents for the mounted
  route.
- `docs/TENANT_MATURITY_FINAL_2026-09-29.md` §4 is corrected in place (the
  four bootstrap entry points marked never-wired + deleted, real path
  referenced) rather than marking the whole document historical — its
  2026-10-13 banner already frames it as a schema-layer assessment.
- Static gates: doc-links strict 0 findings; packet checker 66 files /
  0 errors.

## Governance notes

- **No human gate** is defined for this packet (`humanGates: []`); the
  maintainer touchpoint recorded for the wave table is the STATUS.md
  bookkeeping (merged as #444).
- **qualityProfile correction**: the packet declared `none`; CI rejects
  `none` for non-trivial changes (same latent issue flagged in the #443
  evidence for W6/W7/W8). Manifest corrected to `auth-security` in this PR.
- **No `solo-override`** is used; the PR carries the governance body and
  rides the normal Quality Gates.
- Wave sequence: W3 (#440) → W4 (#442) → W5 (#443) → W8 (this PR). After W8,
  W6 and W7 remain (both maintainer-gated).

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-dead-surface-removal",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-dead-surface-removal/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-dead-surface-removal/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-dead-surface-removal/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
