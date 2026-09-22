# Summary — 2026-09-20-module-governance-flaky-timeout

## Scope
Test-only stabilization: raise `module-governance-real.spec.ts` test budget to 120s so it can contain the spec's own retry budget (toPass 60s / goto 90s from #246/#284). No product behavior change.

## Root cause (recap)
Config-level 30s timeout < the spec's internal retry budget; on 2-vCPU CI runners the real generate→register→purge cycle died at ~29.9s whenever Vite's first compile of the generated module ran long. Timeout-inverted flake, unrelated to product behavior.

## Verification
- Real-flow smoke executed locally against a live MySQL/Redis backend: **1 passed (10.9s)** with `PANTHEON_API_BASE_URL=http://127.0.0.1:8081/api/v1` and vite proxy `--proxy-target http://127.0.0.1:8081`.
- The same spec against the maintainer-started 8080 backend surfaced a **separate environment finding**: that process has no `node` in PATH, so the generator preview endpoint (`/lowcode/generator/preview-files`) returns 500 `module.generate.server_export_failed` (`exec.LookPath("node")` fails in `backend/internal/scaffold/workspace.go`). Standalone exporter run and a second backend started with `PANTHEON_NODE_BIN=D:/nodejs/node.exe` both succeed (preview returns 200 with full file list). This is a runtime-environment note for the maintainer, not a code defect and not covered by this PR.

## Evidence chain
- commands.json — the six-step verification record
- review.md — reviewer disposition

## Known gaps
- CI-level confirmation arrives with the PR's Full Smoke Suite run.
- 8080 node/PATH finding is maintainer-side environment work.

## Closeout (post-merge, 2026-09-22)

- PR #325 merged to `main` as `99f630868d1df89fce82c9a08d8229e889c17909`.
- The timeout-only change is present on `main`; no product code or global timeout was changed.
- Hosted full-smoke timing remains the runner-specific confirmation. The local 8080 backend's
  missing Node executable is an environment prerequisite and is not represented as a test failure.
