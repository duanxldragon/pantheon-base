# Task Packet: 2026-09-01-release-docs-reconciliation

## Goal

Align public Base documentation and release metadata references with the published `pantheon-base-v0.10.25` release.

## Scope

- In: README, CHANGELOG, bilingual foundation release model, and release identity statements.
- Out: product code, published GitHub assets, tag mutation, and `pantheon-ops` consumption.

## Verification

- `npm run check:docs-frontmatter`
- `npm run check:harness-docs`
- `git diff --check`

## Delivery

- Base-only docs change through a pull request.
- `pantheon-ops` consumption remains explicitly deferred.
