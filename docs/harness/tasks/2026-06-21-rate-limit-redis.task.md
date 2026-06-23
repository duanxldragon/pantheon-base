---
title: Rate Limit Redis Migration Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-23
---

# Task Packet: 2026-06-21-rate-limit-redis

## Goal

Move request and login-source rate limiting from process-local memory into a Redis-backed store so multi-instance deployments enforce the same limit window consistently.

## Primary Layer

platform

## Dependency Layers

- `system/auth`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `security-runtime`
- Portable Failure Class: `runtime-evidence-gap`
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
- `docs/designs/SECURITY_POLICY_ROADMAP.md`
- `backend/internal/middleware/rate_limit_middleware.go`
- `backend/pkg/database/redis.go`

## Scope

### In

- introduce a `RateLimitStore` abstraction that can back counters with Redis for shared runtime enforcement
- keep a memory-backed fallback store for local development and tests
- let `backend/cmd/server/main.go` choose the store from Redis configuration without changing auth caller semantics

### Out

- redesigning auth throttling policy or source-key semantics
- changing frontend behavior, menu exposure, or route contracts
- introducing a new external dependency beyond the already-installed Redis client

## Assumptions and Open Questions

- Confirmed Facts: the old middleware used in-memory counters and the repository already carried a Redis dependency.
- Working Assumptions: caller APIs such as `ensureSourceThrottleAllowed` stay stable while the storage backend changes underneath.
- Open Questions: `none`

## Expected Files

### Create

- `backend/internal/middleware/rate_limit_store_redis.go`
- `backend/internal/middleware/rate_limit_store_memory.go`
- `docs/harness/tasks/2026-06-21-rate-limit-redis.task.md`
- `.harness/evidence/2026-06-21-rate-limit-redis/summary.md`
- `.harness/evidence/2026-06-21-rate-limit-redis/commands.json`
- `.harness/evidence/2026-06-21-rate-limit-redis/review.md`

### Modify

- `backend/internal/middleware/rate_limit_middleware.go`
- `backend/internal/middleware/rate_limit_middleware_test.go`
- `backend/cmd/server/main.go`
- `backend/modules/auth/auth_service.go`

### Do Not Touch

- `frontend/**`
- `../pantheon-ops/**`
- unrelated IAM, org, config, and generator modules

## Implementation Notes

- The Redis store should use `INCR` plus TTL initialization atomically enough that the first hit defines the window without racey double initialization.
- The memory store remains valid for local dev and tests; the production-value shift is that multi-instance runtime should no longer diverge by process.
- `ensureSourceThrottleAllowed` remains a consumer of the middleware/store contract rather than owning Redis logic directly.

## Minimum Viable Approach

- Selected Rung: `installed dependency`
- Why This Is Enough: `Redis was already part of the platform stack, so the migration only needed a new store adapter and server wiring`
- Upgrade Trigger: `if rate limiting later needs quota introspection, distributed burst control, or richer policy dimensions, promote the store contract instead of embedding new policy in one middleware file`

## Success Criteria

- Behaviour Outcome: `rate-limit counters are shared across instances when Redis is configured, while local memory fallback remains available for development and tests`
- Verification Signal: `go build ./backend/...`, `go test -race ./backend/internal/middleware/...`, and `go vet ./backend/...` pass
- Regression Watch: `auth callers keep using the same throttling API and local development still has a working fallback path`

## Context Strategy

- Entry Sources: `AGENTS.md`, `DESIGN.md`, `docs/README.md`, current task packet, `docs/designs/SECURITY_POLICY_ROADMAP.md`
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none`

## Method Readiness

- Consumer-Specific Controls: `middleware contract`, `Redis store adapter`, `rate-limit middleware tests`
- Required Sensors: `command`, `review`, `runtime evidence`
- Required Evidence: `command summary`, `runtime gap`, `review summary`
- Ratchet Decision: `sensor-added`
- Deferred Code Issues: `none`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`, `runtime`
- GitHub Governance Gate: `repo-quality-gate`

## Structural Scope

- Affected Subgraph: `request source -> rate-limit middleware -> RateLimitStore -> Redis or memory counter backend`
- Boundary Crossings: `platform -> Redis`, `platform -> system/auth`
- Risk Nodes: `store selection`, `counter TTL initialization`, `auth source-throttle callers`
- Graph Focus: `sensitive-input-flow | hub-check`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before changing rate-limit policy semantics beyond the storage backend migration
- stop before removing the local development fallback path

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `docs/harness/tasks/2026-06-21-rate-limit-redis.task.md`

## Verification Plan

- `go build ./backend/...`
- `go test -race ./backend/internal/middleware/...`
- `go vet ./backend/...`

## Linkage

- Task ID: `2026-06-21-rate-limit-redis`
- Task Manifest: `.harness/tasks/2026-06-21-rate-limit-redis/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-21-rate-limit-redis/`
- Review File: `none`

## Evidence Required

- targeted middleware build/test/vet command summaries
- explicit note about Redis-backed versus memory-fallback store selection
- review summary tied back to the same task boundary

## Human Gates

- none

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
