# Program status — 2026-10-19-tenant-permission-isolation-remediation

**Status**: completed (7 / 7 waves)
**Baseline**: 179 / 193 assertions (92.7%), 13 defects, 5 × P0
**Final**: 193 / 193 assertions, 12 defects closed, 1 × P2 downgraded (F14)

## Waves

| Wave | Task | Defects | Status | Blocked by |
|---|---|---|---|---|
| W0 | `2026-10-19-w0-isolation-contract-guardrails` | contract §2.3.1 + red cases | completed | — |
| W1 | `2026-10-19-w1-data-scope-tenant-dimension` | F7 F8 F9 F10 F11 F13 | completed | W0 |
| W2 | `2026-10-19-w2-tenant-user-onboarding` | F1 F4 | completed | W0 |
| W3 | `2026-10-19-w3-role-menu-grant-persistence` | F3 | completed | W0 |
| W4 | `2026-10-19-w4-session-revocation-login-gate` | F2 | completed | W0 |
| W5 | `2026-10-19-w5-tenant-console-ux` | F5 F6 | completed | W0 |
| W6 | `2026-10-19-w6-reverification-closeout` | all | completed | W1–W5 |

## Defect disposition

| ID | Severity | Wave | Disposition | Evidence |
|---|---|---|---|---|
| F1 | P0 | W2 | fixed | `.harness/evidence/2026-10-19-w2-tenant-user-onboarding/` |
| F2 | P1 | W4 | fixed | `.harness/evidence/2026-10-19-w4-session-revocation-login-gate/` |
| F3 | P0 | W3 | fixed | `.harness/evidence/2026-10-19-w3-role-menu-grant-persistence/` |
| F4 | P2 | W2 | fixed | W2 summary §3.3 + migration 000027 |
| F5 | P1 | W5 | fixed | `.harness/evidence/2026-10-19-w5-tenant-console-ux/` |
| F6 | P1 | W5 | fixed | W5 `network-after.json` |
| F7 | P0 | W1 | fixed | `.harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/` |
| F8 | P0 | W1 | fixed | W1 §3.1 |
| F9 | P1 | W1 | fixed | W1 §3.1 |
| F10 | P0 | W1 | fixed | W1 §3.2 |
| F11 | P1 | W1 | fixed | W1 §3.3 |
| F13 | P1 | W1 | fixed | W1 §3.4 |
| F14 | P2 | — | **downgraded** — cross-tenant role member endpoints answer 500 instead of 404/403; no data disclosed, outside the P0 set, fix path recorded | `.harness/evidence/2026-10-19-w6-reverification-closeout/disposition.md` |

F12 was reserved during the acceptance run and **does not exist**: cross-tenant Casbin policy creation is blocked by
`403 permission.escalation.forbidden`.

## Final measurement (W6)

| Suite | Baseline | Final |
|---|---|---|
| `tenant_acceptance.py` | 130 / 136 | 136 / 136 |
| `ui_walkthrough.cjs` | 22 / 23 | 23 / 23 |
| `cross_tenant_leak.py` | 27 / 34 | 34 / 34 |
| **Total** | **179 / 193** | **193 / 193** |

Environment afterwards: `schema_migrations=27`, `active_ghost_members=0`,
`tenant0_grants_on_tenant_roles=0`, probe policies 0, probe tenants 295/297 archived.
The two remaining active probe tenants (253 test-tenant, 281 e2e-repro) predate this program.

## Interim mitigation (no longer needed)

Revoking `system:permission:data-scope` from tenant roles was the pre-W1 mitigation. It is no longer required:
F7/F8/F9/F10/F11 are closed at the code level and the data-scope console is tenant-scoped.

## Residual risks

- F14 remains a P2 error-shape defect; isolation is intact.
- Platform scope still lists all tenants' roles (W1 known gap). W5 makes the viewpoint explicit but does not narrow
  the platform read. Requires a product decision.
- A role with no data-scope policy still fails closed with a 500. That is the safe default; assigning a default policy
  needs a product decision.
- The department table is now a flat paginated list; hierarchy is conveyed by ordering, not expand/collapse.
