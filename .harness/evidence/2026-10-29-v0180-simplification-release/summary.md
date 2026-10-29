# Summary — `2026-10-29-v0180-simplification-release`

## What this package does

Cuts `pantheon-base-v0.18.0` on `release/0.18` from the `main` commit that carries the full
thirteen-wave code simplification programme, then advances `pantheon-ops` to that release and builds
it. No product source is modified here: every behavioural change in the release is already merged
and already carries its own wave evidence.

## Version decision

`0.18.0` (minor), not `0.17.9` (patch). `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 lists
"架构优化（不影响消费仓）" and "治理增强" as minor, and this batch is exactly those two plus the
tenant lifecycle waves that merged after v0.17.8:

| Reason | Evidence |
| --- | --- |
| Architecture optimisation: 13 simplification waves | `docs/reviews/CODE_SIMPLIFICATION_PLAN.md` §11.2 |
| Governance enhancement: release-notes directory, monthly harness archive, FR-018–FR-020 | `docs/harness/AI_QUALITY_GOVERNANCE.md` §5.2/§5.3 |
| Behaviour change: W1 archive guard, W2 member integrity, W4 issuance gate, W8 dead surface | wave evidence under `.harness/archive/2026-10/evidence/2026-10-27-tenant-*` |
| Dependency move: `go-oidc` 3.21.0, `go-jose` v4 | `backend/go.mod` diff since `e256d1fb` |

## What the release contains

Everything merged into `main` since `e256d1fb` (v0.17.8, 2026-10-27):

- 13 simplification waves (S1 ×2, S2 ×6, S3 ×3, S4 ×2), merges #438, #439, #441, #447, #450–#456,
  #461.
- Tenant waves W1 (#436), W2 (#434), W4 (#442), W5 (#443), W6 (#459), W7 (#458), W8 (#445), W3
  decision (#440), plan-ladder decision A (#460), `TenantList` S3776 fix (#464).
- `go-jose` v3 → v4 and `go-oidc` 3.9.0 → 3.21.0 (#463).
- Release notes moved to `docs/release-notes/` with bilingual indexes (#462); `.harness/`
  completed-task archive with archive-aware reference resolution (#466); programme closeout (#467).

## Structural readings at the release commit

| Metric | Plan target | Reading |
| --- | --- | --- |
| inline `ParseUint(c.Param("id"))` | ≤ 3 | 2 |
| pagination normalizers | 1 + adapters | 1 + adapters |
| duplicated clamp lines | 1 | 1 |
| inline `Offset((page` | ≤ 5 | 4 |
| `tenantOwnerID` definitions | 0 | 0 |
| `errParamInvalid` definitions | 0 | 0 |
| inline sort helper definitions | 0 | 0 (8 adapters) |

RC coverage: 33 of 45; the twelve not covered are enumerated in the plan §11.5.

## Boundaries

- No migration: the chain still ends at `000030_tenant_plan_definitions` (schema 30).
- No removed route, permission code, menu key or i18n key. One error code added:
  `tenant.member.user_not_in_tenant` (400).
- `sharedPaths` unchanged at 52 entries; the consumer lock moves version, release line, commit and
  the two checksums.

## Release mechanics

1. This package merges to `main`.
2. `Release Gate Summary` and the six required checks must be green on the release commit.
3. `cut-foundation-release.mjs` → `check-release-secrets.mjs` → `publish-foundation-release.mjs`
   create the annotated tag and the GitHub release with four assets.
4. `check-release-assets.mjs` and `Foundation Release Verify` confirm the asset set.
5. `pantheon-ops` advances its lock, runs `rebuild:from-base`, `go build ./...` and the frontend
   build.

## Known gaps

- The LOC window (`53,179 → 52,332` backend production Go, `68,169 → 67,828` frontend) contains
  net-additive tenant work and is a lower bound, not the programme's gain.
- The three maintainer items in `CODE_SIMPLIFICATION_PLAN.md` §11.6 stay open.
- `pantheon-ops` changes are recorded as a consumer-side diff; committing them belongs to that
  repository's review.
