# Summary — 2026-09-23-ci-triage-338-fallout

## Scope

CI triage of the 2026-09-22 remediation closeout: the #338 merge exposed three defects that a
case-insensitive local checkout cannot see, and after the merge the main-branch Release Gate
went red. Both the #338 repairs (commit `474d1f65`) and the #339 repairs (commit `5544e4be`)
are recorded here.

## What CI found

| Gate | Evidence | Root cause |
|---|---|---|
| Frontend Contract | `[UNRESOLVED_IMPORT] Could not resolve './Dashboard.css'` | The PascalCase rename was applied to the import but never to the tracked file. `core.ignorecase=true` means Windows cannot see the difference, so local builds pass and Linux builds fail. |
| Go Lint (new code) | 9 findings | All on lines the rounds added: repeated test literals (goconst), `int -> uint64` counter conversions (gosec G115), `RequireRedis`/`MigrationsHealthy` comment form (revive), a redundant declaration (staticcheck QF1011), an unnecessary conversion (unconvert), and two symbols left unused by the read-path cleanup. |
| Release Gate (main) | `Release blocked: 5 unresolved SonarCloud issue(s)` | Five code smells in the merged code: `session_helpers.go` repeated `LOWER(...) LIKE ?` / ` LIKE ?` / `%mobile%`, `auth_repository.go` repeated `id = ?`, and a single-use variable in the tenant-scope test. Release Gate was green on the pre-merge main commit, so the merge introduced them. |

## What changed

1. **Path case.** `frontend/src/modules/platform/dashboard.css` is renamed to `Dashboard.css` in
   git (`R100`), and the two consumers of the old name are updated: the shell visual contract
   checker and the theme-token reference docs (zh + en).
2. **Lint findings.** Test values became named constants; the pagination benchmark walks a
   timestamp forward instead of converting the loop counter; the two exported comments now lead
   with the identifier; the redundant port declaration became a concrete-adapter assertion; the
   unnecessary conversion was dropped; `issueTokenPair` and `seedActiveSessionWithTokens` were
   deleted (no references remained). No `nolint` suppression was used anywhere.
3. **SonarCloud smells.** The session filters now build their predicates from one
   `sessionUserAgentLowerExpr` plus named LIKE/NOT LIKE clauses and device tokens;
   `iam/user/auth_repository.go` reuses the package's existing `condIDEquals`; the tenant-scope
   test drops the single-use variable.
4. **Guard, not just a fix.** New `frontend/scripts/check-import-path-case.mjs` resolves every
   relative specifier in `src/` against the real on-disk entry names and is wired into the
   `prebuild` chain, so this failure class now fails locally (and on any filesystem) rather than
   waiting for a Linux build.

## Verification highlights

- The guard's negative test reproduces the exact CI failure locally: reverting the import to
  `./dashboard.css` makes it exit 1 with the case mismatch named.
- The SonarCloud refactor is proven behavior-preserving by a new test that pins the rendered SQL
  for all five device filters (`session_client_filter_sql_test.go`); those clauses had no test
  before.
- `golangci-lint run --new-from-rev` (the exact PR gate scope) reports `0 issues`; the full-repo
  run still reports 145 accepted historical issues, which the gate intentionally does not block on.
- PR #338 finished at 27 pass / 0 fail. Main push `6387115e` ran CI, Code Quality Gates, Security
  Gates, Core Smoke Tests and Full Smoke Suite green.

## Known gaps (explicitly out of scope)

1. **Full Smoke Suite is flaky on main.** `business/generated/module-governance-real.spec.ts` timed
   out on a 60s predicate on commit `2b1cba31` at 21:37 while the same commit passed at 08:17. It
   passed again on `6387115e`, so this is flakiness rather than a regression — but it is unfixed.
2. **`.golangci.yml` still carries three keys golangci-lint v2 rejects**
   (`goconst.ignore-tests`, `issues.exclusions`, `output.sort-results`). The CI comments already
   call this deferred debt; the practical effect is that the `_test.go` exclusions silently do not
   apply, which is why 5 of the 9 lint findings were in test files. Left untouched to avoid
   changing gate semantics silently.
3. **Local `npm run <script>` is unusable in this Cygwin environment** (npm resolves `bash` to the
   WSL shim and dies before the script runs); the underlying tools were invoked directly instead.
   This is an environment gap, not a repository gap.
4. **pantheon-ops sync** for the session-filter and port changes remains deferred to the next
   foundation release, unchanged from the 2026-09-22 rounds.
