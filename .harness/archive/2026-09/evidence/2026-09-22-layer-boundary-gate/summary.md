# Summary — 2026-09-22-layer-boundary-gate

## Scope

Wave 1 #3 of `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` (P0):
enforce production layer dependency boundaries beyond `business/*`.

## What changed

1. **Fixed the platform violation.** `backend/modules/platform/routes.go` no longer
   imports `system/org/dept`. The `platformDeptGovernanceTaskLoader` adapter moved to
   the composition root: new `backend/cmd/server/platform_org_governance.go`;
   `RegisterPlatformRoutes` now takes an `OrgGovernanceTaskLoader` and `main.go`
   injects it. Behavior is identical (adapter field mapping copied verbatim).
2. **Extended the gate.** `scripts/harness/check-boundaries.mjs` now scans
   `platform` and `auth` production code as well as `business` (Go + TS), exempts
   `_test.go` / `*.test.*` / `*.spec.*`, and adds `--baseline <path>`: matching
   findings are printed as `baselined` and excluded from the strict failure count,
   stale baseline entries raise a warning, and any new finding still exits 1.
   Findings are now reported relative to the repository root so a baseline is
   portable across invocation roots.
3. **Froze known debt.** `config/boundary-baseline.json` records 8 findings, each
   with a `reason` and `reviewBy: 2026-12-31`.
4. **Wired CI.** `.github/workflows/ci.yml` runs the gate with
   `--baseline config/boundary-baseline.json`.
5. **Tests.** `tests/scripts/harness-check-boundaries.test.mjs` (6 cases).

## Why auth is baselined, not refactored here

`auth/login` and `auth/security` query the `user.SystemUser` **GORM model**
(`s.db.Model(&user.SystemUser{})`, password history, MFA) — not just a type. Decoupling
needs a `UserReader/UserCredential` contract injected at the composition root. That is a
security-critical refactor of the login/session/MFA path and is deliberately deferred to
a review-dated baseline, per the plan's "freeze the baseline first, then fix" ordering.

## Verification (all green)

- `go build ./...`, `go vet` on platform+cmd, `go test ./modules/platform/...` (ok 2.9s).
- Boundary gate: `0 finding(s), 8 baselined, 0 warning(s)`, exit 0.
- Checker unit tests: 6 pass / 0 fail.
- Structure gate: 0 findings. Doc links: 0 findings.

## Known gaps

- 3 backend auth files model-level coupled to `system/iam/user` — baselined to 2026-12-31.
- 1 platform type import + 4 auth shared-CSS imports — baselined to 2026-12-31.
- `scripts/check-arch-boundaries.mjs` still overlaps the harness checker, not wired to CI.
- `npm run` unavailable on this host; equivalent node/go commands were run instead.

## Completion Status

complete (P0 objective met: new cross-layer violations now fail CI; known ones tracked)
