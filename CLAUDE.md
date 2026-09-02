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

Claude Code can directly implement changes using Edit/Write/Bash tools as needed.

For complex tasks requiring deep reasoning or specialized expertise, consider delegating to external tools or agents, but this is optional and at maintainer discretion.

