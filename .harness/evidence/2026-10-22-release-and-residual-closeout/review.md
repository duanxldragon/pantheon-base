# Review — 2026-10-22 release and residual closeout

## Verdict

Approve. No product behavior change outside a test helper; release and governance state changes are evidenced and reversible, except the published release assets which are immutable by design.

## Diff scope

| Area | File | Review |
|---|---|---|
| G2 helper | `backend/pkg/testmysql/mysql.go` | DSN resolution extracted into `resolveDSN`; required flag only changes missing-DSN behavior from skip to fatal. Existing parse/connect failures still fatal. `reporter` interface is the narrow subset used, so `*testing.T` and `testing.TB` both fit. |
| G2 tests | `backend/pkg/testmysql/mysql_test.go` | Fake reporter records Fatalf/Skipf; cases cover required/unset, optional/unset, configured DSN, truthy/falsy values and PANTHEON_DSN fallback. No database required. |
| G2 CI | `.github/workflows/ci.yml`, `quality.yml` | Flag added only to jobs that provision MySQL: ci unit-tests, ci bench smoke, quality backend-tests. No gate loosened. |
| B10 | `.github/workflows/smoke-core.yml` | `continue-on-error` removed; job renamed. Smoke-tenant is push-only, so this changes mainline reporting, not PR checks. |
| Docs | `docs/operations/RUNBOOK.md` | MySQL subsection added; stray closing fence that would swallow the Escalation Matrix removed. |
| D2 | `.harness/archive/.../commands.json`, `summary.md` | Credential literals replaced with `<redacted-dev-credential>`; no functionality removed. |
| Evidence | `.harness/tasks/...`, `.harness/evidence/...`, `docs/harness/tasks/...` | Task packet, summary, commands, browser JSON and screenshots. |
| Closure records | `docs/reviews/PANTHEON_BASE_*_2026-10-21.md` | Addenda only; historical judgments preserved, links corrected to `../../.harness/`. |

## Risk analysis

- **Test helper**: low. The default path is unchanged when the flag is absent or falsy. The new failure path only triggers in jobs that set the flag; those jobs already export a working DSN.
- **Workflow**: low. YAML validated by actionlint; required-check configuration unchanged.
- **Release**: no new action. The tag and release already exist; this change does not rewrite them.
- **Credentials**: rotation already performed. The remaining artifact exposure is explicitly recorded; the values are invalid.
- **Docs**: low. Addenda only, verified by frontmatter and task-packet checkers.

## Verification reviewed

- Full backend suite on real MySQL + Redis with both required flags: exit 0, zero skips, zero failures.
- Fail-loud and skip probes for `PANTHEON_TEST_DSN_REQUIRED`.
- 18-route browser sweep and eight interactions: zero console errors, zero failed `/api/` responses.
- Release, ruleset and smoke-run facts fetched from GitHub APIs, not inferred.
- actionlint and documentation/task/evidence checkers pass.

## Residuals

1. v0.17.0 `repo.tar` and its nested copy contain pre-rotation (now invalid) credentials; a follow-up release or authorized asset replacement is required.
2. Historical git objects keep the old values; no history rewrite.
3. Browser acceptance is read-only; write paths are covered by Go integration tests and CI.
4. Race detection is hosted-only due to the Cygwin gcc restriction on this host.
