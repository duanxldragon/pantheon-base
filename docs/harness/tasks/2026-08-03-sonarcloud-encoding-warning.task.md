---
title: SonarCloud encoding warning remediation
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-08-03
---

# SonarCloud Encoding Warning Remediation

## Scope

- Restore the two corrupted Chinese Harness documents containing `U+FFFD`.
- Extend the existing encoding gate to reject replacement characters.
- Add a focused regression test.

## Out Of Scope

- Product code, APIs, database schema, permissions, menus, and UI behavior.
- SonarCloud quality-profile or analysis-scope changes.

## Success Criteria

- Tracked source and documentation files contain no `U+FFFD`.
- Strict encoding, frontmatter, and documentation-link checks pass.
- The hosted SonarCloud analysis for merged `main` has no encoding warning.

## Linkage

- Task ID: `2026-08-03-sonarcloud-encoding-warning`
- Manifest: `.harness/tasks/2026-08-03-sonarcloud-encoding-warning/manifest.json`
- Evidence: `.harness/evidence/2026-08-03-sonarcloud-encoding-warning/commands.json`
- Review: `.harness/evidence/2026-08-03-sonarcloud-encoding-warning/review.md`
