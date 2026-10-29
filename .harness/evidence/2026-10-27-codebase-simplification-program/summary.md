# Summary — `2026-10-27-codebase-simplification-program`

Programme-level closeout, written 2026-10-29. The per-wave evidence stays where it
was produced (`.harness/archive/2026-10/evidence/2026-10-27-s*/`); this file is the
rollup the programme manifest's `linkage` has always pointed at.

## Status

All 13 waves merged between 2026-10-27 and 2026-10-28 and all 13 manifests read
`completed`. The programme itself stays `in-progress` for one reason: the checklist
item "pantheon-ops builds against the synced foundation release" requires a
maintainer release cut that has not happened.

## The 13 waves, measured

| Wave | Merge | Measured diff (from that wave's evidence) | RC disposition |
|---|---|---|---|
| S1 dead-code | #438 `321a6384` | 19 files, +0 / −1,923 | RC-001/002/003/005/009/010/011 |
| S1 api-surface | #439 `b0a1952a` | 3 files, +11 / −9 | RC-004/007; RC-006/008/029 kept with reasons |
| S2 shared-helpers | #450 `958bc6ba` | 9 files, +641 / −134 (add-only) | landing point for RC-013/014/015/017/019/024 |
| S2 id-parse | #451 `2decc4b4` | 11 files, +66 / −134 | RC-014 (35 → 2 sites) |
| S2 pagination-sort | #452 `73126586` | 29 files, +685 / −423 | RC-013/015/028 |
| S2 error-mapping | #454 `9b22b36b` | 31 files, +208 / −290 | RC-017/019/020/024 |
| S2 batch-and-envelope | #455 `92520d75` | 0 code (5 docs files) | RC-023/025/030 (already resolved or false positive) |
| S2 import-export | #456 `547add28` | 19 files, +578 / −404 | RC-016 |
| S3 tenant-scope | #461 `cbd37694` | 29 files, +278 / −373 (production 25 files +267 / −364) | RC-012/027 |
| S3 role-data-scope | #461 `cbd37694` | 7 files, +54 / −75 | RC-022 |
| S3 oidc-envelope | #461 `cbd37694` | 1 file, +13 / −0 (comments only) | RC-026 |
| S4 governance | #441 `bf0711e9` | 0 code (8 docs files) | RC-031/036/037/038/043 decisions |
| S4 alias-removal | #447 `54151d54` | `re_export.go` 112 → 52 lines | RC-043 (10 zero-consumer aliases) |

Squashed merge commits are not used as the source of these numbers: several of them
bundle adjacent waves' evidence files, so `git show --shortstat` is not comparable
wave to wave.

## Structural metrics at closeout

| Metric | Plan target | Baseline | Now |
|---|---|---|---|
| Inline `ParseUint(c.Param("id")` | 35 → ≤2 | 35 | **2** (i18n keeps `id.invalid`) |
| Pagination normalizers | 13 → 1 | 13 | **1 + field adapters** |
| Page-size clamp lines | — | 11 | **1** (`setting_audit`) |
| Inline `Offset((page-1)*pageSize)` | 14 → 1 | 14 | **4** (`setting_audit` ×1, tenant ×3) |
| `tenantOwnerID` definitions | 11 → 1 | 11 | **0** (all via `pkg/tenant.Scoper`) |
| `var errParamInvalid` declarations | 11 → 1 | 11 | **0** (`pkg/common.ErrParamInvalid`) |
| Sort whitelist helpers | 8 → 1 | 8 | **0 inline + 8 adapters** |
| Backend test packages | ≥46 ok / 0 FAIL | 46 ok | **47 ok / 0 FAIL** |

## Line-count window

`backend/**/*.go` excluding tests 53,179 → 52,332 (−847); `frontend/src/**/*.{ts,tsx}`
68,169 → 67,828 (−341); combined −1,188. The window also carries net-additive tenant
feature work, the release-notes move and the S3776 fix, so it is a lower bound rather
than the programme's gain. The honest reading is that S2 bought infrastructure
(+507 net in shared helpers, +262 net in the pagination wave including its tests)
and paid it back only partly in call-site deletions; the large deletion is S1.

## RC coverage

33 of 45 have a recorded disposition. The 12 without a wave record
(RC-018, 021, 032, 033, 034, 035, 039, 040, 041, 042, 044, 045) all sit in the plan's
explicit "not in this round" table, so they are declared debt rather than misses.

## Verification at closeout

`go build` / `go vet` clean; `go test -count=1 ./...` 47 ok / 0 FAIL / 6 packages
without test files / 0 SKIP. No route, permission code, menu, i18n key, error code,
schema or migration changed anywhere in the programme: the only files touched under
`modules/**` are handlers and services, and every migration/router/locale file is
untouched across the 13 waves.

## Consumer build (closed 2026-10-29)

1. `pantheon-base-v0.18.0` (tag `b4bb2392`, `release/0.18`) was published on 2026-10-29 with the four
   assets and a green `Foundation Release Verify` (run 40810043123).
2. Rebuilding `pantheon-ops` against it built the backend (`go build ./...` 0) but failed the frontend
   with `TS2614`: `api/request` no longer exported `isForbiddenRequestError`, which
   `business/deploy/task/DeployTaskDetail.tsx:29` imports. That was an S1 regression (FR-021).
3. `pantheon-base-v0.18.1` (tag `93505225`, published 2026-10-29T04:19:38Z, four assets,
   `Foundation Release Verify` run 40817118092 success) restores the export.
4. `pantheon-ops` rebuilt against 0.18.1: `rebuild:from-base` assembled 756 files, backend
   `go build ./...` exit 0, frontend `npm run build` → `✓ built in 725ms`. The live-tree replacement
   remains the consumer repository's own L2 gate.

## Open items

1. `pantheon-ops` live-tree replacement and commit — consumer repository review (build reading above
   is from the staging tree).
2. Freeze-vs-continue decision after S2/S3 — maintainer strategy call.
3. RC-036/037/038 final disposition — S4 recorded keep and keep-and-check; reversal needs its own wave.
