# O4 generator lane — working interface and file plan

Approved plan revision4 SHA256: 9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7. Generator owns only the user-listed files and bounded runtime/scaffold fixtures; all concurrent auth/audit/candidate/UI/docs work is preserved.

Implementation: reuse the existing backend templates, add v2 tenant admission (business flat CRUD only), concrete tenant/request/DataScope clones, tenant-leading unique indexes, generated schema validation, and an additive required backend module runner. Default v1 output keeps its legacy runner and helpers.

Public interface used: contracts.TenantScopedBusinessGroup(r,path,contracts.BusinessTenantGroupOptions{DB:db,RDB:database.RDB,DataScope:bool}); ModeReader and Authorization use startup registry composition. Init routes are created only after required bootstrap/migrate/schema and seed success; any returned error panics before server startup.

Exact fixtures for root inventory: frontend/tests/generator/fixtures/tenantv2-flat.json and frontend/tests/generator/fixtures/legacyv1-flat.json. Runner: scripts/testing/verify-tenant-generated-runtime.mjs. Required runtime variables: PANTHEON_TENANT_GENERATED_TEST_DSN (or explicitly provisioned PANTHEON_TEST_DSN) and PANTHEON_TENANT_GENERATED_TEST_REDIS_ADDR. Never print either value or read credential config.

Root i18n projection needed (owned locale files remain untouched): generator.wizard.templateVersion.v2 = v2 · Tenant flat CRUD / v2 · 租户平面 CRUD; generator.wizard.dataScopeMode.tenant = Tenant / 租户. Wizard uses existing Arco form layout and localized fallback until root projection. New module.generate.invalid_* errors reuse existing keys.

Implementer: Base Generator; independent review/docs/full backend race/candidate pairing: root. Runtime authorization uses a bounded read-port fixture to prove generated routing/CRUD; actual auth/IAM freshness is the separate auth lane, not asserted by this fixture.

Fresh baseline: 17/17 existing generator quality tests pass. Scoped contracts/scaffold race passes after adding existing MinGW bin to PATH; the first attempt failed at Windows gcc linker due to missing DLL search path. Frontend type-check passes. Remaining: tenant tests, exact emitted package compilation, real MySQL default/dev/replay/hostile/runtime, lint/build, rendered wizard evidence or explicit gap, exact source/export hashes.
