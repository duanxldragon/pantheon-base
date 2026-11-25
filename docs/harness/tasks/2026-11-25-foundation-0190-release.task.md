---
title: Submit and publish the compatible Foundation v0.19.0 candidate
doc_type: Acceptance
layer: platform
status: Active
updated_at: 2026-11-25
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
---

# Task Packet: 2026-11-25-foundation-0190-release

## Goal

Integrate the unpushed Base changes with main, review and verify the combined candidate,
submit a PR, pass hosted CI, publish an immutable v0.19.0 Foundation release and leave
the active local checkout synchronized and clean.

## Primary Layer

platform

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness at reviewed receipt 51fc783dc793b75ae91bdb936ba1418e2e95a354
- Downstream Consumers: pantheon-ops
- Sync Expectation: deferred
- Release Requirement: foundation-release

## Dependency Layers

system/auth owns live durable-job authorization; system/config owns declared business
settings and tenant-scoped reads; shared pkg contracts expose optional capabilities;
platform owns release, source recovery and engineering checks. Business consumers adopt
the official assets through their existing rebuild process.

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Quality Profile: auth-security
- Delivery Tier: L2
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality
  - maintainability
  - method-health

## Contract Anchors

- AGENTS.md and .agents/skills/repo-verify/SKILL.md
- .agents/skills/repo-pr-gate/SKILL.md
- docs/VERSION_MANAGEMENT_GUIDE.md
- docs/designs/FOUNDATION_RELEASE_MODEL.md
- docs/contracts/SYSTEM_AUTH_CONTRACT.md
- docs/contracts/SYSTEM_CONFIG_CONTRACT.md
- docs/harness/AI_QUALITY_GOVERNANCE.md
- Existing task packets for durable-job authorization, business runtime settings,
  release naming, formatter protection and depguard paths.

## Scope

### In

- Preserve local committed work and incorporate merged main fixes and reviewed method provenance.
- Submit existing optional durable-job authorization and business-setting declarations/readers.
- Repair the review finding: recheck authoritative tenant mode after the settings query,
  with deterministic real-MySQL regression coverage in both transition directions.
- Submit release naming, archive formatting and depguard corrections.
- Include the existing Go 1.26.11 security patch from the local worktree.
- Fix the 85 hosted Sonar findings without scanner exclusions or gate waivers:
  adjacent same-type Go parameters, redundant optional TypeScript undefined types and
  typed construction of the unchanged IPv6 SSRF deny ranges.
- Prepare VERSION 0.19.0, release notes, upgrade notes and consumer impact; run local
  gates, independent reviews, PR/main CI, Full Smoke and Release Gate.
- Publish and verify the four immutable assets, exact tag commit and GitHub Latest.
- Clean the task branch and synchronize the active local main after merge.

### Out

- Ops lock/tree replacement, business implementation or downstream product acceptance.
- Production operations, migration execution, S3-provider acceptance or maintenance-freeze signing.
- Gate waivers, solo-override, scanner exclusions, overwritten historical tags or releases.
- Deletion of other tasks' worktrees or branches containing unintegrated work.
- Unrelated Dependabot updates; report pre-existing PRs separately unless they block this release.

## Expected Files

### Create

- This packet, matching task manifest and task-scoped evidence/review/PR body.
- docs/release-notes/RELEASE_NOTES_v0.19.0.md
- .harness/evidence/2026-11-25-foundation-0190-release/notes/{release-notes,upgrade-notes,consumer-impact}.md

### Modify

- Existing local implementation, contract and governance diffs against main.
- backend/modules/system/config/setting/business_runtime_settings.go and regression tests.
- Sonar-reported Go parameter declarations and three TypeScript type declarations.
- backend/pkg/security/ssrf/validator.go and IPv6 denylist regression.
- Dockerfile, backend/go.mod, VERSION, CHANGELOG.md, release indexes and current status.

### Do Not Touch

- Other repositories' tracked files or worktrees.
- Historical published assets, archived raw evidence and immutable tag identities.
- User credentials, global tool configuration or existing runtime data.

## Implementation Notes

- Minimal Complexity Rung: reuse existing providers, validation helpers, fixtures and canonical release scripts.
- Quality Profile: auth-security, permission-policy, ci-workflow.
- Portable Failure Class: concurrent configuration drift; static-analysis declarations.
- Owner Layer: platform / system/auth / system/config with existing shared contracts.
- Consumer-Specific Controls: official Foundation release; no copying Base HEAD into Ops.
- Required Sensors: full CGO race, frontend lint/type-check/build, governance, security,
  exact-commit hosted checks, Full Smoke, Sonar and release-asset verification.
- Required Evidence: task commands, deterministic mode-transition red/green, independent reviews,
  hosted run identities, release identity/assets and clean-checkout confirmation.
- Ratchet Decision: sensor-added.
- Delivery Governance: L2; user explicitly authorized commit, PR, CI and new release.
- GitHub Signal: repo-quality-gate.
- Deferred Code Issues: existing S3, freeze, production and Ops acceptance gaps.
- Capabilities: PowerShell, Go, Node, gh and native independent reviewer/architect available;
  structural CodeGraph tools unavailable; no global model/configuration change.
- Recovery: .harness/evidence/2026-11-25-foundation-0190-release/summary.md.

## Verification Plan

- Read-only method-consumption validation at intake and closeout.
- Real-MySQL mode-change regression fails before the repair and passes afterward.
- go test -race -p=1 -mod=readonly -count=1 ./... with MinGW CGO and isolated databases.
- Frontend lint, type-check, build and existing unit/contract suites.
- Root docs, task packet, engineering scripts and foundation-release tests.
- Security dependency scans and hosted CodeQL/secret/workflow scans.
- PR checks and independent reviewer/architect verdicts before merge.
- Main exact-commit CI, Quality, Security, Actionlint, Sonar, Full Smoke and Release Gate.
- Canonical Foundation cut/publish, four-asset checksum/manifest/credential validation.
- Local git status and HEAD vs origin/main; no outstanding task-owned PR or branch.

## Linkage

- Task ID: 2026-11-25-foundation-0190-release
- Task Manifest: .harness/tasks/2026-11-25-foundation-0190-release/manifest.json
- Evidence Directory: .harness/evidence/2026-11-25-foundation-0190-release/
- Review File: .harness/evidence/2026-11-25-foundation-0190-release/review.md
- Change Ref: none
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: none

## Evidence Required

commands.json records actual results and fixture boundaries. summary.md records
candidate identity, scope, completed checks, current next step and explicit gaps.
review.md distinguishes independent native reviews from primary self-review.
Runtime claims require the actual MySQL/Redis or hosted smoke results; passing
an unconfigured test is not runtime proof.

## Human Gates

- User authorization for commit/PR/CI/release was given in this session.
- No intermediate approval is needed for in-scope repairs or authorized publication.
- Any gate-policy exception or production operation needs a separate explicit decision.
- Ops rebuild and final business/provider/product acceptance remain separate follow-up gates.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
