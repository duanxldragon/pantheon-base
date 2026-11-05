# Pantheon Base v0.18.3 — Release Candidate Notes

Candidate patch for `release/0.18`, prepared on 2026-11-05. **Not published.** The last published foundation remains `pantheon-base-v0.18.2`; this candidate requires independent review, successful hosted checks, merge and the existing release gate before publication and consumer lock updates.

## Changes

- Bind outbound HTTP dialing to the DNS addresses verified by the SSRF helper, retaining request Host/TLS SNI, deadlines, address-family handling and redirect validation.
- Consume a refresh token atomically once. Session rotation updates only lifecycle fields and checks the previous refresh JTI, tenant, active status and expiry, so stale refresh/switch attempts cannot revive revoked sessions or overwrite concurrent tenant changes.
- Preserve failed dependency audit/installation exit codes in the security workflow. Existing strict versus report-only policy remains in force.
- Close system route-group, data-scope schema, multi-page candidate loading and generator formatting/build defects already implemented in the Nov 3/4 remediation; retain regression checks and update canonical documentation.
- Preserve all current tenant V1 capabilities: compat/multi, initialization, membership, authorized login/switch, system-domain isolation, tenant operations, plan configuration and quota measurement/display. Business-domain isolation and enforced quotas are outside the existing V1 contract.

## Upgrade notes

- The migration chain includes `000031_drop_permission_role_data_scope_policy`. Read [the production preflight/runbook](../runbooks/MIGRATION_000031_PRODUCTION_DROP.md), inspect existing data and take the required backup before production execution. No production migration was performed by this task.
- Refresh retries after consumption, concurrent rotation/revocation or storage failures may require signing in again. Failed refresh tokens are not restored.
- SSRF rejects private or mixed DNS answers under the existing protected policy. Verify Ops datasource/webhook connectivity and the documented allowlist/port policy; do not disable the protection to pass tests.
- A failed vulnerability scan now correctly fails strict workflows; fix the actual failure instead of changing thresholds.

## Consumer impact

`pantheon-ops` must consume the published checksummed artifact using its official upgrade/rebuild overlay path. Do not copy shared files from Base main or advance the live lock to this unpublished candidate.

The existing isolated Ops DB repair branch contains a business migration also numbered `000031`. Reconcile foundation-owned and business-owned migration sources in the reconstructed consumer before applying changes. The isolated repair branch's earlier passing tests do not establish that the upgraded migration chain is correct.

## Validation and publication state

Current-candidate commands, exact exit codes, runtime results and gaps are maintained in [the execution evidence](../../.harness/evidence/2026-11-05-base-freeze-release/summary.md) and [functionality matrix](../../.harness/evidence/2026-11-05-base-freeze-release/functionality-matrix.md).

PR [#489](https://github.com/duanxldragon/pantheon-base/pull/489) is a draft. Hosted tests/build/security/CodeQL/smoke passed on the original candidate; its structure, Sonar and draft notification failures prompted focused fixes and local revalidation. Hosted rechecks of those fixes remain pending. Independent review services still return HTTP 503; review approval, merge, release and official consumer upgrade remain incomplete.
