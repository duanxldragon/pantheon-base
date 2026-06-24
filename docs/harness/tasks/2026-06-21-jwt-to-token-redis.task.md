---
title: JWT To Token Redis Migration Task Packet
doc_type: Acceptance
layer: system/auth
depends_on_layers:
  - platform
  - system/config
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-06-23
---

# Task Packet: 2026-06-21-jwt-to-token-redis

## Goal

Replace JWT-based browser auth with opaque token pairs backed by Redis while preserving the existing auth response, cookie, and middleware contract expected by the rest of `pantheon-base`.

## Primary Layer

system/auth

## Dependency Layers

- `platform`
- `system/config`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `auth-runtime`
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
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/designs/AUTH_MODULE_DESIGN.md`
- `backend/pkg/common/token.go`
- `backend/internal/middleware/token_middleware.go`

## Scope

### In

- use `crypto/rand`-generated opaque access and refresh tokens stored in Redis instead of JWT payloads
- keep cookie names, bearer parsing, and auth DTO field names backward compatible for callers
- rotate refresh tokens, keep Redis unavailable as a hard auth failure, and retain session-table history only for audit continuity

### Out

- changing frontend menu, route, or i18n behavior
- introducing a permissive fallback that bypasses auth when Redis is unavailable
- deleting historical `system_user_session` audit data

## Assumptions and Open Questions

- Confirmed Facts: by 2026-06-22 the JWT-specific files had already been removed and the repository had standardized on Redis-backed tokens.
- Working Assumptions: the historical task packet should capture the migration boundary and compatibility expectations rather than reopen the token design.
- Open Questions: `none`

## Expected Files

### Create

- `backend/pkg/common/token_test.go`
- `docs/harness/tasks/2026-06-21-jwt-to-token-redis.task.md`
- `.harness/evidence/2026-06-21-jwt-to-token-redis/summary.md`
- `.harness/evidence/2026-06-21-jwt-to-token-redis/commands.json`
- `.harness/evidence/2026-06-21-jwt-to-token-redis/review.md`

### Modify

- `backend/pkg/common/token.go`
- `backend/pkg/common/cookie.go`
- `backend/pkg/common/response.go`
- `backend/pkg/common/security_config.go`
- `backend/pkg/database/redis.go`
- `backend/internal/middleware/token_middleware.go`
- `backend/modules/auth/auth_service.go`
- `backend/modules/auth/auth_session_service.go`
- `backend/modules/auth/session_model.go`
- `backend/modules/auth/auth_dto.go`
- `backend/modules/auth/auth_handler.go`

### Do Not Touch

- `frontend/**`
- `../pantheon-ops/**`
- unrelated IAM, org, and config business flows

## Implementation Notes

- Keep the transport opaque: token contents are random identifiers and Redis becomes the source of session truth.
- Preserve the caller-facing contract by keeping cookie names, bearer parsing, and auth DTO field names stable even though the backend storage model changes.
- Redis unavailability remains a `503`-style hard failure rather than a silent auth bypass.

## Minimum Viable Approach

- Selected Rung: `installed dependency`
- Why This Is Enough: `Redis was already present in the repository dependency set, so the migration only needed new token storage and middleware logic rather than another auth technology`
- Upgrade Trigger: `if token lifecycle or cross-region session semantics outgrow simple Redis keys, revisit the storage model instead of reintroducing JWT complexity by default`

## Success Criteria

- Behaviour Outcome: `login, refresh, revoke, and middleware auth all run through Redis-backed opaque tokens without changing caller-facing cookie or bearer conventions`
- Verification Signal: `go test -race ./backend/pkg/common/...`, `go test -race ./backend/internal/middleware/...`, `go test -race ./backend/modules/auth/...`, `go build ./backend/cmd/server`, and `go vet ./backend/...` pass
- Regression Watch: `auth DTO field names, cookie names, bearer parsing, and injected auth context keys remain backward compatible`

## Context Strategy

- Entry Sources: `AGENTS.md`, `DESIGN.md`, `docs/README.md`, current task packet, `docs/designs/AUTH_MODULE_DESIGN.md`
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `keep live tokens out of shared durable artifacts`

## Method Readiness

- Consumer-Specific Controls: `auth runtime contract`, `Redis-backed token middleware`, `token lifecycle tests`
- Required Sensors: `command`, `review`, `runtime evidence`
- Required Evidence: `command summary`, `runtime gap`, `review summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `system_user_session remains retained for audit and deprecation follow-up rather than deletion in the same change`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`, `runtime`
- GitHub Governance Gate: `repo-quality-gate`

## Structural Scope

- Affected Subgraph: `login|refresh|revoke handlers -> auth service -> token store -> Redis session keys -> token middleware`
- Boundary Crossings: `system/auth -> pkg/*`, `platform -> Redis`
- Risk Nodes: `token pair generation`, `refresh rotation`, `Redis availability handling`, `middleware auth context injection`
- Graph Focus: `sensitive-input-flow | hub-check`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | security | mechanical`

## Stop Points

- stop before changing caller-facing cookie names, bearer parsing, or auth DTO field names
- stop before deleting the historical session audit table or introducing an auth bypass on Redis failure

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `docs/harness/tasks/2026-06-21-jwt-to-token-redis.task.md`

## Verification Plan

- `go test -race ./backend/pkg/common/...`
- `go test -race ./backend/internal/middleware/...`
- `go test -race ./backend/modules/auth/...`
- `go build ./backend/cmd/server`
- `go vet ./backend/...`

## Linkage

- Task ID: `2026-06-21-jwt-to-token-redis`
- Task Manifest: `.harness/tasks/2026-06-21-jwt-to-token-redis/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-21-jwt-to-token-redis/`
- Review File: `none`

## Evidence Required

- targeted token-store, middleware, and auth command summaries
- explicit note that JWT-specific files were retired as part of the migration boundary
- review summary tied back to the same task boundary

## Human Gates

- deleting historical session audit data or weakening Redis-auth failure handling

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
