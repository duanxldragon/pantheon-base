# O4 documentation increment — 2026-11-09

Status: implementation in progress. This is documentation evidence only, not runtime, independent implementation approval or official release consumption.

The maintainer's existing authorization covers extending the Base business tenant contract and validating tenant/actor isolation in the same P0 batch. The approved revision4 plan remains SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`.

Updated the canonical tenant contract and resource matrix previously recorded in `resume-tenant-contract-docs.json`; this increment links the V2.0-O4 target from CN/EN DESIGN and generator guides, the existing tenant initialization guide and migration runbook. It records only the five-table adoption, fresh entry/outbound/release authorization, generated required bootstrap and default/development runtime proof, retained migration37/dirty recovery, stopped old process and supported artifact/schema validation. Official pairing is explicitly still open.

Root reconciled the parent manifest with the generator's concrete fixture paths `tenantv2-flat.json` and `legacyv1-flat.json`, and the actual DESIGN/generator guide destinations. Removed proposed English initialization/runbook duplicates from the create inventory: neither file exists, and their existing canonical entries link the bilingual tenant contract rather than introducing another migration truth source. Existing historical runbook evidence and system semantics were preserved.

Fresh checks from Base root:

- `git diff --check -- DESIGN.md DESIGN.en.md docs/TENANT_INITIALIZATION_GUIDE.md docs/runbooks/TENANT_MIGRATION_RUNBOOK.md docs/designs/LOWCODE_GENERATOR_GUIDE.md docs/designs/LOWCODE_GENERATOR_GUIDE.en.md .harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`: exit0; only informational CRLF normalization notices.
- `npm run check:docs-frontmatter`: exit0, 466 documents checked; legacy metadata review-age notices are informational.
- `npm run check:task-packet-template`: exit0.

Remaining: implementation/API and candidate review; final API names and emitted behavior reconciliation; startup command/runbook details after actual reviewed implementation; generated and live provider/privacy/rendered evidence; eventual official paired release/consumption. All P0 parents remain open. These document checks do not certify mutable source or skip integration requirements.
