# 2026-07-21-v1-leftovers — Evidence Summary

Maintainer-authorized round closing every leftover from the V1.0 release
report (`../2026-07-21-v1-release-readiness/`).

## What changed

1. **Generator real-flow smoke unblocked (3 pre-existing failures).**
   Root cause: the module path moved to `pantheon-platform/modules/...` long
   ago, but the `backend_registry` verification fragment
   (`dynamic_module_summary.go`) and four smoke assertions
   (`module-governance-real` / `module-governance-host-real`) still searched
   the directory-style `backend/modules/<scope>/<name>` string that the
   generated registry never contains — the check warned and the specs failed
   on every run (main nightly Full Smoke red). Strings synced; both suites
   now pass 1/1. The wizard case (`module-governance.spec.ts:420`) failed for
   an unrelated reason: the form label was i18n-ized to 治理面板 while the
   spec looked up the English `Governance` literal.
2. **SecurityEventList query timing** (review Low #4): the page now commits
   `query` synchronously before the request, matching the other audit pages.
3. **Batch id caps** (security review Low S2): login-log/operation-log batch
   delete, session batch revoke, and security-event batch acknowledge reject
   id lists over 500 (`param.invalid`), closing the oversized-IN-clause gap
   behind BodySizeLimit.
4. **Dependabot governance deadlock removed.** `quality.yml` exempts
   `dependabot[bot]` PRs from the heavy body validation: dependabot rewrites
   its PR body on every rebase (wiping appended templates) and third-party
   pushes to workflow-touching branches never trigger CI, so the requirement
   was structurally unsatisfiable — the exact deadlock that stalled
   #185/#188. Structural checks (frontmatter, task-packet, PR template) still
   run for dependabot; `solo-override` semantics unchanged.
5. **#188 merged** (github-actions group, 5 pins) via maintainer-authorized
   `solo-override` + `@dependabot rebase`, branch deleted.

## Verification

See `commands.json`: go build/tests, tsc, eslint, the three generator smoke
targets (all first-time green), and the hand-checked workflow-test regex
compatibility (local `node --test` blocked by a tooling outage; enforced by
this PR's Fast Checks).
