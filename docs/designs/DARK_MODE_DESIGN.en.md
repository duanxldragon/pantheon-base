---
title: Dark Mode Design
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-11
---

# Dark Mode Design

Chinese version: [DARK_MODE_DESIGN.md](./DARK_MODE_DESIGN.md)

This document defines Pantheon Base dark-mode behavior, token inversion strategy, component adaptation rules, and switching behavior.

Concrete token values live in `THEME_TOKENS_REFERENCE.md`. This document focuses on mode behavior rather than raw numbers.

## 1. Design Goals

- dark mode is not a naive color inversion
- each brand theme must stay recognizable in dark mode
- neutral backgrounds should use deep blue-gray rather than pure black
- text should avoid pure white glare
- focus rings must still meet contrast requirements

## 2. Token Inversion Strategy

Tokens are not inverted mechanically. They are redefined by semantic role.

Core principles:

- app background becomes deep gray, not black
- card and overlay surfaces step up in brightness
- foreground text becomes near-white, not pure white
- accent colors become brighter and less saturated
- subtle accent backgrounds become deep, low-light background tones
- shadows become darker and more pronounced to remain visible

## 3. Brand-Color Adjustment Rules in Dark Mode

For accent colors in dark mode:

1. raise lightness
2. reduce saturation slightly
3. preserve hue
4. invert subtle background usage into deep accent-tinted panels

## 4. Elements That Cannot Be Naively Inverted

Examples:

- screenshots
- company logos
- business charts
- code blocks
- zebra tables
- toast and notification borders

Each of these needs explicit dark-mode treatment rather than generic inversion.

## 5. Shadow Strategy

Dark mode uses deeper, more opaque shadows and sometimes subtle highlight rims so overlays still separate from dark surfaces.

## 6. Focus Rings

Dark-mode focus rings should use the brightened accent color and still keep contrast above the accessibility threshold.

## 7. Switching Behavior

### 7.1 User-Preference Priority

Priority order:

- explicit user choice
- platform default
- system `prefers-color-scheme`

### 7.2 No Reload on Switch

Switching color mode should:

- change root attributes
- recalculate CSS variables
- avoid page reload
- avoid component-tree rebuild

### 7.3 Persistence

- signed-in users persist through platform preferences
- unauthenticated users may persist locally
- user choice overrides defaults

## 8. Dark-Mode-Specific Notes

Special care is needed for:

- PNG edges and transparent assets
- iframe dark-mode support
- print mode forcing light output
- screenshot evidence across light and dark mode

## 9. Implementation Checklist

Verify:

- initial HTML attributes are mounted early enough to avoid flash
- CSS references only shared Pantheon variables
- all theme and mode combinations pass contrast checks
- switching does not flash or reload
- overlays remain clearly layered
- charts and code blocks have dark-mode variants

## 10. Acceptance

Acceptance should archive screenshots across all theme and color-mode combinations, preserve user preference across refresh, honor system preference when no explicit user preference exists, and maintain CSS fallback when JavaScript is disabled.

## 11. Related Documents

- `THEME_TOKENS_REFERENCE.md`
- `ACCESSIBILITY.md`
- `FRONTEND_UI_SPEC.md`
- `FRONTEND.md`
