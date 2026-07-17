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

## Hard Stop: Claude does not implement

Claude Code in this repository is the **planner and reviewer**, not the executor.

After a plan is approved, Claude MUST NOT use Edit/Write to implement code
changes. Instead, delegate implementation to Codex via `codex exec`.

Everything under `backend/` and `frontend/src/` belongs to Codex.

Claude is allowed to modify only these categories directly:
- `docs/harness/` — harness policy, task packets, failure registry, review artifacts
- `.harness/` — evidence and audit reports
- `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` — governance documents
- Root config files: `.gitignore`, `package.json` (scripts only)
- Workflow files: `.github/workflows/` (CI configuration)

## Codex Model Tiers

Model mappings live in `.codex/model-tiers.json` — edit that file when
models iterate. CLAUDE.md references tier names only (`quick` / `standard`
/ `deep`), never hardcoded model IDs.

Claude reads `.codex/model-tiers.json` and auto-selects a tier based on
the task. The user can override by saying "use quick", "use standard",
or "use deep" when giving a task.

### How Claude builds the codex command

```text
1. Read .codex/model-tiers.json
2. Match task to a tier using the autoSelect rules
3. Always respect user override if present
4. Assemble: codex exec "<prompt>" -C pantheon-base -s <sandbox> -m <model> -c 'model_reasoning_effort="<reasoning>"'
```

### Current tiers (from config)

| Tier | Model | Reasoning | Sandbox |
|------|-------|-----------|---------|
| **quick** | gpt-5.4-mini | medium | read-only |
| **standard** | gpt-5.4 | high | read-write |
| **deep** | gpt-5.5 | xhigh | read-write |

### Auto-select rules

**→ quick** when the task is read-only (explore, find, locate),
or is a doc-only / trivial text change.

**→ deep** when the task touches auth, security, permissions,
schema, middleware, generator, dynamic-module, import/export,
pkg/common, pkg/contracts, or spans 3+ packages.

**→ standard** for everything else — the default for code-writing tasks.
