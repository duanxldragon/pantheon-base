# Release Notes

## pantheon-base-v0.18.0

Minor release on the `release/0.18` line, cut from the commit that carries the full 13-wave code
simplification programme plus the tenant lifecycle, membership and console waves merged after
v0.17.8.

### No contract break

- Schema unchanged at 30. No migration in this release.
- No route, permission code, menu key or i18n key removed.
- One error code added: `tenant.member.user_not_in_tenant` (HTTP 400).
- `sharedPaths` unchanged at 52 entries.

### Simplification (13 waves)

| Wave | Merge | Measured diff |
| --- | --- | --- |
| S1 dead-code removal | #438 | 19 files, +0 / −1,923 |
| S1 API-surface narrowing | #439 | 3 files, +11 / −9 |
| S2 shared handler helpers | #450 | 9 files, +641 / −134 (additive) |
| S2 path-ID parse migration | #451 | 11 files, +66 / −134 |
| S2 pagination and sort | #452 | 29 files, +685 / −423 |
| S2 error mapping | #454 | 31 files, +208 / −290 |
| S2 batch and envelope | #455 | 0 code (review only) |
| S2 import/export pipeline | #456 | 19 files, +578 / −404 |
| S3 tenant scope unification | #461 | 29 files, +278 / −373 |
| S3 role data-scope model | #461 | 7 files, +54 / −75 |
| S3 OIDC envelope | #461 | 1 file, +13 / −0 (comment only) |
| S4 governance decisions | #441 | 0 code (8 files, +411 / −1) |
| S4 re-export alias removal | #447 | `re_export.go` 112 → 52 lines |

Re-measured at the release commit: inline `ParseUint(c.Param("id"))` 35 → 2, pagination
normalizers 13 → 1 plus adapters, duplicated clamp lines 11 → 1, inline `Offset((page` 14 → 4,
`tenantOwnerID` definitions 11 → 0, `errParamInvalid` definitions 11 → 0, inline sort helpers
8 → 0. RC coverage is 33 of 45; the twelve not covered are enumerated with reasons in
`docs/reviews/CODE_SIMPLIFICATION_PLAN.md` §11.5.

### Tenant lifecycle and membership

- **Delete requires the archived state (W1).** A tenant that is not archived can no longer be
  deleted; the guard runs before any cascade.
- **Member integrity (W2).** Adding an unknown user is rejected and the owner minimum counts only
  live owner rows.
- **A membership without a role binding grants no login or switch (W4).** One predicate
  (`tenant.HasRoleBindingInTenant`) gates login discovery, the candidate list and the switchable
  list; `AddMember` narrows to users owned by the target tenant and returns
  `tenant.member.user_not_in_tenant` (400). The unreachable login picker and shell
  `TenantSwitcher` are removed; the endpoints stay as compatibility surfaces returning at most one
  item, and `/auth/current` keeps reporting unfiltered memberships. Existing cross-tenant rows are
  not deleted.
- **Legacy tenant handler, routes and bootstrap service deleted (W8).** They were never mounted.
- **Console UI smoke (W6)** covers the tenant console; **contract and API docs (W5)** align with the
  shipped surface (tenant contract V1.9, plan-ladder decision A).

### Dependencies

- `github.com/coreos/go-oidc/v3` 3.9.0 → 3.21.0; indirect `go-jose` moves from v3 to v4.
- `test:smoke:tenant` includes `tenant-console.spec.ts`.

### Harness and repository layout

- Completed task packets archived by month under `.harness/archive/<YYYY-MM>/`, with
  `resolveArchiveAwarePath` keeping canonical references resolvable in both trees.
- Release notes live in `docs/release-notes/` with bilingual indexes.
- FR-018 through FR-020 registered; `AI_QUALITY_GOVERNANCE.md` §5.2/§5.3 add the static-analysis
  re-test rule and the multi-wave programme closeout rule.

### Verification

- `go build ./...`, `go vet ./...` clean; `go test -count=1 ./...` → 47 packages ok, 0 FAIL,
  6 without test files.
- Frontend `lint`, `type-check` and `build` clean; `test:scripts` 171/171.
- Repository checkers at zero findings (task packet 0 errors, harness docs, structure, encoding,
  frontmatter, inventory, adoption, visual, UI quality gate, duplication, failure registry,
  evidence strict, review strict).
- Four consumable assets published and verified by `Foundation Release Verify`.

### Known limits

- The LOC window (`53,179 → 52,332` backend production Go, `68,169 → 67,828` frontend sources)
  includes net-additive tenant work, so it understates the reduction and is not quoted as the
  gain.
- The three maintainer-gated items in `CODE_SIMPLIFICATION_PLAN.md` §11.6 stay open.
