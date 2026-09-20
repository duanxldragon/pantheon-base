# Summary — 2026-09-20-permission-workbench-route-binding

## Scope
Audit finding D (`PANTHEON_BASE_DESIGN_SUPPLEMENT_AUDIT_20260910.md` §7.2, 1.0-freeze
blocking): close out the hand-maintained permission→API-route binding table in the
permission workbench remediation flow.

## What the verification actually found
Beyond the audit's "only 12 entries vs ~200 routes" coverage concern, a real drift
had already shipped: `system:user:create` was bound to `POST /api/v1/system/user/create`
while the live registration is `POST /api/v1/system/user`. The 受控补齐 remediation
creates Casbin policies from this table, so a remediated role would receive a policy
for a route that does not exist and user creation would remain forbidden.

## Change
- Fix the stale binding (`POST /api/v1/system/user/create` → `POST /api/v1/system/user`).
- Document the governance contract on the table: every entry must match a registered
  route; remediation must never create policies pointing at nonexistent routes.
- Add `RequiredAPIRoutesByPermission()` read-only accessor.
- Add `TestRequiredAPIRoutesExistOnEngine` — builds the real route table for the bound
  surfaces (system/user, auth/security-event, lowcode/dynamic-modules,
  lowcode/generator) and fails on any stale entry; plus
  `TestRequiredAPIRouteProbeCoversEngineRoutes` sentinel test so the probe cannot
  silently decay into a false pass.
- Align the two test fixtures and pure-test assertions with the corrected route path.

## Verification (all green)
- Drift guard + pure tests: ok (no DSN, 0.038s).
- Full permission package DB-backed: ok 7.9s; no-DSN skip path: ok 0.034s.
- Adjacent-domain regression (iam menu/role/user, audit, contracts, middleware, -short,
  DB-backed): all ok.
- `go vet` / `gofmt` clean.

## Known gaps
- Full route-table derivation (engine→service export across all module registrations)
  is future work; the drift guard is the interim enforcement and the future
  acceptance check for that derivation.
- Dead policies already issued against removed routes are not cleaned by path
  existence (Bootstrap cleans by role existence only) — ratchet candidate.
