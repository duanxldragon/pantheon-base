---
name: repo-verify
description: Use when finishing a Pantheon Base change or deciding the minimum local verification matrix for the touched scope before commit or PR
---

# Repo Verify

Pick the smallest command set that still proves the touched scope.

## Choose the Verification Phase

During iteration, run the affected package/page checks and regression counterexamples. At final delivery, apply the matrix below and repository-required gates. Reuse passing evidence only when it matches the same candidate and relevant configuration; rerun affected checks after edits. Narrow iteration results never replace required full checks.

Before runtime-sensitive verification, record candidate/binary identity, isolated DB/Redis fixtures, actual provider availability and resource readiness. A timeout is a failure/gap to diagnose, not a pass; change the hypothesis before repeating an unchanged run. Keep the environment boundary in the current task summary.

For method/entrypoint work run `node ../pantheon-harness/scripts/harness/check-method-consumption.mjs --root . --source ../pantheon-harness`. Update a pin only after review. For changed manifests explicitly regenerate the Unreleased task-index helper with `node ../pantheon-harness/scripts/harness/render-task-index.mjs --root . --write`.

## Use This Matrix

- Docs or root governance scripts:
  - `npm run check:docs-frontmatter`
  - `npm run check:task-packet-template`
  - `npm run check:generated-modules` when generated-module ownership changed
- Frontend code, menus, i18n, routes, UI contracts:
  - `cd frontend`
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
- Backend Go code (from `backend/`):
  - `go test -race ./...`
  - On Windows enable CGO and prepend the approved MinGW toolchain before the full race gate.
- Platform shell or shared UI:
  - `cd frontend`
  - `npm run test:smoke:platform`
- System-domain pages or authz behavior:
  - `cd frontend`
  - `npm run test:smoke:system`
- Generator or dynamic-module behavior:
  - `cd frontend`
  - `npm run test:generator:smoke`
  - add the relevant `test:smoke:business:*` command when runtime behavior changed
- Security-sensitive dependency or secret work:
  - `go run golang.org/x/vuln/cmd/govulncheck@latest ./...`
  - `npm audit --registry=https://registry.npmjs.org --audit-level=high`
  - `cd frontend && npm audit --registry=https://registry.npmjs.org --audit-level=high`

## Hard Rules

- Do not claim completion from a narrow iterative check if the touched scope requires a wider matrix.
- If UI behavior changed, include rendered evidence or state the runtime gap explicitly.
- Record the exact commands you ran and whether they passed.
