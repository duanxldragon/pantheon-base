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

| Layer | Technology |
| --- | --- |
| Backend | Go, Gin, GORM, Casbin, JWT, MySQL, Redis |
| Frontend | React, TypeScript, Vite, Arco Design, Zustand, i18next |
| Engineering | Docker Compose, Playwright, GitHub Actions, gstack QA flow |

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
npm run test:smoke:system
npm run test:smoke:role-auth
npm run test:smoke:impexp
npm run test:smoke:backoffice-ui
```

## Document Entry

- [DESIGN.md](./DESIGN.md): top-level architecture and domain boundaries
- [docs/README.md](./docs/README.md): Chinese-first full documentation index
- [docs/README.en.md](./docs/README.en.md): English companion index

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
