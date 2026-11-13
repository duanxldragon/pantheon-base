# Candidate filesystem security — 2026-11-13

## Current state

New explicit L2 security scope under the v0.18.8 release continuation. Baseline ae2fa81d9903d63b4bec8f01d61082f48a999e2f has nine open high-severity CodeQL js/file-system-race alerts #100–108. Selected API fields and the original receipt hash are retained in security-alerts-before.json; no dismissal or closure is claimed. Dependabot and secret-scanning zero counts are coordinator-provided context.

## Source boundary

- scripts/foundation-release/build-candidate-artifact.mjs: baseline lines 38, 137, 204.
- scripts/foundation-release/candidate-descriptor.mjs: baseline lines 176, 257, 262.
- scripts/foundation-release/candidate-artifact.test.mjs: baseline lines 396, 496, 499.

Security executor owns these files and runnable filesystem regressions; Writer owns this packet. Current implementation hashes and passing candidate/wired test results are retained; independent source approvals pass; hosted closure remains pending. Preserve existing immutable candidate and official consumer-lock contracts.

## Review and validation gaps

Independent five-source security/CODE and ARCH approvals are retained. security-diff-scan is unavailable; manual security boundary diff review and actual hosted CodeQL provide the security verification. Tests cannot be described as alert closure. Root must retain the final rescan and current API readback after merge. Parent 2026-11-13-v0188-release-preparation retains the final corrected-source candidate seal and successful standard consumer builds.

## Stop condition

This preparation stage closes with source-bound tests, independent security approval and normal combined PR readiness. Actual merge, Base main-only/no obsolete worktrees, exact-main hosted CodeQL/CI/Release Gate, alert closure readback and immutable publication remain downstream. No source suppression, alert dismissal or gate weakening is authorized.

## Source remediation and verification — 2026-11-13

Open-first bounded fd operations now validate source, descriptor, receipt, executable and CLI inventory bytes; exclusive fd creation protects recreated fixture writes. The exact nine-alert map retains actual #102 CLI inventory / #107 recreated write / #108 fd read paths. No dismissal or same-rule closure is inferred.

Candidate tests:68 nodes / 65 pass / 0 fail / 3 Windows leaf-symlink capability skips. Historical pre-wiring foundation command:57/57 pass. Root package-only wiring adds the candidate test glob to the command already used by CI:125 nodes / 122 pass / 0 fail / 3 capability skips, exit0, Node24.22.3. Linux hosted execution of those three cases is required. Five-source tree 93b617c283b20866f3b209047e931246dbf9b009, parent ae2fa81d9903d63b4bec8f01d61082f48a999e2f, package SHA256 aeacce2b72366bc648943d7860355efecab431d28e0d9dacc573bb7bea260a3c; full source and raw logs are retained with original/compressed hashes.

Native preliminary CODE review found zero defects and reran real tests/TS/AST diagnostics, but its COMMENT verdict remains because the mandated LSP tool is unavailable. The actual historical four-source COMMENT report is now retained with its hash; it is not a formal approval of the fifth source or combined tree; current five-source CODE-security/ARCH approvals are retained; final whole-tree confirmation remains pending. Security-diff-scan and CodeQL CLI are unavailable; the official same-version query is reference only. Initial TDD failures remain historical.

## Historical review and final target

The original manual four-source COMMENT report is retained byte-for-byte in historical-four-source-code-review.md.gz with a format-compatible Markdown reading copy, with historical-four-source-code-review-receipt.json hashes. Its source treee593388 predates package wiring; current five-source approval is retained separately.

Final target candidate-af7b5e4ba7e5b086df902b3190c5daf9f0cbc757ae0fe6d91208a329ed6e7a61 is sealed after package wiring:1176 stable inputs, 5 changed/1171 unchanged leaves, descriptor fa1d30d65ee38ecf067d2fbaa17bce3b345696efb986da7a182891313014927f, tar 69e67550b3c49b729586e7258faaea64c9f76b90895c75d89037fd8ba5026151. Original hashes and proposed-tree binding are retained; standard consumer builds and source CODE-security/ARCH approvals pass; final whole-tree confirmation and hosted delivery remain pending. Proposed source93b617 is not a final clean-main release binding.

## Source/preparation closeout — 2026-11-13

Source/preparation is complete and independently approved for normal required-check merge. Five-source tree 93b617c283b20866f3b209047e931246dbf9b009 and final candidateaf7b5e4b have SOURCE/CODE-security APPROVE and ARCH APPROVE/CLEAR. Standard consumer readonly CGO backend build (effective Go1.26.10, GOTOOLCHAIN=auto) and fresh Node24.22.3 npm ci/lint/type-check/build all pass. Before/after1176 Base/snapshot leaves,963 Ops leaves and2115 assembled leaves remain stable; assembled aggregate e242a4b78ce2c990a6245021383279fca0a31b97c9f97b7c6b3f2a42cb194562. Shared856/856 leaves match, zero exemptions;164 business skips and2 derived migrations are disclosed. Four adapter pins and official v0.18.7 lock remain unchanged; the adapter projection has2 tracked and2 untracked module changes. This proves compatibility only. Final whole-tree confirmation, actual merge/main-only cleanup, clean-main/remote-SHA1176-input binding, Linux leaf-symlink cases, hosted CodeQL automatic alert closure, exact-main CI/Release Gate and immutable release/assets remain downstream. Live task inventory is18 completed/0 in-progress.

Retained original reports: .harness/evidence/2026-11-13-candidate-filesystem-security/source-review-artifacts.json. Final build: .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/final-consumer-build-receipt.json. Historical84-file approvals and failures remain scoped to their original checkpoints. FR028 deferred, S3 unwaived, maintenance freeze unsigned and separate Ops product acceptance remain explicit.
