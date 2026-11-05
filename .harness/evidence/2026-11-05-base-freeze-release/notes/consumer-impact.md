# Consumer Impact

## pantheon-ops

This upgrade changes shared authentication/session behavior, SSRF outbound dialing, system data-scope and candidate loading, tenant department bootstrap, generator output and quality tooling. Ops business modules retain their ownership under `business/*`.

- Consume the official release artifact and exact repository snapshot, then use the existing declarative business-overlay rebuild. Do not copy shared files from Base main or patch shared implementations in Ops.
- Take `sharedPaths` and hashes from the release manifest. The pagination helper lives under the existing foundation-owned `frontend/src/api` directory; consumers must receive it with its updated system callers.
- Coordinate the Base-owned `000031_drop_permission_role_data_scope_policy` migration with the isolated Ops business repair `000031_backfill_cmdb_host_state_version`. The latter is unpublished business work and needs a non-conflicting number before reconstruction and fresh/upgrade migration validation. Do not renumber the published Base migration.
- Include the existing Ops host `state_version` repair and business test fixture corrections only through their business-owned overlay sources. Prior isolated business-test results are supporting evidence, not proof that the newly reconstructed migration chain passes.
- Revalidate business authorization, host import/update concurrency, datasource/webhook connection policy and generated-module build/registration on the reconstructed consumer.

Consumer release-lock advancement, complete race/build/smoke results and remote CI are recorded separately in the parent task evidence. They must identify the exact published Base artifact; Base publication alone does not establish successful Ops adoption.

The real S3 provider integration remains explicitly unconfigured in the local Base test run, and the development dependency audit retains its reported moderate findings under the existing policy. Neither is silently treated as passed or waived.
