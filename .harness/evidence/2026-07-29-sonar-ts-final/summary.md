# Summary — 2026-07-29-sonar-ts-final

This recovery branch completes the final frozen TypeScript Sonar batch:
`typescript:S8786 x3` and `typescript:S3776 x6`.

## Code closure

- Existing commits reduce cognitive complexity in layout, login, security,
  dashboard, department, profile, user-form, and operation-log surfaces.
- `OperationLogList` now preserves `CrossPageRowKey[]` through cross-page
  selection and converts keys only at the destructive API boundary. Batch
  deletion rejects non-positive or unsafe numeric keys with the existing
  `common.actionFailed` message.
- Prettier was applied only to the eight frozen batch files. No layout,
  route, permission, i18n, API, database, or CSS contract changed.

## Validation

- lint, type-check, build, eight-file Prettier check, and diff check passed.
- frontend unit tests passed: 13 files / 132 tests.
- Build preflight passed menu, i18n, shell visual, UI, SearchToolbar,
  important-budget, system-page admission, and smoke-coverage contracts.

## UI gate and gaps

The affected audit surface is a dense Arco operational table. This change
does not alter its markup structure, layout CSS, controls, or states; it
only narrows selection-key typing and validates IDs before deletion.

No shared application was listening on ports 5173 or 8080. To avoid changing
shared service lifecycle, no browser smoke or screenshots were produced.
The exact runtime/visual gap is recorded in `commands.json`; rendered desktop
and narrow evidence remain required before release-level acceptance.

## Review state

Author self-review found no scope expansion. PR #220 subsequently passed its
hosted gates and merged as `a543e5e4`, but GitHub records no contemporaneous
non-author approval. That historical governance gap is explicit and is included
in the v0.10.1 retrospective governance review; this artifact does not rewrite
the original merge history.
