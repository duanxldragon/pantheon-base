# Program Status

- Status: `accepted-awaiting-foundation-release`
- Updated: `2026-09-15`
- Owner: maintainer (acceptance granted 2026-09-15 in agent session)
- Design readiness: complete
- Implementation: B1-B5 complete in Base; no foundation release published
- Runtime evidence: not applicable: B1-B4 add client-only shared contracts and no business provider, API, permission model, or dashboard query
- Visual evidence: full 8-test Playwright suite passes with deterministic Dashboard/user-list API fixtures and B1-B4 fixture coverage at desktop light, mobile light and desktop dark; final human visual/function acceptance for the first consuming pages remains open.

## Child Status

| Packet | Priority | Status | Depends On | Outcome |
| --- | --- | --- | --- | --- |
| B1 | P0 | implemented | none | opt-in sticky long-form action contract |
| B2 | P1 | implemented | B1 preference conventions | opt-in local table work views and persistence |
| B3 | P1 | implemented | none | five generic operational primitives with bounded rendering |
| B4 | P1-P2 | implemented | B3 registry contracts | validated dashboard slots, permission filtering and budgets |
| B5 | P0-P1 | implemented | none | visual regression and UX copy gate |

## Decisions

- Shared components and contracts belong to Base.
- Ops owns only business data adapters, state machines and compositions.
- BK Design is reference evidence, not a dependency or visual theme.
- Advanced shared behavior is opt-in: `SubmitBar` is unchanged unless `sticky` is set and `AppTable` persists only with `viewKey`.
- B4 validates registration and visibility before a consumer can request or render an operational widget; Base does not register business widgets.
- BK-derived UI principles now have a Base-owned machine-readable policy and strict CI integrity gate.

## Next Atomic Action

Ops-side baseline swap: apply `pantheon-base-v0.12.1` bundle shared paths to the ops source tree and run business validation (deferred with explicit gap — ops tree carries unrelated in-flight work; see consumer lock `pendingWork`).

## Remaining Gates

- ~~Publish an immutable Base foundation release~~ — **DONE 2026-09-16**: `pantheon-base-v0.12.1` published (tag → 884465c0, Release Gate Summary success after PR #310 cleared the last SonarCloud issue).
- ~~Update the Ops consumer lock~~ — **DONE 2026-09-16**: `pantheon-ops/.foundation/foundation-release.lock.json` created (supersedes v0.11.0); baseline swap deferred with explicit gap (dirty ops tree from parallel session).
- Ops baseline swap + business validation — remaining (agent-executable once the ops tree is clean).

## Gate History

| Timestamp | Gate | Decision | Owner |
|---|---|---|---|
| 2026-09-15 | Final visual/function acceptance (B1-B5) | Granted — implementation accepted | Maintainer (via agent session) |
| 2026-09-16 | Immutable foundation release publish | Executed — `pantheon-base-v0.12.1` (Path A approved by maintainer) | Agent session |
| 2026-09-16 | Ops consumer lock | Established — baseline swap recorded as explicit gap | Agent session |
