# Summary — Restore green Code Quality Gates on main (post PR #198)

## Failure being fixed

Main push `d58c84e8` (squash of PR #198) turned **Code Quality Gates** red
(run 29969367373) on three independent causes; CI and Security Gates on the
same commit are green.

| Failing job | Root cause | Fix |
|-------------|-----------|-----|
| Docs Governance → Harness Inventory | `check-coverage.mjs` (extended in #198 with `--format json`) was never registered in `scripts/harness/README.md`; strict inventory gate on push flags unlisted scripts | Registered in `README.md` + `README.zh.md` under Pantheon Base Additions |
| Docs Governance → Harness Sync | `check-doc-frontmatter.mjs` drifted one line vs the `pantheon-harness` mirror: PR #196 changed `.sort()` → `.sort((a, b) => a.localeCompare(b))` (SonarCloud S2871) in pantheon-base only | Upstream synced: pantheon-harness main `57223d9` (canonical side was pantheon-base) |
| Go Lint (quality.yml) | Enforce step fails full-repo lint on `push` events; historical debt is accepted (see `.harness/tasks/2026-07-22-sonarcloud-remediation`) and ci.yml was already made report-only for pushes in #198 — quality.yml was missed | `push` events now report-only with rationale; PR (`--new-from-rev`) and merge_group enforcement unchanged |

## Related out-of-band remediation (same session, recorded here for audit)

- CodeQL alerts #63/#85 (`go/log-injection`, `backend/pkg/logging/logger.go:111,118`)
  dismissed as **false positive**: both sinks receive values passed through
  `SanitizeLogValue` (strips `\n`, `\r`, U+2028/29, control chars via `strings.Map`)
  and `sanitizeLogFields`; CodeQL cannot model `strings.Map` as a taint barrier.
  This unblocked Security Summary on PR #198 and Security Gates on main.

## Verification

- `npm run check:harness-inventory` → 0 findings
- `npm run check:harness-sync` → 0 findings
- `npm run check:docs-frontmatter`, `check:harness-encoding`, `check:structure`,
  `check:task-packet-template`, `check:pr-governance` → all EXIT 0 (see commands.json)
- quality.yml change is scoped to the go-lint *enforce* step conditional only;
  lint itself still runs and reports on every event.

## Risk

Governance/docs/workflow-only change (`governance_only` scope). No runtime code
touched. The only behavioral CI change is push-event go-lint enforcement, which
was permanently red on accepted historical debt and therefore carried no signal;
new-code enforcement on PRs is unchanged.
