---
title: Sonar Blocker Path Traversal Remediation
doc_type: Acceptance
layer: system/config
depends_on_layers:
  - system/config
  - system/dynamicmodule
status: Active
linked_contracts:
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-06-09
---

# Task Packet: 2026-06-09-sonar-blocker-path-traversal

## Goal

Fix the 2 BLOCKER security findings (gosecurity:S2083 — path traversal from user-controlled data)
reported by SonarCloud on main after coverage exclusion repair.

## Primary Layer

system/config + system/dynamicmodule

## Harness Profile

- Quality Profile: `auth-security`
- Portable Failure Class: `security-boundary-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions: `behaviour`

## Scope

### In

1. `backend/modules/system/config/setting/setting_handler.go` line ~200-209
   - `ServeUploadedFile`: user-controlled `c.Param("filepath")` flows through
     `uploadpkg.NormalizeObjectKey()` into `http.ServeFileFS()`.
   - Add a final `filepath.IsLocal()` guard right before the filesystem call.

2. `backend/modules/system/dynamicmodule/dynamic_module_registry.go` line ~88-96
   - `loadGeneratedModuleSchema`: user-controlled `scope` + `name` (split from
     `module.Name` which is DB-stored but originates from user registration input)
     flows through `generatedModuleRelativePath` + `resolveGeneratedWorkspacePath`
     into `os.ReadFile()`.
   - `generatedModuleRelativePath` already does most of the right things (trim, IsLocal,
     block `..`), but Sonar can't trace the validation across function boundaries.
   - Add an inline `filepath.IsLocal()` check right before the `os.ReadFile()` call
     as defense-in-depth — it's cheap and makes the security boundary visible to
     both human reviewers and static analysis.

### Out

- Not changing `generatedModuleRelativePath` behavior (already correct)
- Not changing `uploadpkg.NormalizeObjectKey` behavior
- Not modifying harness scripts (vendored from `harness-engineering`)

### Do Not Touch

- `scripts/harness/**` — upstream vendored code
- `pkg/upload/` — NormalizeObjectKey is already correct

## Verification Plan

```powershell
cd pantheon-base
go build ./...
go test ./backend/modules/system/dynamicmodule/... -count=1
go test ./backend/modules/system/config/... -count=1
go vet ./backend/modules/system/dynamicmodule/...
go vet ./backend/modules/system/config/...
```

## Evidence Required

- Build passes (`go build ./...`)
- Tests pass for affected packages
- Confirmation that `filepath.IsLocal()` guards are added
- Re-run Sonar to confirm BLOCKER findings resolved

## Implementation Notes

- The security boundary is: user input → validation → filesystem. The fix adds
  a visible, inline `filepath.IsLocal()` check *immediately before* the filesystem
  call so that static analysis can confirm the boundary.
- `dynamic_module_registry.go` already validates in `generatedModuleRelativePath`,
  but the check is separated from `os.ReadFile` by 40+ lines. An inline guard
  before `os.ReadFile(target)` on ~line 97 makes the intent explicit.

## Stop Points

- Stop if a change would break existing module registration or file serving behavior
- Stop if `go test` regression appears in any affected package
