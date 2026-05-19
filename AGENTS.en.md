# Pantheon Base Agent Rules

Chinese version: [AGENTS.md](./AGENTS.md)

This is the English quick guide for the Pantheon Base agent rules.

Core expectations:

- treat the repository contracts and canonical docs as the source of truth
- classify every task by ownership layer before editing
- keep `platform`, `system/*`, and `business/*` boundaries explicit
- respect harness protocol before non-trivial work
- do not collapse auth, IAM, org, and config into a single mixed module
- preserve key-first i18n, permission separation, audit discipline, and modular registration

Before substantial work, read in order:

1. `DESIGN.md`
2. `AGENTS.md`
3. `docs/README.md`
4. matching contracts
5. matching designs
6. matching acceptances

Use the Chinese source document for the full repository rules, task-order constraints, and architectural red lines.
