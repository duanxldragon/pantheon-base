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
4. `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`
5. matching contracts
6. matching designs
7. matching acceptances

Additional defaults:

- for non-trivial work, state the implementer posture, reviewer posture, minimum evidence set, and human gates up front
- runtime-sensitive changes such as auth, permissions, menu routing, import/export, lowcode, dynamic modules, async chains, and external integrations need runtime evidence or an explicit runtime gap in addition to tests
- when the same failure pattern repeats, ratchet it from closeout note to repo rule and then to checker, smoke path, or failure-registry entry

Use the Chinese source document for the full repository rules, task-order constraints, and architectural red lines.
