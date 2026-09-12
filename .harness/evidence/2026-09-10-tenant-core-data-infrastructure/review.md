# Review: 2026-09-10-tenant-core-data-infrastructure — audit + upload slices

Reviewer posture: data-leakage reviewer; adversarially challenged stamping trust, filter widening, export reach and key collisions.

## Adversarial attempts & outcomes

| Attempt | Vector | Outcome |
|---------|--------|---------|
| Forge audit ownership via header | request sends `X-Tenant-Id: 202` while the resolved context is tenant 101 | row stamps 101 — the stamp reads only the resolved context, never request fields (dedicated test) ✅ |
| Read another tenant's audit trail | tenant-101 subject calls `GET /operation-log/:id` for a 202 row | record-not-found — scoped query, no existence leak (test 2) ✅ |
| Read via list instead of detail | tenant-101 subject lists operation logs | exactly the tenant's own rows; aggregate (success bar) honors the same scope (test 1) ✅ |
| Smuggle a cross-tenant filter | `tenantIdFilter=202` on a tenant-101 request | rejected with `tenant.forbidden` at the handler; even if it reached the service, the hard scope composes (AND) so it can only narrow (test 6) ✅ |
| Export another tenant's rows | tenant-101 export | CSV contains zero 202 rows (test 4); `tenantId` column makes provenance explicit |
| Delete another tenant's audit rows | single + batch delete of foreign ids | no-op — scoped delete skips foreign rows silently without leaking existence (test 3) ✅ |
| Cross-tenant object-key collision / escape | upload with `scope=../../202` under tenant 101 | key stays under `t101/` namespace; tenant prefix derives from the resolved context, not the query (test) ✅ |
| Write into another tenant's namespace via spoofed scope | any crafted `scope` value under a tenant context | tenant segment is prepended from the context and normalizeScope sanitizes the rest; `..` segments are rejected by NormalizeObjectKey ✅ |
| Compat regression | flag off, full audit + middleware + dict suites | rows stamp 0, queries unfiltered, upload layout unchanged — byte-identical behavior (tests 5, compat stamp tests) ✅ |
| Existence leak through cleanup | tenant subject probes cleanup results | cleanup remains a platform capability; tenant subjects cannot scope it (unchanged surface, permission-gated) ✅ |

## Findings

1. **Trust chain intact**: stamping and scoping both derive exclusively from the `TenantContextMiddleware`-resolved context; the subject claim itself is server-stamped at issuance (queue-4), so the whole chain from membership → claim → context → audit row is trusted.
2. **Fail-safe defaults**: nil context ⇒ platform population (stamp 0, unfiltered read) which preserves compat; multi mode never mixes populations.
3. **Additive schema only**: one column, indexed, default 0, AutoMigrate; rollback = drop column. Object-key layout change only affects NEW keys in multi mode; existing keys untouched.
4. **Export column append-only**: `tenantId` added as the last CSV column so downstream consumers' column indexes are stable.
5. **Diff discipline**: middleware (1 file), audit module (4 files), setting handler (1 file), 3 test files + mechanical test updates. No auth/IAM contract changes, no `pantheon-ops` files.
6. **Stop-point check**: no export/aggregation/cache/file/async path lost its provable tenant boundary in this slice's scope; no auth/IAM contract modification needed.

## Verdict

**Approved — audit and upload slices meet the packet's per-slice bar (migration additive, isolation tests, compat regression). Proceed to the remaining slices (settings/dict override+uniqueness for system_setting, security-event/login-log columns, async context persistence, download authorization, generator guardrails) before the verification task.**

---

# Review addendum: settings slice (2026-09-12)

Reviewer posture: data-leakage reviewer; adversarially challenged override resolution, global-row mutation, cache collisions and uniqueness edges.

## Adversarial attempts & outcomes

| Attempt | Vector | Outcome |
|---------|--------|---------|
| Read another tenant's override | tenant-101 `GetByKey` on a key overridden only by tenant 202 | falls back to the global value — foreign override rows are outside the read scope (dedicated test) ✅ |
| Mutate the platform-global row from a tenant session | tenant-101 `PUT /setting/group/:key` on a key that only has a global row | creates a tenant-owned copy; global row verified byte-identical after the write (test) ✅ |
| Duplicate a key within one tenant | second insert `(101, dup.key)` | rejected by composite `uk_system_setting_tenant_key` (test) ✅ |
| Cache poisoning across tenants | tenant-101 and tenant-202 list the same group through the shared service | cache keys namespaced `t<id>:...`; no collision (canary pattern + shared `settingCacheState`) ✅ |
| Seed duplication per tenant | re-bootstrap with override rows present | seeds pinned to `tenant_id = 0` lookups — never create per-tenant copies ✅ |
| Compat regression | unbound service with override rows in the table | `GetByKey`/`List`/`GetOverview` resolve global rows only (explicit `tenant_id = 0` filter); existing suites green ✅ |
| Write-ownership forgery | tenant write attempting to stamp a foreign tenant_id | ownership derives from the resolved context only; request body carries no tenant field (contract §3.3) ✅ |
| vet lock-copy regression | `WithTenantContext` shallow-copying the service struct | fixed by extracting `settingCacheState` (shared pointer, single lock); vet clean ✅ |

## Findings (settings slice)

1. **Override precedence is deterministic**: `ORDER BY tenant_id asc` with last-match-wins makes global the floor and the tenant row the ceiling; no ambiguity even with both rows present.
2. **Global rows are immutable from tenant sessions** — the write path only ever creates/updates tenant-owned rows; platform writes stay the single mutation path for global rows.
3. **Migration is guarded and reversible**: 000014 swaps the unique keys information_schema-guarded; down restores the legacy layout. Compatible with the runbook's additive pattern.
4. **Cache state refactor**: the lock-copy finding was resolved by sharing one `settingCacheState` pointer across bound views — invalidation from any view reaches all views.
5. **Stop-point check**: no cross-tenant read/write, no cache collision, compat green. No stop condition triggered.

## Verdict (settings slice)

**Approved — system_setting tenant override + uniqueness closes the last `system/config` scope item of the packet. Remaining for the task: security-event/login-log tenant columns, dashboard aggregates/async context persistence, download authorization, generator guardrails.**
