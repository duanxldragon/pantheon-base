# Agent Interface Contract

Chinese version: [AGENT_INTERFACE_CONTRACT.md](./AGENT_INTERFACE_CONTRACT.md)

Type: Contract
Layer: method
Status: Active

This document defines the input, output, and behavior protocol for any agent or human engineer entering a repository. Tools may differ, but the protocol must remain consistent.

## 1. Capabilities Every Agent Must Provide

A qualified executor must be able to:

- read repository documents and source code
- determine the ownership layer of the task
- respect the current repository's declared layers, modules, dependencies, and upstream/downstream boundaries
- keep file changes narrowly scoped
- run verification commands, or explicitly state why they cannot be run
- save or summarize verification evidence
- produce review output or handoff notes in a findings-first format

Any tool that cannot meet these requirements may only be used for assisted reading, drafting, or localized suggestions. It must not execute development tasks independently.

## 2. Required Task Start Output

Before starting any non-trivial task, the executor must provide:

```text
Primary layer:
Dependency layers:
Contract anchors:
Expected touched areas:
Verification plan:
Human gates:
```

Example:

```text
Primary layer: domain/billing
Dependency layers: service/payments, package/shared-types
Contract anchors:
- docs/contracts/BILLING_API_CONTRACT.md
- docs/designs/SUBSCRIPTION_STATE_MODEL.md
Expected touched areas:
- services/billing/
- packages/shared-types/src/billing.ts
Verification plan:
- npm test --workspace services/billing
- npm run type-check --workspace packages/shared-types
Human gates:
- required before changing public API or payment provider semantics
```

## 3. Pre-Modification Checks

Before modifying code or docs, the executor must evaluate whether the change affects:

- schema / migration / seed
- API contract
- authentication / authorization / permission
- menu / navigation / route access, if the repository has UI
- i18n, if the repository has user-facing text
- audit / logging / observability
- security / trust boundary
- upstream / downstream shared behavior
- generated files
- CI, release, deploy, or secret-handling gates

If any of these are affected, the corresponding documents and verification commands must be brought into scope.

## 4. Context Reading Rules

Executors must not use "I did not read the relevant contract" as a reason to ignore repository constraints.

Reading rules:

- read only the contracts, designs, and acceptance docs relevant to the task
- do not paste long document excerpts into chat context
- for long docs, extract only the hard constraints relevant to the current task
- if documentation conflicts are found, stop and explain the conflict instead of choosing the convenient version

## 5. File Modification Rules

Executors must:

- follow the existing directory structure and module boundaries
- avoid touching unrelated files
- avoid large file reshuffles that create noisy diffs
- not delete files the user did not ask to delete
- not overwrite user-owned uncommitted changes
- not copy shared rules into downstream repositories, plugins, or business extensions

If the current repository has a foundation, template, overlay, or plugin-host relationship, shared-layer bugs should first be evaluated for an upstream source-of-truth fix.

## 6. Verification Output

Before the task is complete, the executor must output:

```text
Commands run:
- <command>: passed / failed / not run

Evidence:
- <path or summary>

Known gaps:
- <gap or none>
```

If verification was not run, a concrete reason must be given:

- dependencies not installed
- required services missing from the environment
- network or permission access required
- the current task is documentation-only
- the user explicitly requested no verification

## 7. Review Output

Reviews must be findings first:

```text
[P0|P1|P2] (confidence: N/10) file:line - issue
Impact:
Fix:
Verification:
```

If no issues are found, the output must state:

```text
No P0/P1/P2 findings found.
Residual risk:
Verification checked:
```

## 8. Prohibited Behavior

Executors must not:

- skip repository protocol because a tool does not support some capability
- treat the chat transcript as the only source of requirements
- replace verification evidence with "it looks fine"
- silently rewrite upstream shared contracts inside downstream repositories, plugins, or business extensions
- defer permission, routing, i18n, audit, or security-boundary concerns as a later patch
- reduce test coverage or remove checks just to make tests pass
