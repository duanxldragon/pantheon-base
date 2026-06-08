# Agentic Method Kit

Chinese version: [README.zh.md](./README.zh.md)

Portable method kit for repositories that want a repeatable Harness Engineering workflow.

Copy this directory into another repository when you want explicit delivery controls for non-trivial agent or human-assisted work.

It also carries a minimal graph-review closure path:

- scaffold `graphChecks` / `structuralReview` from task packet `## Structural Scope`
- normalize saved CodeGraph-style output into `graph-review.json`
- import that normalized result back into evidence/review closure

When adopting the method in `pantheon-base`, use it with:

- repo-local harness docs under `docs/harness/`
- consumer-specific quality governance in `docs/harness/AI_QUALITY_GOVERNANCE.md`
- delivery orchestration in `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`

## What This Kit Defines

- A tool-agnostic harness core model
- A coverage model for guides, sensors, gates, and failure capture
- A template taxonomy for different repository shapes
- A tool adapter matrix so concrete tools remain usable without becoming prerequisites
- A default playbook for change selection, task packets, implementation, evidence, and review
- Portable schemas and templates for task packets, evidence, review closure, and failure registry entries
- Portable checks for method health, adoption, task packet structure, and governance drift
- Portable closure for review artifacts, plus generic template/runtime/docs-integrity governance

## What This Kit Does Not Require

- any one editor
- any one hosted agent runtime
- any one MCP server
- any one skill bundle

Specific tools can be recommended by a repository. They do not define the method.

## Quick Start

1. Read [README.zh.md](./README.zh.md) if your team is Chinese-first
2. Read [HARNESS_CORE_MODEL.zh.md](./HARNESS_CORE_MODEL.zh.md)
3. Read [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md)
4. Read [HARNESS_TEMPLATE_TAXONOMY.zh.md](./HARNESS_TEMPLATE_TAXONOMY.zh.md)
5. Read [TOOL_ADAPTER_MATRIX.zh.md](./TOOL_ADAPTER_MATRIX.zh.md)
6. Read [METHOD_PLAYBOOK.zh.md](./METHOD_PLAYBOOK.zh.md)
7. Copy the templates you need
8. Adjust [config/method.config.json](./config/method.config.json) if your repo uses different paths
9. Run the portable checks under [scripts/](./scripts/)

## Closed Loop

For non-trivial work, the portable loop is:

- change record
- task packet
- implementation
- verification evidence
- review artifact
- governed docs when the repository adopts doc governance

This kit exists to make that loop explicit and portable.

## Canonical Role

`agentic-method-kit/` is the canonical method source.

Repository-local `docs/harness/*` files may project or summarize the method for local execution, but if drift appears, the method definition here wins and downstream projections should be synchronized.

## Versioning

Current version:

- `1.0.0`

Version metadata:

- [VERSION](./VERSION)
- [METHOD_VERSION.json](./METHOD_VERSION.json)
- [CHANGELOG.md](./CHANGELOG.md)
- [UPGRADE.md](./UPGRADE.md)
