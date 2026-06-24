---
title: Security Headers CSP HSTS Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-23
---

# Task Packet: 2026-06-21-security-headers-csp-hsts

## Goal

Expand the shared security-header middleware with a baseline CSP, HSTS, and permissions policy so browser responses from `pantheon-base` ship a stricter default HTTP posture.

## Primary Layer

platform

## Dependency Layers

- `system/auth`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `http-security`
- Portable Failure Class: `security-boundary-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `backend/internal/middleware/security_headers_middleware.go`
- `backend/internal/middleware/security_headers_middleware_test.go`

## Scope

### In

- add a baseline `Content-Security-Policy` with `frame-ancestors 'none'`
- add `Strict-Transport-Security` and `Permissions-Policy` alongside the existing response headers
- extend middleware tests so the header contract is explicit and regression-resistant

### Out

- redesigning per-route CSP allowlists or nonce-based script loading
- changing CORS policy, cookie behavior, or auth response payloads
- introducing reverse-proxy or CDN header rewrites in the same task

## Assumptions and Open Questions

- Confirmed Facts: `security_headers_middleware.go` was originally minimal and the historical work item was to establish a stronger default browser posture in one middleware boundary.
- Working Assumptions: the secure baseline remains centralized in shared middleware rather than duplicated by feature handlers.
- Open Questions: `none`

## Expected Files

### Create

- `docs/harness/tasks/2026-06-21-security-headers-csp-hsts.task.md`
- `.harness/evidence/2026-06-21-security-headers-csp-hsts/summary.md`
- `.harness/evidence/2026-06-21-security-headers-csp-hsts/commands.json`
- `.harness/evidence/2026-06-21-security-headers-csp-hsts/review.md`

### Modify

- `backend/internal/middleware/security_headers_middleware.go`
- `backend/internal/middleware/security_headers_middleware_test.go`

### Do Not Touch

- `frontend/**`
- `../pantheon-ops/**`
- unrelated business handlers or route modules

## Implementation Notes

- Keep the secure baseline conservative and broadly compatible with the existing admin UI shell.
- Header policy lives in one middleware so the contract stays testable and consistent across routes.
- Middleware tests should assert the presence of the headers and at least one policy-critical CSP/HSTS detail.

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: `the change is confined to one middleware file and its tests, with no new dependency or runtime subsystem required`
- Upgrade Trigger: `if specific routes later need external script or asset exceptions, split policy composition without weakening the default baseline`

## Success Criteria

- Behaviour Outcome: `browser responses include the stricter default CSP, HSTS, permissions policy, and the existing security headers through the shared middleware path`
- Verification Signal: `go build ./backend/...`, `go test -race ./backend/internal/middleware/...`, and `go vet ./backend/internal/middleware/...` pass
- Regression Watch: `existing routes remain reachable and the default security-header middleware contract stays centralized`

## Context Strategy

- Entry Sources: `AGENTS.md`, `DESIGN.md`, `docs/README.md`, current task packet, `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none`

## Method Readiness

- Consumer-Specific Controls: `security middleware contract`, `header regression tests`
- Required Sensors: `command`, `review`
- Required Evidence: `command summary`, `review summary`
- Ratchet Decision: `sensor-added`
- Deferred Code Issues: `route-specific CSP tuning remains a follow-up rather than part of this baseline-hardening slice`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Structural Scope

- Affected Subgraph: `incoming HTTP request -> security header middleware -> browser response headers`
- Boundary Crossings: `platform -> browser`
- Risk Nodes: `security header middleware`, `CSP baseline`, `HSTS deployment assumptions`
- Graph Focus: `sensitive-input-flow | hub-check`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `security | mechanical`

## Stop Points

- stop before broadening the task into route-specific CSP exception management
- stop before coupling security-header work to unrelated auth, CORS, or frontend refactors

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `docs/harness/tasks/2026-06-21-security-headers-csp-hsts.task.md`

## Verification Plan

- `go build ./backend/...`
- `go test -race ./backend/internal/middleware/...`
- `go vet ./backend/internal/middleware/...`

## Linkage

- Task ID: `2026-06-21-security-headers-csp-hsts`
- Task Manifest: `.harness/tasks/2026-06-21-security-headers-csp-hsts/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-21-security-headers-csp-hsts/`
- Review File: `none`

## Evidence Required

- targeted middleware build, test, and vet command summaries
- explicit note of the baseline CSP, HSTS, and permissions-policy contract
- review summary tied back to the same task boundary

## Human Gates

- production policy exceptions that require external origins or weaker browser posture

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
