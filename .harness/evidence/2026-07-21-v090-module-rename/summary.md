# 2026-07-21-v090-module-rename — Evidence Summary

v0.9.0 freeze: Go module rename + three governance gates, executed by the
software team (lead Qi / architect Gao / engineer Kou / QA Yan) under
maintainer authorization.

## What changed

1. **Go module rename `pantheon-platform` → `pantheon-base`.**
   `backend/go.mod` module declaration + 142 `.go` files / 339 import paths.
   Import paths never carry the `backend/` segment (go.mod lives inside
   `backend/`). Done via `scripts/maintenance/rename-module.sh` (allowlist
   directories, quoted-literal sed pattern to avoid touching physical paths
   `D:\workspace\go\pantheon-platform\...` and narrative docs).

2. **Lowcode generator template sync (the hidden bomb).**
   `backendGenerator.ts` hard-coded 5 old-path imports
   (`pantheon-platform/pkg/common`, `pkg/database`, `internal/middleware`,
   `pkg/contracts`). Without this, every module ops generates after the
   rename would fail to compile. Synced to `pantheon-base/...`.

3. **Smoke assertions + cleanup/drift scripts.**
   4 smoke assertions, `cleanup-generated-modules.mjs` dead regex
   (matched the pre-`backend/`-move form `pantheon-platform/backend/...`),
   normalized to the current real form `pantheon-base/modules/business/`;
   `triage-base-drift.mjs` normalization updated.

4. **Three fix-report §4 leftover gates.**
   - business/* boundary (double): golangci-lint `depguard`
     `business-boundary` rule + `check-boundaries.mjs --strict --repo
     pantheon-base` in CI `boundary-gate`.
   - coverage gate: new `check-coverage.mjs` + CI `coverage-gate`;
     threshold = measured 12.2% × 0.9 = 11%, ratchet later.
   - MFA production mandatory baseline section in DEPLOYMENT_GUIDE.md
     (`login.mfa_enabled=1` + 4 more).

## Verification

go build/vet/test green; gofmt clean; tsc 0 errors; residual grep 0;
depguard POC blocks injected bad import, full scan no false positives;
boundary/coverage gate scripts exit 0.

## Notes / decisions

Q1=A / Q2=B / Q3=POC (files glob `**/modules/business/**`) / Q4=measured×0.9
/ Q5=A / Q6=A / Q7=A. VERSION left as harness shell version (1.4.0); product
version carried by git tag `pantheon-base-v0.9.0`. govulncheck fix in
separate PR #190.
