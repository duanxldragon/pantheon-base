# Defect disposition — tenant permission isolation program

Baseline: 2026-10-19, 193 assertions (136 acceptance + 23 UI + 34 cross-tenant), 179 passed, 13 defects (5 × P0).
Final: 2026-10-19, same 193 assertions, **all green**, 1 residual P2 (F14) explicitly downgraded.

| ID | Severity | Wave | Disposition | Evidence |
|---|---|---|---|---|
| F1 | P0 | W2 | **closed** — tenant-created user logs in on the first attempt; membership written in the create transaction | `.harness/evidence/2026-10-19-w2-tenant-user-onboarding/`; `login-after-create.log` line `immediately loginable code=200` |
| F2 | P1 | W4 | **closed** — login clears the user-level blacklist only after successful issuance; old sessions stay revoked by session-level keys | `.harness/evidence/2026-10-19-w4-session-revocation-login-gate/`; `redis-keys.txt` |
| F3 | P0 | W3 | **closed** — role menu grants are written under the role's tenant and survive a second edit | `.harness/evidence/2026-10-19-w3-role-menu-grant-persistence/`; `menu-roundtrip.log` |
| F4 | P2 | W2 | **closed** — delete deactivates the membership; migration 000027 repairs historical ghosts; member list shows none | `.harness/evidence/2026-10-19-w2-tenant-user-onboarding/summary.md` §3.3 |
| F5 | P1 | W5 | **closed** — tenant admin no longer calls `/system/tenant/list`; zero `tenant.platformOnly` toasts | `.harness/evidence/2026-10-19-w5-tenant-console-ux/network-after.json` |
| F6 | P1 | W5 | **closed** — department table binds flat rows; total 5 and children visible | same `network-after.json` (`deptTotal=5`, `deptChildVisible=true`) |
| F7 | P0 | W1 | **closed** — data-scope console lists only the caller's roles | `.harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/summary.md` §3.1 |
| F8 | P0 | W1 | **closed** — a foreign role key is rejected | W1 §3.1 |
| F9 | P1 | W1 | **closed** — writes use the caller's tenant; no new `tenant_id = 0` policy rows | W1 §3.1 |
| F10 | P0 | W1 | **closed** — A's policy change no longer widens B's visible rows | W1 §3.2 |
| F11 | P1 | W1 | **closed** — custom dept IDs must belong to the caller's tenant | W1 §3.3 |
| F13 | P1 | W1 | **closed** — role list echoes the tenant's own policy only | W1 §3.4 |
| F14 | P2 | W6+ (post-closeout follow-up) | **closed** — `roleErrorResponse` in the role handler maps `gorm.ErrRecordNotFound` / `common.ErrNotFound` to `404 role.not_found` (i18n key added to all 5 locales) and keeps everything else on the generic 500 path; applied to all 8 role endpoints that branch on a service error. Regression: `TestRoleErrorResponseMapsRecordNotFoundTo404` / `...KeepsGeneric500ForOtherErrors`. Live: cross-tenant member reads now answer `code=404 msg=role.not_found`; full L0–L4 re-run **34/34, 0 findings**. | `role_handler_notfound_test.go`; post-fix `cross_tenant_leak.log` (this directory) |

F12 was reserved in the baseline and **does not exist**: cross-tenant Casbin policy creation is already blocked by
`403 permission.escalation.forbidden`. It is kept out of the table rather than marked closed.

## Aggregate

| Suite | Baseline | Final |
|---|---|---|
| `tenant_acceptance.py` (A0–A13) | 130 / 136 | **136 / 136** |
| `ui_walkthrough.cjs` (14 console pages) | 22 / 23 | **23 / 23** |
| `cross_tenant_leak.py` (L0–L4) | 27 / 34 | **34 / 34** |
| **Total** | **179 / 193** | **193 / 193** |

~~The one remaining finding is F14~~ — closed by the post-closeout follow-up: after the handler mapping landed,
the cross-tenant suite was re-run end to end and reports **34/34 with 0 findings** (previously 34/34 with the F14
residual). No P0, P1 or P2 remains open; no defect is downgraded.
