# Upgrade Guide

Chinese version: [UPGRADE.zh.md](./UPGRADE.zh.md)

Use this guide when updating an existing repository that already contains:

- `agentic-method-kit/`
- `agentic-repo-shell/`-derived repo-local files

## Upgrade Policy

- upgrade `agentic-method-kit/` first
- then reconcile repo-local shell files
- then rerun harness checks

## 1.0.0

Baseline release.

Recommended verification after upgrade:

```text
node agentic-method-kit/scripts/check-task-packet.mjs --root .
node agentic-method-kit/scripts/check-evidence.mjs --root . --strict
node agentic-method-kit/scripts/check-review.mjs --root . --strict
node agentic-method-kit/scripts/check-adoption.mjs --root .
```
