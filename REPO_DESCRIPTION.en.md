# Pantheon Base Repository Description

Chinese version: [REPO_DESCRIPTION.md](./REPO_DESCRIPTION.md)

This document is intended for reuse in the GitHub repository `Description`, `About` section, README opening paragraph, and external project introductions.

## One-Line Positioning

Pantheon Base is an enterprise admin foundation built as a modular monolith, with IAM, auth/security, audit, i18n, dynamic menus, and a controlled low-code generation and module-governance workflow.

## Short GitHub Description

Suitable for the GitHub repository `Description` field:

```text
Enterprise admin foundation with modular monolith, IAM, audit, i18n, dynamic menus, and controlled low-code module generation.
```

Alternative wording with more emphasis on the low-code work domain:

```text
Enterprise admin foundation with IAM, audit, dynamic menus, and a controlled low-code generation + module governance workflow.
```

## English Summary

Pantheon Base is a foundational repository for enterprise backoffice systems. It follows a modular monolith architecture and provides authentication/security, IAM, organization management, configuration governance, audit, internationalization, dynamic menus, and module onboarding governance. Its current low-code line has been productized as a controlled workflow in which `system/generator` handles module generation and `system/dynamicmodule` handles onboarding governance under the shared `platform.lowcode` work domain.

Its current official positioning is not a fully runtime hot-pluggable low-code platform. It is positioned as:

- a controlled module generator
- a business-module onboarding accelerator
- a product-grade internal governance tool

It is best suited for:

- enterprise admin platforms
- internal engineering acceleration
- controlled business-module generation by delivery teams
- backoffice systems with explicit governance, audit, and permission boundaries

## Recommended Topics

```text
go, gin, gorm, react, typescript, vite, arco-design, casbin, iam, audit, i18n, admin-dashboard, modular-monolith, low-code, enterprise-platform
```

## Positioning Guidance

Preferred external wording:

- `Enterprise admin foundation`
- `Modular monolith backoffice platform`
- `Controlled low-code generation workflow`

Avoid claiming, for now:

- `runtime low-code platform`
- `hot-pluggable low-code PaaS`
- `visual builder for non-engineers`

Why:

- the current version is already deliverable as a controlled generation and governance workflow
- but generated modules still require backend restart and frontend rebuild before activation
- the future hot-pluggable runtime direction is documented as an evolution path, not as a shipped capability

## Suggested README Opening

```text
Pantheon Base is an enterprise admin foundation built as a modular monolith. It provides IAM, authentication and security, audit, i18n, dynamic menus, and a controlled low-code generation + module governance workflow for backoffice systems.
```
