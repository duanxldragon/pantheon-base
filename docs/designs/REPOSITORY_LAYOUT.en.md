---
title: Repository Layout
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-27
---

# Repository Layout

Chinese version: [REPOSITORY_LAYOUT.md](./REPOSITORY_LAYOUT.md)

This document defines the stable root layout for `pantheon-base`. The goal is to keep the repository root readable as an engineering entry point, not as a dumping ground for temporary artifacts.

## 1. Root Groups

```text
backend/                  # Go backend: entrypoint, domain modules, shared packages, migrations
frontend/                 # React frontend: shell, page modules, smoke tests, frontend scripts
docs/                     # Current docs, contracts, designs, acceptance docs, retained history
scripts/                  # Root automation, GitHub collaboration, harness checks, release scripts
tests/                    # Root Node script tests, docs tests, performance scripts
.harness/                 # Method evidence, task manifests, runtime governance state
.agents/                  # repo-local agent notes, skills, schemas
.codex/                   # Codex repository config and task entries
.github/                  # GitHub workflows, templates, CODEOWNERS, Dependabot
.githooks/                # Local git hooks
config/                   # Method-chain config, currently config/method.config.json
database/                 # Docker Compose first-run SQL initialization
grafana/                  # Local Prometheus/Grafana observability config
openspec/                 # OpenSpec skeleton and entry notes
releases/                 # Published foundation release metadata
schema/generated/         # Generated cross-surface governance outputs
```

Root files fall into four groups:

- entry docs: `README.md`, `DESIGN.md`, `AGENTS.md`, `SECURITY.md`, `CHANGELOG.md`, `VERSION`
- build and dependency manifests: `go.mod`, `go.sum`, `package.json`, `package-lock.json`, `Dockerfile`, `docker-compose.yml`
- security and quality config: `.golangci.yml`, `.gitleaksignore`, `.gitattributes`, `.gitmessage`
- local example/config entries: `.env.example`, `.mcp.json`, `SHELL_VERSION.json`

## 2. Placement Rules

1. Backend product code belongs under `backend/modules/` or `backend/pkg/`; do not create new business directories at the repository root.
2. Frontend runtime code belongs under `frontend/src/`; frontend scripts belong under `frontend/scripts/`; frontend smoke tests belong under `frontend/tests/`.
3. Root automation belongs under `scripts/`; matching tests belong under `tests/scripts/`.
4. Harness method checks belong under `scripts/harness/`; task write-ups belong under `docs/harness/tasks/`; task manifests and evidence belong under `.harness/`.
5. Active architecture and governance docs belong under `docs/designs/`, `docs/contracts/`, and `docs/acceptances/`; phase material enters `docs/archive/` only when it satisfies the docs index rules.
6. Release metadata belongs under `releases/`; generated bundle output belongs under `dist/` and must not be committed.
7. `database/system_init.sql` remains in `database/` because `docker-compose.yml` and multiple historical docs reference that stable path.
8. Local Grafana/Prometheus observability config remains in `grafana/` so it stays separate from application runtime code.

## 3. Local Noise Directories

These directories are not part of the repository structure and are ignored by `.gitignore`; they can be cleaned locally when a tidy root is needed, but they should not be committed:

```text
.claude/
.codegraph/
.husky/
.tmp/
.worktrees/
node_modules/
frontend/node_modules/
frontend/dist/
frontend/test-results/
dist/
uploads/
backend/uploads/
```

`.tmp/` holds temporary logs, downloaded CI artifacts, smoke executables, and local security scan output. `uploads/` and `backend/uploads/` hold local runtime upload data. `dist/` is generated foundation release bundle output.

## 4. Directories Not Moved

The following directories add root entries, but they are stable contracts and should not be moved just to reduce the top-level count:

- `config/`: harness sync and check scripts read `config/method.config.json`.
- `database/`: `docker-compose.yml` mounts `database/system_init.sql` directly.
- `.harness/`: task evidence and method execution records need a fixed automation location.
- `schema/generated/`: cross-surface capability ledgers are read by governance flows.
- `releases/`: foundation release metadata must remain visible as consumer-upgrade input.

If these directories are consolidated later, scripts, CI, documentation references, and tests must be updated together. Moving files alone is not a valid cleanup.
