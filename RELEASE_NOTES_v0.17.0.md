# Pantheon Base v0.17.0 — Release Notes

**Release date**: 2026-10-21
**Tag**: `pantheon-base-v0.17.0`
**Previous release**: `pantheon-base-v0.16.1`

## Summary

v0.17.0 is the first minor release after the artifact channel was repaired in v0.16.1. It carries
the tenant isolation remediation that was deliberately held back from the v0.16.1 cut, the
follow-up permission and seeding fixes, the dependency bumps, and the release-pipeline repairs.

Three P0/P1 security defects are closed: a tenant could write a **global** permission policy, a
tenant could create a role key that shadows the platform namespace (`admin`, `platform_ops`) and
inherit platform grants at login, and `platform.tenant_mode` was never made public so the tenant
controls never rendered and `Tenant Smoke` was red on every `main` commit. Each is fixed at the
namespace layer, not by hiding the surface.

No consumer-facing interface is removed. The only data change is additive: migrations `000025`
through `000028` backfill tenant-scoped rows and add `tenant_id` to the remediation event table.

## Security

### The permission console is bound to the request tenant (#393, #386)

Every policy endpoint now resolves the tenant from the request context. A tenant-scoped write always
stores `role:<key>@tenant:<id>`, a body `tenantId` naming another tenant is rejected with
`TENANT_FORBIDDEN`, and `tenantId=0` no longer produces a global policy. List, export, update and
delete only touch the caller's domain (contract §2.3.1). Policy import and workbench remediation
resolve the stored subject from the context instead of writing the bare role key.

### Tenant role keys cannot shadow the platform namespace (#393)

Role create/rename/import reject keys already owned by tenant 0 and the reserved `platform_ops`
key. CSV import stamps the caller's tenant; it used to write `tenant_id = 0`, which is a platform
role. Import role-key validation and the bootstrap admin binding are scoped to the target namespace.

### Role lifecycle understands the tenant-domain subject form (#393)

Delete removes exactly the role's own subject, rename moves the policies in the same transaction,
and the bootstrap orphan cleanup recognises `role:<key>@tenant:<id>` instead of deleting every
tenant policy on each boot.

### The remediation history is per tenant (#393)

`permission_workbench_remediation_event` gains `tenant_id` (migration `000028`), so remediation
history is no longer shared between tenants that own the same role key.

## Fixed

### `platform.tenant_mode` is published on upgraded deployments (#393)

The seed marks it public and `Bootstrap` raises `is_public` on an existing row, never lowers it.
Upgraded deployments now render the tenant picker, switcher and viewpoint switcher again — the
cause of the red `Tenant Smoke` job on every `main` commit.

### The auth module seeds its own permission keys (#392)

Seeding covered the auth module's menus but not its permission keys, so a fresh tenant had a login
surface whose actions could not be authorised without a global grant.

### Tenant menu seeds and SonarCloud findings (#391)

Tenant menu seeds were completed and every open SonarCloud finding on `main` was closed, including
the security-surface documentation the quality gate requires.

## Changed

- Data-scope and role-menu migrations now backfill tenant-scoped rows before the permission console
  is exposed (`000025`–`000027`).
- `backend` package naming was aligned with the v0.16.0 correspondence model, so
  `backend/modules/system/iam/menu` is `package menu`.

## Dependencies

- 18 frontend npm packages, 2 root dev dependencies, 4 GitHub Actions (still SHA-pinned).

## Release tooling

- The cut workflow validates inputs after the checkout, builds the bundle from the requested
  `base_commit`, creates the tag through the API and verifies it with `git ls-remote`.
- The v0.16.1 closeout record was repaired to match what was actually published.

## Verification

- Required checks green on the release commit: `CI Summary`, `Quality Gates`, `Security Gates`,
  `Actionlint`, `Full Smoke`, `SonarCloud Code Analysis`, and `Release Gate Summary`.
- Backend `go test ./...` against real MySQL in CI; the new tenant cases are two-tenant and
  role-lifecycle tests, not mocks.
- Frontend `tsc -b` clean.
- The four consumable assets are published with the release and verified by
  `Foundation Release Verify` on `release: published`.

## Consumer impact (`pantheon-ops`)

Low. `sharedPaths` is unchanged at 52 entries (backend 4, frontend 46, docs 2), so the consumer lock
moves only version, commit and checksums. The migrations are additive and the business overlay's six
assembly anchors are unaffected. See `upgrade-notes.md` and `consumer-impact.md` in the release
evidence directory.

## Known limits

- Tenant role keys that already shadow the platform namespace are **not** renamed automatically.
  Operators must run the documented cleanup before upgrading an existing deployment.
- The browser-level `Tenant Smoke` assertion is confirmed by CI, not by a local run; the underlying
  seeding defect is covered by unit tests.
