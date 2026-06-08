# Migration Notes

Chinese version: [MIGRATION.zh.md](./MIGRATION.zh.md)

This kit is intended to survive repo moves and tool swaps.

## Portable Source Of Truth

Keep the method source of truth inside this directory:

- playbook
- templates
- schemas
- portable checks

Do not make a Claude-only, Codex-only, Cursor-only, or MCP-only config the canonical method definition.

## What Should Stay Repo-Local

These should remain outside the kit in each target repository:

- actual task packets
- actual evidence
- actual review artifacts
- repo-specific CI workflows
- repo-specific wrapper scripts

## Migration Pattern

When moving to a new repository:

1. Copy `agentic-method-kit/`
2. Adjust `config/method.config.json` if paths differ
3. Recreate wrapper scripts or CI wiring
4. Seed one sample task packet, evidence directory, and review artifact
5. Run all portable checks before declaring adoption complete
