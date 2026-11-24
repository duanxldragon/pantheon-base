# 2026-11-14-ops-completion-contracts — verification summary

Status: implementation verified green; independent review and official publication remain open.

## What this task delivers

An optional, auth-owned durable-job authorization port that Ops FileDist (O1) and
durable log jobs can use at dispatch/execution time, without persisting a session or
copying system authorization into business code. No session, token, cached role or
creation-time data scope participates in the grant.

- `backend/pkg/contracts/businessauth/job_authorization.go` — public `JobInput` +
  `JobAuthorizationReader`; private JSON (no serialized grant).
- `backend/modules/auth/login/business_job_authorization.go` — `AuthorizeJob` on the
  existing auth-owned `businessAuthorizationReader`; opaque `ErrDenied` on every
  uncertain input and store read failure; hard compat/resource-tenant-0 contract.
- `backend/pkg/contracts/business_tenant_groups.go` — optional
  `RegisteredBusinessJobAuthorizationReader()` accessor; never falls back to the
  metadata-only lifecycle reader or a session grant.

## What was verified

- **Failed-before witness**: `red-capability.log` — capability absence returns
  `ErrBusinessProviders` (auth-owned reader without the capability).
- **Green**: `green-job-auth.log` — full package run against an isolated real MySQL:
  capability availability, fresh scope without session, current-owner revocation matrix
  (disabled/deleted/tenant-local owner, revoked role/key/policy), unregistered/ambiguous
  action rejection, unavailable-store and cancellation denials. All pass.
- **Contracts**: `go test ./pkg/contracts/businessauth ./pkg/contracts` `ok`.
- **Vet**: `go vet` on the three changed packages — clean.
- Coordinator source read of `AuthorizeJob` confirms deny-on-uncertain, fresh reads,
  nonnil fresh DataScope, and a second mode check closing the mode-transition window.

## Explicitly still open (not fabricated by this closeout)

- Independent review routed before official release.
- Official publication decision and downstream Ops consumption.
- A previously-recorded TSan allocation failure in a later session is an environment
  (Windows MSYS memory mapping) infra artifact, not a code red; the green run above is
  the authoritative evidence for the changed packages.
