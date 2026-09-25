# Task Packet: 2026-09-08-p2-community-building

## Goal

Deliver the community-contribution surface listed in `TASK_MASTER_PLAN.md` P2-4: a `CONTRIBUTING.md` and a `.github/ISSUE_TEMPLATE/` set. Both deliverables already exist in the repository; this packet is back-filled on 2026-09-24 as accounting that closes the item against its original definition of done.

## Primary Layer

platform

## Dependency Layers

- platform governance tooling

## Harness Profile

- Template: custom
- Overlay: community-surface
- Coverage Dimensions:
  - maintainability
  - architecture-fitness

## Contract Anchors

- `CONTRIBUTING.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/question.md`
- `.harness/tasks/TASK_MASTER_PLAN.md`

## Scope

### In

- Verification that `CONTRIBUTING.md` exists and covers the contribution workflow
- Verification that the issue-template set exists (bug, feature, question)
- Evidence closing the master-plan line item

### Out

- CODE_OF_CONDUCT, PR templates, or GitHub Discussions automation (not in the master-plan item)
- Any code, gate, or docs-index change in this packet
- pantheon-ops side templates

## Expected Files

### Create

- `.harness/tasks/2026-09-08-p2-community-building/task.md`
- `.harness/tasks/2026-09-08-p2-community-building/manifest.json`
- `.harness/evidence/2026-09-08-p2-community-building/commands.json`
- `.harness/evidence/2026-09-08-p2-community-building/summary.md`
- `.harness/evidence/2026-09-08-p2-community-building/review.md`

### Modify

- none — the deliverables already exist and are not edited by this packet

### Do Not Touch

- `CONTRIBUTING.md` content
- `.github/ISSUE_TEMPLATE/**`
- CI workflows

## Implementation Notes

Original definition of done from `TASK_MASTER_PLAN.md`:

- Files: `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`
- Effort: 4 hours, "Can start anytime"

Verified present on 2026-09-24:

- `CONTRIBUTING.md` at repo root.
- `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, `question.md` (3 templates).

Nothing further was required; the packet exists so the master plan's 15-task inventory is fully instantiated.

## Verification Plan

- `ls CONTRIBUTING.md .github/ISSUE_TEMPLATE/`
- `head -20 CONTRIBUTING.md`
- `node scripts/harness/check-task-packet.mjs --root . .harness/tasks/2026-09-08-p2-community-building/task.md`

## Linkage

- Task ID: 2026-09-08-p2-community-building
- Task Manifest: `.harness/tasks/2026-09-08-p2-community-building/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/tasks/TASK_MASTER_PLAN.md`
- Evidence Directory: `.harness/evidence/2026-09-08-p2-community-building/`
- Review File: `.harness/evidence/2026-09-08-p2-community-building/review.md`

## Evidence Required

- Listing proving `CONTRIBUTING.md` and the three issue templates exist
- Review disposition confirming the master-plan line item is closed as specified

## Human Gates

- none required (documentation surface already present; no production change) — evidence review only

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
