# Pantheon Platform

Chinese version: [README.md](./README.md)

Pantheon Platform is an enterprise backoffice foundation built as a modular monolith. It consolidates authentication, IAM, organization, configuration, audit, i18n, dynamic menus, and a controlled low-code generation and module-governance workflow into a reusable admin platform baseline.

The project is not intended to be just a login shell plus CRUD scaffolding. Its goal is to provide AI-friendly, sustainably evolving platform infrastructure with clear separation between system domains and business domains.

## Positioning

- **Platform layer**: application shell, route composition, middleware, platform workbench, cross-domain aggregate views
- **System domains**: auth/security, users/roles/permissions, menus, organization, configuration, dictionaries, audit
- **Business domains**: integrated through `modules/business/*` and frontend manifests without directly coupling to internal system-domain implementation

## Core Capabilities

- **Auth and session**: access/refresh tokens, logout invalidation, online sessions, login logs
- **IAM and permission**: users, roles, menus, page permissions, action permissions, Casbin policy integration
- **Organization management**: departments, posts, user-organization membership, hierarchy views
- **Configuration governance**: system settings, dictionary management, cache refresh, sensitive-config protection
- **Audit**: login logs, operation logs, key write-operation audit
- **Dynamic menus**: menu seeds, frontend manifests, component registry, build-time contract checks
- **Low-code work domain**: `system/generator` handles controlled module generation and `system/dynamicmodule` handles module onboarding governance under `platform.lowcode`
- **Business integration**: platform-owned `business/*` extension seams, generator support, governance contracts; concrete business repositories evolve separately

## Tech Stack

| Layer       | Technology                                                 |
| ----------- | ---------------------------------------------------------- |
| Backend     | Go、Gin、GORM、Casbin、Redis Token、MySQL、Redis           |
| Frontend    | React, TypeScript, Vite, Arco Design, Zustand, i18next     |
| Engineering | Docker Compose, Playwright, GitHub Actions, gstack QA flow |

## Repository Layout

```text
backend/                  # Go backend entrypoint, modules, shared packages
frontend/                 # React shell, page modules, smoke tests, frontend scripts
docs/                     # contracts, designs, acceptance docs, retained history
scripts/                  # root automation, GitHub collaboration, harness checks, releases
tests/                    # root script tests, docs tests, performance scripts
.harness/                 # method evidence, task manifests, governance state
.agents/                  # repo-local agent notes, skills, schemas
.github/                  # GitHub workflows, templates, CODEOWNERS, Dependabot
config/method.config.json # pantheon-harness method-source config
database/system_init.sql  # first-run schema, seed, i18n initialization
grafana/                  # local observability config
releases/                 # foundation release metadata
schema/generated/         # generated governance outputs
```

See [Repository Layout](./docs/designs/REPOSITORY_LAYOUT.en.md) for root placement rules and local noise directories.

## Recommended Reading Order

For Chinese-first onboarding, read:

1. [README.md](./README.md)
2. [DESIGN.md](./DESIGN.md)
3. [docs/README.md](./docs/README.md)
4. [AGENTS.md](./AGENTS.md)

If you need an English entry path, continue with:

1. [docs/README.en.md](./docs/README.en.md)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

Defaults:

- MySQL: `127.0.0.1:3306`
- Redis: `127.0.0.1:6379`
- default database: `pantheon_base`

### 2. Start backend

PowerShell example:

```powershell
$env:PANTHEON_DSN='root:DHCCroot@2025@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local'
$env:PANTHEON_REDIS_ADDR='127.0.0.1:6379'
$env:PANTHEON_REDIS_PASSWORD='DHCCdhcc2025'
$env:PANTHEON_WORKSPACE_ROOT=(Get-Location).Path
go run ./backend/cmd/server
```

Backend default: `http://127.0.0.1:8080`

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://127.0.0.1:5173`

## Common Commands

```bash
go test ./backend/modules/auth ./backend/modules/system/...
cd frontend
npm run build
npm run test:smoke:platform
npm run test:smoke:system
npm run test:smoke:all
npm run release:foundation:manifest -- --release-version base-v0.8.0 --release-line release/0.8 --base-commit <40-char-commit>
npm run release:foundation:cut -- --release-version base-v0.8.0 --release-line release/0.8 --base-commit <40-char-commit>
npm run release:foundation:publish -- --release-version base-v0.8.0 --release-line release/0.8 --base-commit <40-char-commit>
```

## Quality and Security Gates

This repository keeps GitHub-native merge gates only:

- `Quality Gates` for docs governance, frontend contract checks, backend tests, duplication, and lightweight smoke
- `Security Gates` for secret scan, workflow posture, dependency reports, CodeQL scan, and the CodeQL alert gate

CodeQL is the primary security signal. Code quality is gated by GitHub required checks, CodeQL, branch protection, and optional Copilot review; Sonar and Codacy are no longer part of the merge gate. The current `main` branch protection requires only `Quality Gates` and `Security Gates`, with strict up-to-date enforcement disabled so solo-maintainer squash auto-merge does not stall.

## Document Entry

- [DESIGN.md](./DESIGN.md): top-level architecture and domain boundaries
- [docs/README.md](./docs/README.md): Chinese-first full documentation index
- [docs/README.en.md](./docs/README.en.md): English companion index
- [.agents/skills/README.md](./.agents/skills/README.md): repository-local Codex workflow skills for PR closure, GitHub comment automation, and CI triage
- [docs/designs/REPOSITORY_LAYOUT.en.md](./docs/designs/REPOSITORY_LAYOUT.en.md): root layout and file placement rules
- [docs/designs/QUALITY_AND_SECURITY_STRATEGY.md](./docs/designs/QUALITY_AND_SECURITY_STRATEGY.md): code quality and security governance strategy
- [docs/designs/FOUNDATION_RELEASE_MODEL.md](./docs/designs/FOUNDATION_RELEASE_MODEL.md): foundation release and consumer-upgrade model
- [docs/archive/upgrade/FOUNDATION_RELEASE_RUNBOOK_20260604.md](./docs/archive/upgrade/FOUNDATION_RELEASE_RUNBOOK_20260604.md): foundation release generation and consumer upgrade runbook
- [SECURITY.md](./SECURITY.md): GitHub Security policy entry

## GitHub Presentation

Recommended repository description:

```text
Enterprise admin foundation with modular monolith, IAM, audit, i18n, dynamic menus, and controlled low-code module generation.
```

Recommended topics:

```text
go, gin, gorm, react, typescript, vite, arco-design, casbin, iam, audit, i18n, admin-dashboard, modular-monolith, low-code, enterprise-platform
```

Preferred external positioning:

- `Enterprise admin foundation`
- `Modular monolith backoffice platform`
- `Controlled low-code generation workflow`

Avoid claiming, for now:

- `runtime low-code platform`
- `hot-pluggable low-code PaaS`
- `visual builder for non-engineers`

The reason is straightforward: the current version already delivers a controlled generation and governance workflow, but generated modules still require backend restart and frontend rebuild before activation.
