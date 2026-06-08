---
name: repo-verify
description: Use when finishing a Pantheon Base change or deciding the minimum local verification matrix for the touched scope before commit or PR
---

# Repo Verify

Pick the smallest command set that still proves the touched scope.

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
- Backend Go code:
  - `go test -race ./...`
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
