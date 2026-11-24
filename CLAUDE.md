# Pantheon Base - Claude Code Entry

Chinese operational rules: [AGENTS.md](./AGENTS.md)

Follow `AGENTS.md` as the project source of truth.

## Maintainer Contract: three touchpoints only

The maintainer intervenes at exactly three points — (1) requirement clarification at intake (batch ALL questions once, produce In/Out/acceptance criteria, then stop asking), (2) gate-policy decisions (red gates, exemptions, rule changes), (3) final visual/functional acceptance. Between those, run autonomously: no mid-task confirmations for reversible in-scope work; gates and evidence replace verbal confirmation. See `../pantheon-harness/architecture/methodology/workflow-routing.md` → Human Touchpoints.

## CodeGraph

This repository has a project-local CodeGraph MCP config in `.mcp.json`.

- Use CodeGraph first for structural code retrieval: symbol lookup, callers, callees, impact, and task context.
- Use `rg` for literal strings, logs, copy, comments, or after CodeGraph has identified the target file.
- If the graph is stale, run `codegraph sync .` before relying on structural results.

## Implementation Approach

Consume [capability-adaptive delivery](../pantheon-harness/patterns/capability-adaptive-delivery.md) under `AGENTS.md`. Claude Code may plan, implement, verify, and repair authorized work in the primary session. Roles do not require a Codex subprocess. Planning-only/review-only assignments remain read-only; high-risk work retains independent review or an explicit review gap and acceptance gate. Preserve the current model, reasoning effort, provider, settings, and sandbox. Historical model-tier tables are not a command to override this session's selection.

Delegate only self-contained, authorized branches or independent review, with ownership, budget, stop condition, and evidence. Before work and at closeout run `node ../pantheon-harness/scripts/harness/check-method-consumption.mjs --root . --source ../pantheon-harness`; never refresh the receipt automatically.
