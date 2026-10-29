# Summary — S2-import-export-pipeline (RC-016)

Wave: 2026-10-27-s2-import-export-pipeline
Branch: refactor/s2-import-export (9 commits, 19 files, +578/−404 incl. 95-line inventory doc)
Human gate (standalone PR): maintainer-delegated 2026-10-28 (“我授权给你自动完成，不要再询问我”)； this wave was kept as its own PR with nothing else in flight, satisfying the gate's intent.

## What was extracted

One receive pipeline and one template builder in `pkg/impexp`:

| Helper | Replaces |
| --- | --- |
| `ReadImportCSV(c)` | the identical 17-line FormFile→Open→defer-close→ReadCSV→envelope block in all 8 import handlers |
| `NewImportResult()` | 8 copies of the literal `&ImportResult{Applied: false, Errors: []ImportError{}}` |
| `BuildHeaderIndex(records)` | 6 copies of the trim-header index loop (dict/role fn, post inline, user/dept/i18n composites) |
| `RequireHeaders(result, idx, ...)` | 6 copies of the `import.header.missing` reporting loop (required lists stay at call sites) |
| `ForEachDataRow(records, fn)` | 7 row-loop skeletons (skip header/blank/#comment rows, 1-based rowNumber) — post kept local (skip lives inside `readImportRow`, different shape) |
| `BuildImportTemplate(filename, note, headers, examples...)` | 8 template builders (6 named by the packet + permission + i18n), including i18n's two unprefixed example rows |

## What deliberately did not move

- Extension/MIME check: none exists today (inventory §0); adding one would change observable behaviour and is scope-out.
- Post's row loop (skip inside `readImportRow` with `(row, err)` hard-fail signature).
- Permission's `failPermissionServiceError` (its one custom error responder) and its operator-scope input `common.GetRoleKeys(c)`.
- i18n's `updatedBy` input and its `Applied = Created>0 || Updated>0` success variant.
- All db-nil, empty-file, soft-fail gating, transaction apply, and rollback-sentinel logic (module-local, load-bearing).
- `pkg/impexp/csv.go` and `import_helpers.go` (already shared; import_helpers is do-not-touch).
- Route registration, permission middleware, data-scope input — authorization untouched (inventory §4).

## Validation accounting

Every pre-existing validation has a before/after row in `validation-inventory.md` (§1–§5) and a final home in §8. New tests lock the packet's security asks: oversized rejection (folded envelope, same as today), no-extension-check reality lock, formula-injection escaping on export (`'=1+1` etc., numeric `-5` unescaped), template golden shapes.

## Verification (evidence: commands.json)

- gofmt clean, `go build ./...`, `go vet ./...` clean
- `go test -count=1` across pkg/impexp + all touched module trees: ok
- Live smoke: base server built from this branch, started on 127.0.0.1:8081 against the .env.test test DB (port 8080 untouched — the maintainer's pantheon-server-ops.exe runs there; Redis coexistence analysis in commands.json step 8), then the acceptance guide's automated API smoke `npm run test:smoke:system:api`: **11 passed (4.2s)** — every converted module's import+export round-trip, all 6+2 templates with comment rows, audit/login exports, batch delete. Server stopped after; port released.

## Commit ladder (one module per commit per packet implementationNotes)

92282b53 feat(impexp) → 22ee1f3b dept → 5b2d2132 post → e572fc17 user → 4ca58011 role → 55ea3552 dict → 5f07dea6 permission → a2383019 i18n → 7edacd7b style gofmt

Bisecting any regression to the import path: revert the module commit or check out its parent and re-run the API smoke.

## Premise-vs-reality deltas (all documented, none bent)

1. No extension/MIME check exists → pipeline does not add one; reality locked by test.
2. `scripts/run-smoke-suite.mjs` (packet verificationPlan) no longer exists → the acceptance guide's automated smoke was used.
3. audit/login are export-only → not modified (packet expectedFiles over-listed them).
4. Role import IS routed (`POST /role/import`, system_modules.go:219) though the smoke guide §1 still says export-only — pre-existing doc drift, unchanged by this wave.
5. Permission's header-validator BadRequest sentinel was never observable → dropped with the composite.

## Known gaps (explicit)

- i18n import has no API-smoke entry (guide scope predates it); covered by the modules/system/i18n go suite.
- Per-module smoke ran as one serial suite over the fully-converted server rather than eight separate invocations; per-module isolation is the commit history.
- Smoke guide §1 role line is stale (drift predates the wave; left for a docs pass).
