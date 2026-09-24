# Summary — 2026-09-22-naming-boundary-canonical-standard

## Scope

Wave 0 #1 of `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`:
freeze one authoritative standard for repository layout, file naming, controlled
exceptions, and layer dependency directions.

- Primary layer: platform / governance (L1, documentation-only).
- Changed files: `docs/designs/REPOSITORY_LAYOUT.md`,
  `docs/designs/REPOSITORY_LAYOUT.en.md`,
  `.harness/tasks/2026-09-22-naming-boundary-canonical-standard/{task.md,manifest.json}`,
  and this evidence directory.

## What changed

`docs/designs/REPOSITORY_LAYOUT.md` grew from a short root-layout note into the
canonical standard. Existing §1–§4 (root groups, placement rules, local noise,
stable directories) are preserved so existing references stay valid; new sections:

- §2.2 directory whitelist — the exact sets `check-structure-contract.mjs` enforces.
- §5 file suffix vocabulary — backend Go responsibility suffixes (`_handler`,
  `_service`, `_repository`, `_model`, `_dto`, `_registry`, `_seed`, `_export`,
  `_module`, `_helpers`/`_utils`, `_test`), frontend TS/TSX categories, and doc naming.
- §6 document taxonomy — the five-type model plus directory placement and the
  "no keep-it-and-see" retirement rule.
- §7 generated artifact rules — source/output/hand layers, the required generated
  marker, and the reset-template source.
- §8 layer dependency matrix — allowed directions for platform/auth/system/business,
  plus the frozen violation baseline.
- §9 controlled exceptions — `auth`, `lowcode`, `generated`, test dirs, and stable
  root entries, each with owner, rationale, and review condition.
- §10 gate mapping and the standard-first change procedure.

`REPOSITORY_LAYOUT.en.md` is updated as the isomorphic English companion.

## Verification

All green (see `commands.json`):

| Check | Result |
| --- | --- |
| `check-structure-contract.mjs --root . --strict` | 0 findings / 1939 tracked files |
| `check-task-packet-template.mjs` | OK |
| `frontmatter-check.mjs` | passed, 266 docs |
| `check-doc-frontmatter.mjs --root . --strict` | 0 error (only pre-existing legacy warnings) |
| `check-doc-links.mjs --root . --strict` | 0 findings |
| `harness-check-structure-contract.test.mjs` | 11 pass / 0 fail |

## Honest gaps recorded (not silently assumed to hold)

- The generated-file marker, `npm run check:generated`, and CI wiring of
  `check-arch-boundaries.mjs` are **specified but not implemented** → Wave 1
  `2026-09-22-generated-artifact-governance`.
- `platform -> system` and `auth -> system/iam` production dependencies remain
  unblocked → Wave 1 `2026-09-22-layer-boundary-gate`.
- Local `npm run <script>` could not execute (npm resolves to a WSL relay with no
  `/bin/bash`); the equivalent `node` invocations of the exact `package.json`
  script targets were run instead.

## Completion Status

complete
