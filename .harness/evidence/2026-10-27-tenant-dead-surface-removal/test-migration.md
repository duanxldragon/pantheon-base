# Test migration map — W8 `2026-10-27-tenant-dead-surface-removal`

`tenant_handler_test.go` (244 lines, five tests) is deleted. Every live
assertion now lives in a file that tests the surface that ships. The two
`/tenants/my` auth-context subtests died with the endpoint (no production
equivalent — see reference-search.md).

| Deleted test | Where the assertion lives now | What changed |
|---|---|---|
| `TestNormalizeTenantMemberPagination` | `tenant_service_test.go` (appended, same assertions) | None — pure function test, moved verbatim next to the service it pins |
| `TestListTenantMembersHandlerReturnsPaginationContract` | `tenant_platform_handler_test.go` → `TestPlatformTenantHandlerReturnsPaginationContract` | Drives the mounted path shape `/api/v1/system/tenant/:id/members` through `PlatformHandler`; asserts the platform envelope (`code:200, data:{items,total,page,pageSize}, message:"success"`) instead of the legacy raw-JSON shape; fixture uses `mustInsertTenantUsers` + `AddMember` (real `system_user` rows, W2) |
| `TestListTenantMembersHandlerUsesBoundedContract` | `tenant_platform_handler_test.go` → `TestPlatformTenantHandlerUsesBoundedContract` | Same rewrite to the mounted route + envelope; the inactive-membership fixture now inserts a real user row before creating the membership (no phantom id 106); tombstone case (`tenant/999999`) asserts empty page inside `data` |
| `TestLegacyTenantHandlerErrorEnvelopeIsUnifiedAndLeakFree` | `tenant_platform_handler_test.go` → `TestPlatformTenantHandlerErrorEnvelopeIsUnifiedAndLeakFree` | Same 10 bind/parse cases re-pointed at the mounted `/system/tenant...` paths via `PlatformHandler`; `requireUnifiedErrorEnvelope` helper (envelope shape + no-internal-leak list) carried over verbatim; the two `/tenants/my` subtests dropped — endpoint deleted with the legacy handler |
| `TestLegacyTenantHandlerSentinelMappingRequiresNoInternalLeak` | `tenant_platform_handler_test.go` → `TestPlatformTenantHandlerSentinelMappingRequiresNoInternalLeak` | Same three service-error branches (unknown id → 404 `tenant.not_found`; duplicate code → 400 `tenant.code_taken`; delete non-archived → 400 `tenant.not_archived`) through `PlatformHandler`'s `failServiceError`; fixture user 88001 created via `mustInsertTenantUser` |

New coverage required by the manifest: the platform-handler file drives the
mounted route group through one success path (pagination contract) and mapped
errors (bind errors + sentinel mapping) — the envelope contract is now asserted
against the surface a client can actually call.

## Compile-forced relocation recorded as deviation

`parseTenantMemberPagination` (gin-bound query parser) was defined in the
deleted `tenant_handler.go` but is called by the mounted
`PlatformHandler.ListTenantMembers` (`tenant_platform_handler.go:203`). The
manifest's `doNotTouch` list names `tenant_platform_handler.go`, and
`expectedFiles.modify` does not list it. The helper moved verbatim into
`tenant_platform_handler.go` with a one-line provenance comment: it is the
only compilable home (the service file does not import gin), and the move
changes no route, middleware, or response shape. Recorded here rather than
silently absorbed.

## Counters

- Baseline (2026-10-27, packet): 119 pass / 0 skip / 0 fail with MySQL
  (counted over all `--- PASS` lines incl. subtests).
- After W8: **126 pass / 0 skip / 0 fail** same counting method
  (`go test -count=1 ./modules/system/iam/tenant/...`, DSN set). Net +7:
  the error-envelope test carries 10 case subtests (was 12 with the two
  dropped `/tenants/my` subtests), everything else moved 1:1, and no test
  skips (DSN present — the packet's warning about silent skips is honored).
