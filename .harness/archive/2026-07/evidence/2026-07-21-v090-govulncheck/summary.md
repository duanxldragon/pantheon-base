# Evidence Summary — govulncheck working-directory fix (#190)

## Problem
`security.yml`'s govulncheck step ran from the repo root, but `go.mod` lives under
`backend/`. Every `main` push therefore exited govulncheck with `no go.mod file`,
leaving the **Security Gates permanently red** and never actually scanning any code.

## Fix
- Set `working-directory: backend` for the govulncheck step.
- Redirect the output to `../security-reports/govulncheck.json` (relative to backend/).

## Verification
- `cd backend && go run golang.org/x/vuln/cmd/govulncheck@v1.3.0 ./...` runs the
  scanner against the backend Go modules instead of erroring out.
- No source/business logic changed — pure CI configuration fix.

## Risk
Low. Single-file workflow change. No runtime/behavior impact on the application.
