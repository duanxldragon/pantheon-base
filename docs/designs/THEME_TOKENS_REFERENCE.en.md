---
title: Theme Tokens Reference
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-11
---

# Theme Tokens Reference

Chinese version: [THEME_TOKENS_REFERENCE.md](./THEME_TOKENS_REFERENCE.md)

This document is the concrete token-value reference table for Pantheon Base’s four built-in themes:

- `indigo`
- `emerald`
- `violet`
- `slate`

Use it together with `FRONTEND_UI_SPEC.md`. The UI spec defines token naming and semantic roles. This document defines the concrete token values and serves as the factual source for frontend implementation and AI-generated code.

When final numbers for color, radius, spacing, type, shadow, motion, or z-index conflict with other docs, this document wins.

## 1. Token Naming Rules

Pattern:

```text
--pantheon-<category>-<role>[-<state>][-<scale>]
```

Categories include:

- `color`
- `space`
- `radius`
- `shadow`
- `type`
- `motion`
- `z`

Business code should not hardcode raw Arco tokens, raw hex values, or raw pixel values except where explicitly allowed.

## 2. Neutral Tokens Shared Across Themes

Neutral tokens define:

- app background
- default and elevated surfaces
- muted surfaces
- hover background
- primary, secondary, tertiary, and disabled foreground
- inverse text
- default and strong borders
- focus border
- divider

These values are shared across themes and must preserve accessibility contrast requirements.

## 3. Brand Accent Themes

Each theme changes the accent color family and subtle accent background, while neutral tokens stay shared.

### 3.1 `indigo`

Default enterprise-backoffice accent family.

### 3.2 `emerald`

Collaboration and operations-oriented accent family.

### 3.3 `violet`

Platform or intelligence-oriented accent family.

### 3.4 `slate`

Low-saturation office-oriented accent family.

The Chinese primary document remains the authoritative value table for each token in light and dark mode.

## 4. Shared Status Tokens

Status tokens define:

- success
- success background
- warning
- warning background
- error
- error background
- info
- info background

These remain shared across themes.

## 5. Spacing Scale

Spacing tokens cover micro gaps through large page-section spacing, and raw non-token spacing should generally be avoided.

## 6. Type Scale

Type tokens cover caption, body, heading, and display roles.

Weight guidance:

- regular `400`
- emphasized `500`
- heading `600`

The Chinese primary reference remains the authoritative size and line-height table.

## 7. Radius

Radius tokens define:

- small radius for inputs and tags
- medium radius for buttons and controls
- large radius for cards, modals, and drawers
- extra-large radius for hero containers
- pill radius for chips and circular elements

Rules:

- no oversized playful admin-card radius
- no non-pill corners above the documented ceiling

## 8. Shadow

Shadow tokens define:

- micro elevation
- card hover
- dropdown and tooltip elevation
- modal and drawer elevation

Rules:

- no oversized blur
- no decorative colorful shadows

## 9. Motion Duration and Easing

Motion tokens define:

- fast interaction feedback
- default transitions
- slower overlay transitions
- standard and emphasized easing curves

`prefers-reduced-motion` must reduce or disable these transitions appropriately.

## 10. Z-Index Layers

Z-index tokens cover:

- base
- sticky headers
- dropdowns and tooltips
- overlay masks
- modals
- notifications

## 11. Theme-Switching Implementation Rules

- tokens mount through root-level attribute selectors such as `data-theme="indigo"`
- theme switching changes CSS variables only
- the DOM must not be rebuilt to switch theme
- color mode such as light or dark is layered as a second attribute
- persistence of user preference follows the platform-shell preference rules

## 12. Acceptance

Acceptance should verify:

- all 4 themes across both color modes stay accessible
- business code does not contain raw hex or raw px drift beyond allowed exceptions
- theme switching does not reload the page
- reduced-motion handling works
