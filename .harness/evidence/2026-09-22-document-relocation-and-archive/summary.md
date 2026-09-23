# Summary — 2026-09-22-document-relocation-and-archive

## Scope

Wave 2 #5 of `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`: execute the
minimal verified relocation set from the Wave 0 inventory.

## Moves

| From | To |
| --- | --- |
| `docs/system_design.md` | `docs/archive/upgrade/SYSTEM_DESIGN_v0.9.0_RENAME.md` |
| `docs/engineering_handoff.md` | `docs/archive/upgrade/ENGINEERING_HANDOFF_v0.9.0_RENAME.md` |
| `docs/class-diagram.mermaid` | `docs/archive/upgrade/class-diagram.mermaid` |
| `docs/sequence-diagram.mermaid` | `docs/archive/upgrade/sequence-diagram.mermaid` |
| `docs/SECURITY_SCAN_REPORT.md` | `docs/archive/baselines/SECURITY_SCAN_REPORT_20260821.md` |
| `docs/PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md` | `docs/archive/baselines/PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md` |

## Reference and index updates

- 4 archived `.md` files gained archive frontmatter (`index_group`, `retention_reason`,
  `linked_contracts`, `status: Archived`).
- Internal cross-references in the archived docs now point at the new archive paths
  (no leftover `docs/system_design.md` / `docs/class-diagram.mermaid` / `docs/sequence-diagram.mermaid`).
- `fix-report.md` reference updated to the archived checklist path with the supersede note.
- `docs/README.md` §4.3/§4.4 and `docs/README.en.md` gained index entries for the
  KEEP_ADD_INDEX docs (deployment, db init, versioning, testing, harness guides).

## Not moved (deliberate)

`DEPLOYMENT_GUIDE.md`, `DEV_DB_INIT_GUIDE.md`, `VERSION_MANAGEMENT_GUIDE.md`, four
`testing-*.md`, and the two harness guides — high fan-out or ambiguous ownership, per the
inventory.

## Verification (all green)

- `frontmatter-check`: passed, 266 docs / 212 with frontmatter.
- `check-doc-frontmatter --strict`: 0 errors (legacy warnings only).
- `check-doc-links --strict`: 0 findings.
- `check-doc-inventory --strict`: 0 findings.
- `check-structure-contract --strict`: 0 findings.

## Known gaps

- `.harness` historical records keep the pre-move paths (not gate-visible).
- The deliberate KEEP set remains in the docs root.

## Completion Status

complete
