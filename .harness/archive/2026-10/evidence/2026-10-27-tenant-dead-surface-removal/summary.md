# Summary — W8 `2026-10-27-tenant-dead-surface-removal`

Branch `refactor/tenant-dead-surface-removal-w8-2026-10-27` (stacked on the W5
branch `docs/tenant-contract-alignment-w5-2026-10-27`, itself stacked on W4 —
merged as #442). The wave deletes the unmounted legacy tenant HTTP surface and
the never-wired bootstrap service, and re-homes every live assertion onto the
surface that ships.

## Diff stat (code + docs, before evidence files)

```
 backend/modules/system/iam/tenant/tenant_bootstrap.go      | 126 -------------
 backend/modules/system/iam/tenant/tenant_handler.go        | 358 --------------
 backend/modules/system/iam/tenant/tenant_handler_test.go   | 244 ------------
 backend/modules/system/iam/tenant/tenant_platform_handler.go|  15 +
 backend/modules/system/iam/tenant/tenant_routes.go         |  28 --
 backend/modules/system/iam/tenant/tenant_service.go        |   4 +-
 backend/modules/system/iam/tenant/tenant_service_test.go   |  17 +
 backend/modules/system/iam/tenant/tenant_platform_handler_test.go | 311 +++++ (new)
 docs/TENANT_MATURITY_FINAL_2026-09-29.md                   |  24 +-
```

Net production code: −512 lines (three files), +15 (relocated pagination
parser), −3 (comment trim). No mounted route, middleware or response shape
changed.

## Verification matrix

| Check | Result |
|---|---|
| `go build ./...` | OK |
| `go vet ./modules/system/iam/tenant/` | OK |
| `go test -count=1 ./modules/system/iam/tenant/...` (DSN) | ok 59.9s — 126 pass / 0 skip / 0 fail (baseline 119, same counting method; +7, no assertion lost) |
| `go test -count=1 ./...` (DSN, full backend) | GO_TEST_EXIT=0, 46 packages ok (clean re-run with direct exit code) |
| Manifest grep for deleted symbols (`NewHandler`, `RegisterRoutes(engine`, `BootstrapService`, `MigrateExistingUsersToDefaultTenant`) | zero hits in `backend --include=*.go` |
| `check-doc-links.mjs --root . --strict` | 0 finding(s) |
| `check-task-packet.mjs --root .` | 66 file(s), 0 error(s), 41 warning(s) |

## Scope decisions

- Five-location reference search is fresh (this branch) and recorded per
  location in [reference-search.md](reference-search.md), including the
  pantheon-ops inherited-duplicate finding and the foundation-release
  sync-semantics note.
- `parseTenantMemberPagination` moved verbatim into
  `tenant_platform_handler.go` — compile-forced, recorded as a deviation in
  [test-migration.md](test-migration.md).
- `docs/TENANT_MATURITY_FINAL_2026-09-29.md` §4 now marks the four bootstrap
  entry points as never-wired and deleted (2026-10-27), with the real
  initialization path (`/system/tenant/*` create-tenant provisioning)
  referenced; the rest of the document stays as historical对照 per its own
  2026-10-13 banner.
- `/tenants/my` had no production equivalent; the replacement surface is
  `GET /auth/tenants/switchable` (W4-filtered). Recorded in
  [reference-search.md](reference-search.md).

## Known gaps

- Playwright/live-instance smoke was not run (no smoke backend in this
  session); the manifest lists it as optional ("if a live instance is
  available"). The mounted surface's handler contract is covered by the new
  platform-handler tests.
- pantheon-ops foundation-release sync semantics for deleted upstream files
  (overwrite-only vs delete) needs runbook confirmation — recorded in
  reference-search.md, no ops code touched.
