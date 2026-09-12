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
