# Pantheon Base - Claude Code Entry

Chinese operational rules: [AGENTS.md](./AGENTS.md)

Follow `AGENTS.md` as the project source of truth.

## CodeGraph

This repository has a project-local CodeGraph MCP config in `.mcp.json`.

- Use CodeGraph first for structural code retrieval: symbol lookup, callers, callees, impact, and task context.
- Use `rg` for literal strings, logs, copy, comments, or after CodeGraph has identified the target file.
- If the graph is stale, run `codegraph sync .` before relying on structural results.
