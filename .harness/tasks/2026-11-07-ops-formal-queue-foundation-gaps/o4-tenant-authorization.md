# O4 business tenant contract change authorization

Date:2026-11-09. The maintainer was informed that O4's original user/tenant history/saved-view criterion conflicts with Base V1.10 §2.6's single-tenant business boundary. Their explicit reply selected:

> 扩展 Base 业务租户合同，同批实现并验收租户隔离

This supersedes the single-tenant-only restriction for the authorized O4 adoption. It does not waive validation, authorize production migration, claim all business modules are isolated, or approve release/baseline replacement. Preserve unrelated business behavior through an explicit opt-in contract and a deprecation period.

All four Base prerequisites remain required: same-batch source/contract and official consumer transition; per-table scope/migration/index registration; real generator tenant domain/predicate/bootstrap support; contract version/changelog/deprecation. History/view isolation must include datasource ownership and read/write/query/restore/revoke authorization, actor identity, response/audit/storage secrecy and runtime proofs on115.190.251.143.

Plan owner: architect adapter, `o4-tenant-implementation-plan.md`. Independent critic review precedes disjoint Base/Ops Generator execution. Planner owns coordination/evidence; no Ops shared-source copy. Parent tasks remain in-progress until original acceptance is fulfilled.
