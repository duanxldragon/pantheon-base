---
title: Main Sonar Remediation Runbook (EN)
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-07
---

# Main Sonar Remediation Runbook (EN)

Chinese version: [MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md](./MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md)

## 1. Remediation Flow (3 steps)

```
Local CI gates pass → Write tests/refactor → Merge, then trigger Sonar
```

**Step 1 — Scope**

Fix one layer or domain at a time:

- `pkg/`, `system/auth`, `system/iam`, `system/config`, `system/org`
- Frontend shared components and real pages (not fixture/smoke)

**Step 2 — Fix + Verify**

```bash
npm ci
go test ./...
cd frontend && npm ci && npm run lint && npm run build
```

Principles:

- Write tests before refactoring code. Coverage starts at 3.5% — every new test line directly improves the metric.
- When fixing Sonar issues, always add tests for the affected package.
- Fix frontend duplication by extracting shared components, not by making meaningless abstractions.

**Step 3 — Merge then trigger Sonar**

```bash
gh workflow run sonar.yml --ref main
```

After the remote Sonar completes, check the result. If the quality gate is still ERROR, document the regressed metric and start the next round.

## 2. Evidence

One file per round: `.harness/evidence/<task-id>/summary.md`, containing:

- Which issues were fixed
- Coverage and duplication changes
- Remaining known gaps

No more `commands.json` + `review.md` + per-phase logs. Add a brief runtime evidence note only if the fix touches runtime-sensitive areas (auth, permissions, import/export).

## 3. Environment

### Local Sonar (optional)

```bash
cp pantheon-sonarcloud.env.example pantheon-sonarcloud.env
# Edit and fill in SONAR_TOKEN
pwsh -File scripts/run-sonar.ps1
```

Local Sonar is not required for daily work. PR Sonar analysis provides sufficient feedback.

### Windows note

`go test -race` is not supported on Windows. Use `go test ./...` locally. Race tests are covered by `quality.yml` on Ubuntu CI.
