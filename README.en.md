# Pantheon Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Chinese version: [README.md](./README.md)

Pantheon Platform is an enterprise backoffice foundation built as a modular monolith. It consolidates authentication, IAM, organization, configuration, audit, i18n, dynamic menus, and a controlled low-code generation and module-governance workflow into a reusable admin platform baseline.

The project is not intended to be just a login shell plus CRUD scaffolding. Its goal is to provide AI-friendly, sustainably evolving platform infrastructure with clear separation between system domains and business domains.

## Version

| Item | Value |
| --- | --- |
| Current foundation release | [`pantheon-base-v0.17.7`](https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.17.7) (with the four consumable assets) |
| Shell/Harness baseline | `1.4.0` (see [VERSION](./VERSION) / [SHELL_VERSION.json](./SHELL_VERSION.json)) |
| Deployment guide | [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) (MySQL 8, Redis 7, migrations + runtime seed, health checks, telemetry, backup/restore, and schema-aware rollback) |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) / [RELEASE_NOTES_v0.17.7.md](./RELEASE_NOTES_v0.17.7.md) |

Delivery status: v0.17.7 is a patch-line release that does one thing — it lands in base the three gate conclusions that `pantheon-ops` cannot close inside its own tree, because its consumer tree is rebuilt from a locked base snapshot and `.foundation/allowed-drift.json` refuses generic drift: the `revive` stutter on `setting.SettingService` is recorded in place with a reasoned `//nolint:revive` (renaming the exported type would break every consumer), and the four sinks in `backend/pkg/logging/logger.go` plus the seven sites in `frontend/scripts/tenant-matrix-fixture-setup.mjs` now carry `// codeql …: this is a false positive` annotations whose reasons live in the source instead of only in a GitHub dismissal. The whole diff is 13 inserted comment lines and 0 deletions: **the schema stays at 30 and no route, permission code, menu seed, i18n copy or exported symbol changes**, so a consumer only advances `foundation-release.lock.json` to v0.17.7 and re-runs `npm run rebuild:from-base`. The tenant-operations content (stored plans in migration `000030`, the three `/system/tenant-ops/*` platform-scoped reads with five permission codes, the compat scope pins, password accessibility and the emptied boundary baseline) is v0.17.6, and quotas stay display-only. Residual: the `SonarCloud Scan` job fails on every PR run since 2026-09-17 with `GET https://api.sonarcloud.io/analysis/jres` returning 403, which is a credential/permission defect needing a valid `SONAR_TOKEN` from the maintainer; no Sonar rule or project configuration was changed. FR-016 / FR-017 (four checkers with no npm script and no workflow step) stay `open` because wiring them into CI is a gate-policy decision reserved for the maintainer.

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
- **Dynamic menus**: menu seeds, frontend manifests, component registry, build-time contract checks; registry files are discovered by name convention (frontend `*Registry.ts`, backend `*registry.go`), supporting consumer overlay injection.
- **Low-code work domain**: the physical backend paths are `backend/modules/lowcode/generator` and `backend/modules/lowcode/dynamicmodule`, and the physical frontend paths are `frontend/src/modules/lowcode/generator` and `frontend/src/modules/lowcode/dynamicmodule`; the logical work domain is grouped under `platform.lowcode`
- **Business integration**: platform-owned `business/*` extension seams, generator support, governance contracts; concrete business repositories evolve separately

## Tech Stack

| Layer       | Technology                                             |
| ----------- | ------------------------------------------------------ |
| Backend     | Go、Gin、GORM、Casbin、Redis Token、MySQL、Redis       |
| Frontend    | React, TypeScript, Vite, Arco Design, Zustand, i18next |
| Engineering | Docker Compose, Playwright, GitHub Actions, QA flow    |

## Repository Layout

```text
backend/                  # Go backend entrypoint, modules, shared packages
backend/modules/lowcode/   # system/lowcode backend implementation for generator / dynamicmodule
frontend/                 # React shell, page modules, smoke tests, frontend scripts
frontend/src/modules/lowcode/ # low-code generator and dynamic-module UI
docs/                     # contracts, designs, acceptance docs, retained history
scripts/                  # root automation, GitHub collaboration, harness checks, releases
tests/                    # root script tests, docs tests, performance scripts
.harness/                 # method evidence, task manifests, governance state
.agents/                  # repo-local agent notes, skills, schemas
.github/                  # GitHub workflows, templates, CODEOWNERS, Dependabot
config/method.config.json # pantheon-harness method-source config
database/system_init.sql  # deprecated historical reference; authoritative schema comes from migrations + runtime seed
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

The toolchain baseline is Go 1.26.5. Local development, CI, and container builds follow the version declared in `go.mod`.

### 1. Start infrastructure

```bash
docker compose up -d
```

Defaults:

- MySQL: `127.0.0.1:3306`
- Redis: `127.0.0.1:6379`
- default database: `pantheon_base`
- schema is authoritative through application migrations and runtime seed; `database/system_init.sql` is historical only and no longer a build-time bootstrap path

### 2. Start backend

PowerShell example:

```powershell
$repoRoot='D:\workspace\go\pantheon-platform\pantheon-base'
$env:PANTHEON_DSN='root:dev_password_change_me@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local'
$env:PANTHEON_REDIS_ADDR='127.0.0.1:6379'
$env:PANTHEON_REDIS_PASSWORD='dev_redis_password_change_me'
$env:PANTHEON_WORKSPACE_ROOT=$repoRoot
Set-Location "$repoRoot\backend"
go run ./cmd/server
```

Backend default: `http://127.0.0.1:8080`

The local placeholders above match `docker-compose.yml` defaults; production must override them through environment variables or `.env`.

### Low-code module environment variables

| Variable                          | Default (per env)                  | Meaning                                                                                                          |
| --------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `PANTHEON_ENABLE_DYNAMIC_MODULES` | production `false` / others `true` | Whether runtime registration/activation of dynamic business modules is allowed. Production must keep it disabled |
| `PANTHEON_WORKSPACE_ROOT`         | inferred from git root             | Workspace root used by the low-code generator when writing source/schema; must be an absolute path when set      |
| `PANTHEON_NODE_BIN`               | `node` from `PATH`                 | Forces the Node.js absolute binary path; mainly needed in multi-version Node setups or containerized deployments |

Full description lives in `.env.example` and [Low-Code Module Code Generation Platform Guide](./docs/designs/LOWCODE_GENERATOR_GUIDE.en.md).

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://127.0.0.1:5173`

## Common Commands

```bash
cd backend
go test ./...
cd frontend
npm run build
npm run test:smoke:platform
npm run test:smoke:system
npm run test:smoke:all
# Illustrative next-release placeholders only; replace the version and candidate commit before use
npm run release:foundation:manifest -- --release-version pantheon-base-v0.13.0 --release-line release/0.13 --base-commit <40-char-commit>
npm run release:foundation:cut -- --release-version pantheon-base-v0.13.0 --release-line release/0.13 --base-commit <40-char-commit>
npm run release:foundation:publish -- --release-version pantheon-base-v0.13.0 --release-line release/0.13 --base-commit <40-char-commit>
```

## Quality and Security Gates

This repository keeps GitHub-native merge gates only:

- `Quality Gates` for docs governance, frontend contract checks, backend tests, duplication, and lightweight smoke
- `Security Gates` for secret scan, workflow posture, dependency reports, CodeQL scan, and the CodeQL alert gate

SonarCloud is not a required `main` merge check, but the foundation release gate still requires `SonarCloud Code Analysis`.
CodeQL is the primary security signal. Code quality is gated by GitHub required checks, CodeQL, branch protection, and optional Copilot review. An active ruleset already targets `main`, but it currently requires only `Quality Gates`; `Security Gates` and conversation resolution must be added and verified before certified delivery.

## Document Entry

- [DESIGN.md](./DESIGN.md): top-level architecture and domain boundaries
- [docs/README.md](./docs/README.md): Chinese-first full documentation index
- [docs/README.en.md](./docs/README.en.md): English companion index
- [.agents/skills/README.md](./.agents/skills/README.md): repository-local agent workflow skills for PR closure, GitHub comment automation, and CI triage
- [docs/designs/REPOSITORY_LAYOUT.en.md](./docs/designs/REPOSITORY_LAYOUT.en.md): root layout and file placement rules
- [docs/designs/QUALITY_AND_SECURITY_STRATEGY.md](./docs/designs/QUALITY_AND_SECURITY_STRATEGY.md): code quality and security governance strategy
- [docs/designs/FOUNDATION_RELEASE_MODEL.md](./docs/designs/FOUNDATION_RELEASE_MODEL.md): foundation release and consumer-upgrade model
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

Currently checked-in community files: `README.md`, `README.en.md`, `SECURITY.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, and `.github/pull_request_template.md`. There is no checked-in `CONTRIBUTING` file or issue templates yet.

Avoid claiming, for now:

- `runtime low-code platform`
- `hot-pluggable low-code PaaS`
- `visual builder for non-engineers`

The reason is straightforward: the current version already delivers a controlled generation and governance workflow, but generated modules still require backend restart and frontend rebuild before activation.
