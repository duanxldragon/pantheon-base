# Review — `2026-10-28-release-gate-green`

Reviewed the working tree on branch `fix/release-gate-green`
(base `cbd37694`, the merge of #460, #461 and #462). Measured diff: 8 tracked
files, +332/−294, plus the new task packet and this evidence directory.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| The advisory surface is the only thing that moved | `go.mod` has a single go-jose line (`v4.1.6 // indirect`), `go.sum` has only the two v4.1.6 hashes, and `go mod graph` shows no `/v3` edge. `go-oidc` is the only requirement that changed (v3.9.0 → v3.21.0); the rest of the diff is untouched requirements. |
| The five Sonar items are genuinely refactored | No `NOSONAR`, no `sonar.exclusions`/`ignore` change, no deleted test, no lowered threshold. The five files show: one comment rewrite, one parameter-list merge, two function extractions in test files and one local helper in the component. `check:task-packet`, `check:structure` and the frontend gates stay green. |
| Extracted helpers match the old bodies assertion by assertion | `smokeRoleIsolation` keeps `DataScope: common.DataScopeModeSelf` and the `smokeRoleBID` update/delete rejections; `smokePostIsolation` keeps `DeptID: smokeDeptAChildID`; `smokeDeptIsolation` still deletes `smokeDeptBChildID` and expects `countSmokeRows(..., "system_dept", smokeTenantB) == 2`; `smokeDictIsolation` still asserts the written `tenant_id` equals the context tenant; `smokeSettingIsolation` still checks both the multi override and the compat platform-global fallback. Subtest names are unchanged strings. |
| Permission booleans still resolve identically | `can(perm)` is `isAdmin \|\| hasPerm(perm)`, the same expression each of the five flags used. It is called during render only, so the five booleans keep their previous values and types (plain `boolean`), and `loadMemberCandidates`' `[canBrowseUsers]` dependency stays stable. `tsc -b` and `vite build` both pass. |
| No gate, workflow or release-surface change | The diff contains no `.github/**`, no `sonar-project.properties`, no migration, no `VERSION`, no `CHANGELOG.md`. The gate rules that were red are exactly the ones the fix targets; nothing was relaxed. |

## Findings

- **P2, observed-only-in-CI resolution**: both red jobs read remote state
  (SonarCloud analysis of `main`, GitHub's dependency graph). Neither can be
  proven green locally; the fix is verified structurally and the resolution is
  observable only after merge. Recorded as the task's primary gap rather than
  claimed as a done gate.
- **P3, three uncalled advisories**: `govulncheck -show verbose` still lists
  GO-2026-6866, GO-2026-6860 (`golang.org/x/net@v0.60.0`) and GO-2026-5932
  (`x/crypto` openpgp). They are unreachable from base code and carry no
  Dependabot alert, so they do not block this gate — but a future advisory
  refresh could turn them into blocking alerts, which is why they are written
  down here instead of being silently ignored.
- **P3, environment trap**: an unqualified `go test -race` on this machine
  reports `[build failed]` for every package with a single `cgo.exe: exit
  status 2` line and no further detail. The working invocation is
  `PATH=/d/msys64/mingw64/bin:$PATH CGO_ENABLED=1 go test -race ./...`. Worth
  remembering before concluding the suite is broken.

## Machine Readable

```json
{
  "taskId": "2026-10-28-release-gate-green",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/go.mod",
      "backend/go.sum",
      "backend/modules/auth/oidc/handler.go",
      "backend/pkg/database/notfound.go",
      "backend/modules/system/iam/tenant_isolation_smoke_test.go",
      "backend/pkg/tenant/scope_helper_test.go",
      "frontend/src/modules/system/iam/tenant/TenantList.tsx"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 remote-only resolution: SonarCloud and Dependabot read main's remote state, so the gate can only be observed green after merge; local proof is structural (module graph clean, complexity thresholds cleared) plus compiling race-tested code.",
      "P3 uncalled advisories: govulncheck lists x/net HTML coalescing x2 and x/crypto openpgp in required-but-uncalled modules; no Dependabot alert and no reachable path today.",
      "P3 environment trap: go test -race needs CGO_ENABLED=1 and mingw64/bin on PATH, otherwise every package reports a diagnostic-free [build failed]."
    ],
    "notes": "Gate remediation only. Dependency: go-jose/v3 left the graph because go-oidc moved to v3.21.0, which depends on go-jose/v4; 4.1.6 is the selected version and govulncheck reports zero reachable vulnerabilities. Sonar: five findings cleared by comment rewrite, parameter-list merge, two test-function extractions and one component-local permission helper - no suppression, no exclusion, no deleted assertion. Verification: gofmt clean, vet clean, build ok, CGO_ENABLED=1 go test -race 47 ok / 0 FAIL / 6 no-test packages, isolation smoke compiles and skips without a DSN, frontend eslint/tsc/vite all green, task-packet/structure/encoding/frontmatter/doc-links/inventory/generated/UI gates at zero findings. Behaviour is unchanged: every extracted helper carries the original assertions verbatim and the five permission flags still evaluate isAdmin || hasPerm(perm)."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-28-release-gate-green/manifest.json",
    "evidence": ".harness/evidence/2026-10-28-release-gate-green/commands.json",
    "reviewFile": ".harness/evidence/2026-10-28-release-gate-green/review.md",
    "changeRef": "none",
    "planRefs": [
      ".github/workflows/release-gate.yml",
      "docs/harness/AI_QUALITY_GOVERNANCE.md"
    ]
  }
}
```
