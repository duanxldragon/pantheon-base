---
title: GitHub Quality and Sonar Refactor Design
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-06
---

# GitHub Quality and Sonar Refactor Design

## 1. Goal

Use GitHub Actions and Sonar together to improve code quality without turning every PR into a slow full-regression queue.

This refactor treats GitHub Actions as the merge-gate system of record and keeps Sonar as an auxiliary review tool for maintainability, duplication trend review, and hotspot follow-up.

## 2. What Was Wrong

### 2.1 Full browser smoke leaked into the PR merge gate

`quality.yml` labeled the browser job as `Smoke Core`, but the actual command was:

- `npm run test:smoke:platform`
- `npm run test:smoke:system`

That is not a minimal core smoke. It is a large Playwright surface with broad page, system-domain, and governance coverage. Making this a required PR gate slowed feedback and encouraged waiting on infrastructure-heavy checks for ordinary code changes.

### 2.2 CodeQL was duplicated across quality and security workflows

`quality.yml` and `security.yml` both carried CodeQL. That produced duplicated cost and blurred ownership between quality and security signals.

### 2.3 Duplication was isolated as a separate top-level workflow

Repository duplication is a quality characteristic. Keeping it in its own standalone workflow increased branch-protection clutter without increasing clarity.

### 2.4 Dependency-vulnerability scanning was too eager for PR blocking

Dependency audits are valuable, but they are noisier and slower than direct code-safety checks. They fit better on `main`, release branches, schedules, or manual runs than on every PR gate.

### 2.5 Sonar was blamed for a coupling it did not actually own

Sonar coverage here already comes from Go test coverage:

- `go test ./... -coverprofile=coverage.out`
- `sonar.go.coverage.reportPaths=coverage.out`

The waste was not “Sonar requires full smoke for coverage.” The waste was “PR quality gate design allowed heavy browser regression into the default merge path.”

## 3. What Was Right

### 3.1 GitHub-hosted infrastructure is the correct baseline

MySQL and Redis should be started inside GitHub Actions for CI. Merge safety and smoke confidence should not depend on a developer laptop or public test infrastructure.

### 3.2 Full smoke still has value

The issue was not the existence of `smoke-full.yml`. The issue was putting too much smoke in the mandatory PR path. Full smoke remains useful for:

- manual regression before risky merges
- nightly confidence checks
- release-precheck runs

### 3.3 Sonar is still useful as an auxiliary tool

Sonar remains useful for:

- maintainability review
- duplication trend review
- hotspot review
- large AI-generated change review

It just should not become another required merge authority.

## 4. Target Workflow Split

### 4.1 `quality.yml`

Keep only fast, deterministic quality checks in the PR merge gate:

- docs governance
- frontend contract
- backend tests
- duplication gate
- lightweight `smoke-sanity`

`smoke-sanity` should prove baseline browser-path availability without expanding into full system regression. The chosen scope is:

- `npm run test:smoke:platform:contracts`
- `npm run test:smoke:system:pages`

This preserves a real browser sanity signal while cutting out heavier form, IAM-authz, governance, and business-runtime suites from every PR.

### 4.2 `security.yml`

Keep security ownership explicit:

- secret scan
- workflow posture
- CodeQL

Move dependency-vulnerability scanning out of the PR-blocking aggregate and keep it for:

- `push` to protected branches
- scheduled review
- manual dispatch

### 4.3 `smoke-full.yml`

Keep it manual for now. It can later grow into:

- nightly regression
- pre-release verification
- CD promotion guardrail

But it should not be part of every PR required check unless the suite is intentionally redesigned for speed and stability.

### 4.4 `sonar.yml`

Keep Sonar auxiliary and non-required. It should inform reviewers, not compete with GitHub-native merge gates.

## 5. Reflection

### 5.1 What I got wrong earlier

- I spent too much effort chasing green workflow runs before fully challenging whether the workflow design itself was sound.
- I allowed “more checks” to look like “more quality,” when in practice it reduced signal-to-wait ratio.
- I did not separate “coverage source of truth” from “browser regression confidence” early enough.

### 5.2 What should be preserved

- GitHub-hosted MySQL and Redis for reproducible CI
- CodeQL as the main code-security signal
- Sonar as an auxiliary review surface
- Full smoke as an optional but meaningful regression tool

### 5.3 Governance rule to keep

If a required check is slow, flaky, or broad enough that developers start working around it, that check should be redesigned, moved out of the PR gate, or split into smaller lanes.

Quality systems must improve developer judgment and regression safety, not train the team to wait on oversized queues.
