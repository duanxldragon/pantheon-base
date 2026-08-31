# Program Status

- Status: `implementation-complete-awaiting-human-visual-gate`
- Updated: `2026-08-31`
- Owner: unassigned
- Design readiness: complete
- Implementation: B1-B5 complete in Base; no foundation release published
- Runtime evidence: not applicable: B1-B4 add client-only shared contracts and no business provider, API, permission model, or dashboard query
- Visual evidence: B5 login baseline evidence remains valid. B1-B4 have deterministic Playwright fixture coverage at desktop light, mobile light and desktop dark; final human visual gate for first consuming pages remains open.

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

Maintainer performs the final visual/function acceptance, then publishes an immutable Base foundation release before any Ops consumer adoption.

## Blockers

- Historical Dashboard and system-user-list desktop-light baseline drift needs a maintainer decision; see `.harness/evidence/2026-08-31-base-operational-workbench-design/debt-audit.md`.
- B1-B4 browser screenshots cover a development-only fixture route. Maintainer acceptance remains required before a consuming page is promoted through a foundation release.
