# Release Notes

## pantheon-base-v0.17.0

Minor release on top of v0.16.1. It carries the tenant isolation remediation that was held back
from the v0.16.1 cut, the follow-up permission and seeding fixes, the dependency bumps and the
release-pipeline repairs.

### Security

- **A tenant could write a global permission policy.** The permission console now takes its tenant
  from the request context on every surface: a tenant-scoped write always stores
  `role:<key>@tenant:<id>`, a body `tenantId` naming another tenant is rejected with
  `TENANT_FORBIDDEN`, and `tenantId=0` no longer produces a global policy. List, export, update and
  delete only touch the caller's domain. Policy import and workbench remediation resolve the stored
  subject from the context instead of writing the bare role key.
- **A tenant could create `admin` or `platform_ops` and inherit platform grants at login.** Role
  create/rename/import reject keys owned by tenant 0 and the reserved `platform_ops` key. CSV import
  stamps the caller's tenant instead of `tenant_id = 0`, and import validation plus the bootstrap
  admin binding are scoped to the target namespace.
- **Role lifecycle did not understand the tenant-domain subject.** Delete removes exactly the
  role's own subject, rename moves the policies in the same transaction, and the bootstrap orphan
  cleanup recognises `role:<key>@tenant:<id>` instead of deleting every tenant policy on each boot.
- **Remediation history was shared across tenants.** `permission_workbench_remediation_event` gains
  `tenant_id` (migration `000028`).

### Fixed

- `platform.tenant_mode` is seeded public and `Bootstrap` raises `is_public` on an existing row
  (never lowers it), so upgraded deployments render the tenant picker, switcher and viewpoint
  switcher again — the cause of the red `Tenant Smoke` job on every main commit.
- The auth module seeds its own permission keys, not only its menus, so a fresh tenant gets a
  working login surface without a global grant.
- Tenant menu seeds were completed and every open SonarCloud finding on `main` was closed.

### Changed

- Migrations `000025`–`000027` backfill tenant-scoped role data-scope and role-menu rows before the
  permission console is exposed. All migrations are additive.
- Backend package naming follows the v0.16.0 correspondence model (`system/iam/menu` is
  `package menu`).

### Dependencies

- 18 frontend npm packages, 2 root dev dependencies, 4 GitHub Actions (still SHA-pinned).

### Release tooling

- The cut workflow validates inputs after the checkout, builds the bundle from the requested
  `base_commit`, creates the tag through the API and verifies it with `git ls-remote`.
- The v0.16.1 closeout record was repaired to match what was actually published.

### Verification

- Required checks green on the release commit: `CI Summary`, `Quality Gates`, `Security Gates`,
  `Actionlint`, `Full Smoke`, `SonarCloud Code Analysis`, and `Release Gate Summary`.
- Backend `go test ./...` against real MySQL in CI; the new cases are two-tenant and role-lifecycle
  tests rather than mocks.
- Frontend `tsc -b` clean.
- Four consumable assets published and verified by `Foundation Release Verify` on
  `release: published`.

### Known limits

- Existing tenant role keys that shadow the platform namespace are not renamed automatically;
  operators must run the documented cleanup.
- The browser-level `Tenant Smoke` assertion is confirmed by CI; the underlying seed defect is
  covered by unit tests.
