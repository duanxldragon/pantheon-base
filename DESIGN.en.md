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
- P2: multi-tenancy, SSO/OIDC, MFA and risk control, data permissions, theming, dashboards

## Guardrails

- business modules consume contracts and context, not direct system internals
- menus are navigation metadata, not business logic
- permissions must stay separated across menu, page, action, and API layers
- backend errors should return keys, not natural-language strings
- frontend text must stay fully localized

## 7.8 Spacing And Corner Radii

Use the implemented spacing scale as the canonical contract. The 2px step is reserved for
very tight internal spacing; normal layout starts at 4px.

| Token | Value |
| :--- | :--- |
| `--space-2xs` | 2px |
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 12px |
| `--space-lg` | 16px |
| `--space-xl` | 24px |
| `--space-2xl` | 32px |
| `--space-3xl` | 48px |

Keep radii restrained and consume the semantic aliases for controls, actions, and overlays.

| Token | Value |
| :--- | :--- |
| `--radius-xs` | 4px |
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--radius-xl` | 12px |
| `--radius-overlay` | 8px |
| `--radius-control` | `var(--radius-md)` |
| `--radius-action` | `var(--radius-sm)` |
| `--radius-pill` | 999px |

Use the Chinese source document for the full design doctrine, visual constraints, roadmap status, and detailed reading order.
