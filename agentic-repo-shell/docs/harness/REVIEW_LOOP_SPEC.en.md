# Review Loop Spec

Chinese version: [REVIEW_LOOP_SPEC.md](./REVIEW_LOOP_SPEC.md)

Type: Contract
Layer: method
Status: Active

This document defines the tool-agnostic review loop. Implementers and reviewers may use different tools or be human, but the output format must remain consistent.

## 1. Review Goal

Review is not a change summary. It is for finding:

- behavioral regressions
- security risks
- architecture-boundary drift
- permission, routing, i18n, audit, and observability gaps when the repository has those surfaces
- insufficient tests or evidence
- upstream/downstream shared-behavior risk

## 2. Review Roles

At minimum, the following roles must be supported:

- Architect Reviewer: layer, boundary, contract, dependency direction, drift
- Security Reviewer: auth, permissions, audit, sensitive data, dependency safety
- UX / QA Reviewer: page states, i18n, navigation, browser evidence, responsiveness when the repository has UI
- Mechanical Gate: CI, lint, test, smoke, static checks

One tool may play multiple roles, but high-risk work should preferably separate implementer and reviewer.

## 2.1 Default Separation Rule

For `non-trivial` work, review is not author self-check by default. It is a post-implementation external evaluation stage.

Self-review is acceptable for:

- trivial work
- low-risk documentation cleanup
- single-operator environments where the reason and residual risk are documented

The following should default to an independent reviewer or explicit review gate:

- any task that crosses a human gate
- security, permission, audit, schema, or trust-boundary work
- release, CI, secrets, deletion, or other high-impact operational changes

## 3. Review Inputs

The reviewer must read:

- the task packet or user request
- the declared implementer posture and reviewer posture
- the Structural Scope / Affected Subgraph statement, if provided
- the diff
- relevant contracts and acceptance docs
- verification evidence
- CI or local verification results

### 3.1 Minimum CodeGraph Structural Review

For `non-trivial`, cross-layer, runtime-sensitive, permission/navigation/i18n/audit/generator/dynamic-module work, review should answer at least:

- what affected subgraph actually changed, rather than only naming a broad module
- whether the change introduced a new cycle, expanded an existing cycle cluster, or blurred dependency direction
- whether a handler, service, registry, or orchestrator is turning into a new hub node
- whether a critical call chain became meaningfully deeper and harder to verify, debug, or roll back
- whether unvalidated input can now cross a key boundary and reach permission checks, external side effects, audit gaps, data writes, or other sensitive actions

These structural checks are part of the review gate. They normally surface as P1/P2 findings rather than as context-free global metrics.

## 4. Findings Format

Findings must be output first and ordered by severity:

```text
[P0|P1|P2] (confidence: N/10) file:line - issue description
Impact:
Fix:
Verification:
```

Severity:

- P0: security issue, data corruption, build failure, or a broken critical path
- P1: unreachable module, broken permission/i18n/navigation/API contract, or clear behavioral regression
- P2: governance, documentation, test coverage, or maintainability gap

## 5. No-Findings Format

If no issues are found, the reviewer must write:

```text
No P0/P1/P2 findings found.
Residual risk:
Verification checked:
```

## 6. Approval States

The review verdict may only be:

- `approved`
- `changes requested`
- `blocked`
- `approved with documented P2 follow-up`

If unresolved P0/P1 issues remain, the review cannot be approved.

## 7. Multi-Tool Collaboration

Allowed combinations include:

- Codex implementation, Claude Code review
- Cursor implementation, Codex review
- human implementation, agent review
- agent implementation, human final approval

But every review must reference the same task packet and verification evidence.

## 8. Review Artifact Linkage

If the review result is retained as an in-repository artifact, the default location is:

```text
.harness/evidence/<task-id>/review.md
```

Recommended minimum template:

```md
# Review Summary: <task-id>

## Linkage

- Task Packet: `docs/harness/tasks/<task-id>.task.md`
- Evidence: `.harness/evidence/<task-id>/commands.json`
- OpenSpec Change: `openspec/changes/<name>/` | none
- Review Mode: `self-review` | `independent-review`
- Reviewer Roles: `architect` / `security` / `ux-qa` / `mechanical`

## Verdict

approved | changes requested | blocked | approved with documented P2 follow-up

## Findings

No P0/P1/P2 findings found.

## Residual Risk

- none

## Verification Checked

- `command`
```

Even if the review is not saved as a file, the PR or review comment must still reference the same task packet and evidence paths.
