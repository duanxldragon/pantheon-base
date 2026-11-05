# CI doc evidence repair

Parent task: 2026-11-05-base-freeze-release.

PR #489 merged as de9f11a6b372eb4c5a4d5f2dae4b326364a278c2. Hosted main Quality/Docs Governance failed at check:harness-docs: two historical audit screenshot links pointed outside the repository. The PR job treated this existing check as advisory; main correctly enforced it. No gate policy changes are made.

The two original PNGs are copied byte-for-byte into audit-screenshots/ and the report points there. This only packages existing rendered evidence; it does not change UI or replace audit conclusions. CI raw log: workspace audit-artifacts/base-freeze-2026-11-05/main-docs-governance-failure.log, job 127179901601.

SHA256:

- login-desktop.png: `3080fa1d69f38b6770795df36c39c66e540dc1fe6107519f8ad02ed522cb5413`
- login-mobile.png: `2705b1b85b038febd234cd69b4c0abf774431f5a988a2c15703456cc8a253fd3`

Validation: strict doc-link check passes both workspace and isolated staged tree (0 findings); workspace frontmatter and diff check pass. Independent code-reviewer APPROVE in docs-link-review.md. Isolated frontmatter requires Harness directory placement; workspace frontmatter passed, hosted rerun remains mandatory.
