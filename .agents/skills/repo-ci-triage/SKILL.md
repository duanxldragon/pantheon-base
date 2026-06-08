---
name: repo-ci-triage
description: Use when Pantheon Base GitHub Actions is red and the failure needs local reproduction mapped to this repository's workflow names and checks
---

# Repo CI Triage

Start from the failing workflow, job, and step. Reproduce the real failing job, not the aggregate gate.

## Gather First

- workflow name
- job name
- failing step name
- commit SHA or PR head
- short log excerpt

## Workflow Map

- `quality.yml` -> `docs-governance`
  - `npm ci`
  - `npm run check:docs-frontmatter`
  - `npm run check:task-packet-template`
  - `npm run check:generated-modules`
- `quality.yml` -> `frontend-contract`
  - `cd frontend && npm ci`
  - `npm run check:menu-contract`
  - `npm run lint`
  - `npm run build`
- `quality.yml` -> `backend-tests`
  - `go test -race ./...`
- `quality.yml` -> `quality-gates`
  - reproduce the first failed dependency job instead of debugging the aggregator
- `security.yml` -> `dependency-vulnerabilities`
  - `go run golang.org/x/vuln/cmd/govulncheck@latest ./...`
  - `npm ci && npm audit --registry=https://registry.npmjs.org --audit-level=high`
  - `cd frontend && npm ci && npm audit --registry=https://registry.npmjs.org --audit-level=high`
- `security.yml` -> `secret-scan`
  - `go run github.com/zricethezav/gitleaks/v8@latest detect --no-git --source . --redact`
- `security.yml` -> `workflow-posture`
  - `python -m pip install --user zizmor`
  - `zizmor --format json .github/workflows`
- `quality.yml` or `security.yml` -> `codeql-security`
  - you usually cannot mirror the full hosted scan locally
  - first fix compile, config, and obvious sink/control issues
  - if the diff is risky, run `security-diff-scan`

## Common CI-Only Causes

- Node or Go version drift
- missing `npm ci` lockfile alignment
- generated files not updated
- path-case or path-separator issues
- workflow permissions or checkout depth assumptions

## Exit Condition

Report:

- failing workflow/job/step
- local reproduction command
- root cause
- fix applied
- remaining hosted-only risk
