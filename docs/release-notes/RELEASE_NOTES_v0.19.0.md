# Pantheon Base v0.19.0

This compatible minor release adds two optional shared capabilities for business consumers.

- Auth-owned durable-job authorization evaluates the current owner, role, registered action,
  policy and data scope without retaining a session or cached grant; unsupported tenancy and
  uncertain reads deny opaquely.
- Business-owned setting declarations bootstrap private defaults without overwriting operator
  values. Request-scoped readers retain trusted tenant context, validate metadata and recheck
  authoritative tenant mode before and after the database read.
- Business route authorization preserves the static/parameter distinction delivered in main.
- Normalize Foundation release tags/titles and preserve historical release identities.
- Protect archive bytes during formatting, repair depguard module prefixes and consume the
  reviewed Harness method snapshot.
- Adopt Go 1.26.11 for the existing net/http security patch. Clear hosted static-analysis findings
  by consolidating Go parameter declarations, removing redundant optional TypeScript undefined
  types and constructing the unchanged IPv6 SSRF rejection ranges with typed addresses.

Release eligibility requires independent review, candidate-bound CI and Full Smoke, zero
unresolved gated Sonar findings, and all four verified immutable Foundation assets. Existing
S3-provider, maintenance-freeze, production and downstream product-acceptance gaps remain explicit.

# Upgrade notes

Use the official pantheon-base-v0.19.0 bundle and repo.tar with their published SHA-256
files through the existing Foundation fetch/rebuild process. Do not copy files from Base main.
Use Go 1.26.11 or newer supported tooling for backend builds and keep the locked Node/frontend
installation process. No new database migration or required business provider is introduced.

Durable jobs may opt into JobAuthorizationReader; they must still use the auth-owned live
reader at dispatch/execution and must not persist its grant. The capability is optional and
does not alter the session lifecycle or enable multi-tenant durable jobs.

Business modules may declare owned runtime defaults and request trusted request-scoped reads.
Existing defaults are preserved; incompatible metadata, missing tenancy, unknown keys,
cancellation and mode drift fail. Keep existing server settings/mode ownership.

Rollback by rebuilding from the previous official Foundation assets and rerunning the
consumer checks. Production data/provider acceptance requires its separate authorized plan.

# Consumer impact

The public auth and business-runtime-setting contracts are additive and optional.
Consumers that do not register or use the capabilities retain their existing behavior.
Shared backend source, build tooling, engineering checks and formatter policy arrive through
the official Foundation snapshot, including Go 1.26.11, depguard paths and .prettierignore.

Ops adoption is deliberately a separate fetch/rebuild/overlay/drift and runtime verification
step. This Base release does not claim an Ops lock change, tree replacement, business
acceptance, production migration, real S3-provider acceptance or maintenance-freeze sign-off.
Keep those existing gaps and owners until independent evidence closes them.

## Delivery evidence

[Release task](../harness/tasks/2026-11-25-foundation-0190-release.task.md) and
[candidate evidence](../../.harness/evidence/2026-11-25-foundation-0190-release/summary.md) record actual verification.
The immutable [GitHub Release](https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.19.0)
and its four assets establish publication; these preparation notes do not establish Ops adoption.
