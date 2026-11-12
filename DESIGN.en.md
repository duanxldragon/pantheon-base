# Pantheon Base Enterprise Backoffice Design

Chinese version: [DESIGN.md](./DESIGN.md)

Pantheon Base is meant to be an enterprise backoffice foundation, not just a login-plus-menu CRUD shell.

## Core Intent

- stable foundation domains
- business decoupling from implementation details
- configurable and registrable extension points
- AI-readable project structure
- restrained visual language with a single source of truth for boundaries, tokens, and behavior

## Layer Model

Recommended layers:

- platform shell
- system foundation domains
- business domains

System foundation domains include:

- `auth`
- `iam`
- `org`
- `i18n`
- `audit`
- `dict`
- `setting`

## Enterprise Capability Direction

- P0: auth, authorization, org, navigation, i18n, audit
- P1: sessions, permission workbench, dictionaries, settings
- Delivered: multi-tenancy (`compat` / `multi` dual mode, see the section below), MFA/TOTP with step-up verification, data permissions (role data scope plus `dept_and_children`), dashboards, theming (four themes and dark mode)
- Not implemented: SSO / OAuth2 / OIDC login, login risk control (device fingerprinting, unfamiliar-location detection), tenant branding, quota enforcement

## Multi-Tenancy (Delivered; The Contract Is Authoritative)

The Chinese design document carries the full chapter (`DESIGN.md` section 3.4). The single source of truth for tenant semantics is [`docs/contracts/TENANT_CONTRACT_V1.en.md`](./docs/contracts/TENANT_CONTRACT_V1.en.md); this section is a pointer, not a second ruling. Earlier copies of this file listed multi-tenancy as future P2 work only, which contradicts the shipped surface (audit AUD-004).

- Model (contract sections 2.1 / 2.3): shared schema with row-level `tenant_id`; `tenant_id = 0` is the platform-global scope. No separate schema or database per tenant in V1.
- Modes (contract section 6): `tenant.mode = compat | multi`, a `system/config` feature flag defaulting to `compat`. `multi` is a superset of `compat`, not an either/or world switch. Switching is one-way (`compat` to `multi`); rolling back means a data rollback per the runbook.
- Context resolution priority (contract section 3.1): explicit `X-Tenant-Id` header (platform capability plus audit) -> Redis opaque-token `SessionData.TenantID` claim -> platform-scoped fallback to `tenant_id = 0` on route groups explicitly declared as platform-management APIs -> `compat` fallback. Missing context on a non-declared route fails closed with `TENANT_CONTEXT_MISSING`; reference implementation is `pkg/tenant.Resolve` and `internal/middleware.PlatformScopeTenantContextMiddleware`.
- Casbin domain (contract section 4): policy domain is `tenant:<tenant_id>` (`tenant:0` globally), tenant roles are named `role:<name>@tenant:<tenant_id>`, and checks run global-then-domain. The two namespaces are never merged or implicitly promoted.
- Delivered surface, each falsifiable against the route registration in `backend/modules/system/system_modules.go`: the 8 `/system/tenant` tenant CRUD and membership routes, the 5 `/system/tenant-ops/*` platform reads and plan editor routes (contract section 2.5), tenant initialization and `Bootstrap`, login-time tenant attribution plus `POST /auth/tenants/switch`, and plan/quota storage (migration `000030`) read through `PlanStore.QuotaFor`.
- Explicitly not delivered: quota enforcement (quotas are measured and displayed; **no write is rejected for exceeding one**, contract section 2.4.1), separate-schema isolation, cross-tenant sharing or federated queries, tenant custom domains and deployment shapes, self-service registration and billing, and - decided in `2026-10-31-audit-p1-business-route-tenant-context` - **business domains (`modules/business/*`) keep single-tenant semantics in V1**. Attaching tenant middleware to business route groups does not create isolation; in `multi` mode it only turns every business request into `TENANT_CONTEXT_MISSING`.

V2.0-O4 business adoption is in progress: the maintainer authorized tenant ownership for the five registered observability tables and actor ownership for history/views. Base supplies opt-in current authorization, tenant/audit contracts and required generator bootstrap. Ops must pass reviewed candidate pairing and later official release consumption. Contract section 2.7 governs scope and acceptance; released isolation is not claimed, and other business domains retain V1 behavior.

## Guardrails

- business modules consume contracts and context, not direct system internals
- menus are navigation metadata, not business logic
- permissions must stay separated across menu, page, action, and API layers
- backend errors should return keys, not natural-language strings
- frontend text must stay fully localized

## 7.8 Spacing And Corner Radii

Use the implemented spacing scale as the canonical contract. The 2px step is reserved for
very tight internal spacing; normal layout starts at 4px.

| Token         | Value |
| :------------ | :---- |
| `--space-2xs` | 2px   |
| `--space-xs`  | 4px   |
| `--space-sm`  | 8px   |
| `--space-md`  | 12px  |
| `--space-lg`  | 16px  |
| `--space-xl`  | 24px  |
| `--space-2xl` | 32px  |
| `--space-3xl` | 48px  |

Keep radii restrained and consume the semantic aliases for controls, actions, and overlays.

| Token              | Value              |
| :----------------- | :----------------- |
| `--radius-xs`      | 4px                |
| `--radius-sm`      | 4px                |
| `--radius-md`      | 6px                |
| `--radius-lg`      | 8px                |
| `--radius-xl`      | 12px               |
| `--radius-overlay` | 8px                |
| `--radius-control` | `var(--radius-md)` |
| `--radius-action`  | `var(--radius-sm)` |
| `--radius-pill`    | 999px              |

Use the Chinese source document for the full design doctrine, visual constraints, roadmap status, and detailed reading order.
