---
title: Ship a full repository snapshot in the foundation release
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-13
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-13-foundation-release-repo-snapshot

## Goal

Publish a `git archive` full-repository `repo.tar` snapshot alongside the foundation release bundle, so a consumer rebuilds deterministically from a locked release without a live `../pantheon-base` working tree.

## Primary Layer

inheritance-sync

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `completed`
- Release Requirement: `foundation-release`

## Dependency Layers

- release bundle construction
- foundation release manifest

## Harness Profile

- Template: api-service
- Overlay: pantheon-base
- Quality Profile: generator
- Portable Failure Class: architecture-drift
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`

## Scope

### In

- Generate `repo.tar` from `git archive --format=tar <baseCommit>` in `build-release-bundle.mjs`.
- Emit a `repo.tar.sha256` sidecar and pack both into the release `.tgz`.
- Upload `repo.tar` + `repo.tar.sha256` as standalone GitHub release assets.
- Declare the `repoSnapshot` asset shape in the release manifest.
- Add bundle regression coverage: byte-identical to `git archive`, sha256 match, `config/`/`database/`/`schema/` present, packed into the `.tgz`.

### Out

- Ops business behavior or schema changes.
- Consumer-local overrides.
- Mutation of already-published `pantheon-base-v0.10.20` assets (this lands in v0.10.21+).

## Expected Files

### Create

- `.harness/tasks/2026-08-13-foundation-release-repo-snapshot/manifest.json`
- `.harness/evidence/2026-08-13-foundation-release-repo-snapshot/`

### Modify

- `scripts/foundation-release/build-release-bundle.mjs` snapshot generation and packing
- foundation release manifest `repoSnapshot` asset declaration
- release bundle regression coverage

### Do Not Touch

- published `pantheon-base-v0.10.20` assets
- consumer-local overrides
- business behavior and database schema

## Implementation Notes

- Derive the snapshot from `git archive` at the manifest `baseCommit` so it is reproducible and cannot include a dirty working tree.
- Sidecar the checksum next to the archive and keep both in the `.tgz` and as standalone assets.

## Verification Plan

- release bundle regression test: byte-identical archive, matching sha256, expected directories present, packed into the `.tgz`
- exact-commit Release Gate before publication
- Ops consumer rebuild from `repo.tar` without a live Base working tree

## Linkage

- Task ID: `2026-08-13-foundation-release-repo-snapshot`
- Task Manifest: `.harness/tasks/2026-08-13-foundation-release-repo-snapshot/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-13-foundation-release-repo-snapshot.task.md`
- Evidence Directory: `.harness/evidence/2026-08-13-foundation-release-repo-snapshot/`
- Review File: `.harness/evidence/2026-08-13-foundation-release-repo-snapshot/review.md`

## Evidence Required

- bundle regression result with archive identity and sha256 match
- published asset list including `repo.tar` and its checksum
- Ops consumer rebuild result
- review summary

## Human Gates

- Stop if the snapshot is not byte-identical to `git archive` of the manifest baseCommit.
- Stop if `repo.tar.sha256` does not match the produced `repo.tar`.
- Stop if the release `.tgz` omits `repo.tar`/`repo.tar.sha256`.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
