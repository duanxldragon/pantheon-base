# Dirty bootstrap P0 — implementation and scoped verification complete

Parent packet: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`.
Exact changed files, SHA256 hashes, command exits and evidence hashes: `resume-migration-receipt.json`.
Scope and review limits: `resume-migration-scope.md`, `resume-migration-review-notes.md`.

Recorded dirty state now refuses startup before schema-marker inference, with `migrate.ErrDirty` preserved through the existing startup wrapper. Direct bootstrap is also guarded. Dirty, malformed, multiple-clean and unreadable state is unhealthy; legitimate absent-state bootstrap and valid single clean readiness remain supported. No automatic recovery/Force, source SQL migration or dependency was added.

Changed source files only:

- `backend/pkg/database/migrate.go`: startup/direct-bootstrap dirty guards and actual recorded-state readiness; ambiguous clean state/read errors fail closed.
- `backend/pkg/database/migrate_test.go`: replace the old dirty auto-repair expectation with typed refusal and unchanged dirty2.
- `backend/pkg/database/migrate_dirty_bootstrap_test.go`: real MySQL dirty/unknown-state preservation, mutation witness, clean/legacy/fresh compatibility and read-failure regressions.

Final verification (backend module, CGO_ENABLED=1, required local MySQL 8.0.36 at 127.0.0.1:33316):

| Command                                                                                                    | Exit / result                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `go test -race -count=1 -json -timeout 10m ./pkg/database`                                                 | 0; 161.787s; 185 passed test events including parent tests; zero failure/skip events |
| `go test -count=1 -v -timeout 5m ./pkg/database -run '^TestMigrationBootstrapRetainsCleanAndAbsentState$'` | 0; all 8 compatibility cases                                                         |
| `go vet ./pkg/database`                                                                                    | 0, final test fixture included                                                       |
| `go build ./pkg/database`                                                                                  | 0, final production source                                                           |
| `git diff --check` for the three source paths                                                              | 0                                                                                    |
| `gofmt -l` for the three source paths                                                                      | 0; no unformatted files                                                              |
| MySQL task-prefix cleanup query                                                                            | 0; zero remaining task test databases                                                |

The final race run includes all 75 dirty cases, all 48 malformed/multiple-state cases, all 8 fresh/legacy/clean cases, the read-failure test and the updated legacy dirty test. Dirty values and SQL serialization remain equal, column schemas remain unchanged and INSERT/UPDATE/DELETE witnesses remain empty on refusal. Both DSN_REQUIRED=1 and PANTHEON_TEST_DSN_REQUIRED=1 were set; no integration skip is counted as green.

Original reproduction is preserved: `resume-migration-red.txt` (exit1) shows dirty37 -> clean24 through bootstrap and dirty37 -> clean31/success through actual RunMigrations. The first post-fix fixture failure (exit1) and first race external-link failure (exit1) are also retained with their corrected final checks, not replaced or waived.

Only this adapter's implementation and scoped checks are complete. Independent CODE/ARCH approval, full shared release gates, official publication and paired Ops consumption remain root-owned and open. No unrelated edit, existing receipt, Ops inherited file, consumer lock, foundation manifest/plan, commit, push or publication was changed.
