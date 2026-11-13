# Independent architecture review — five-source / final candidate

Architectural status: CLEAR. Recommendation: APPROVE for the reviewed source and sealed candidate. No unresolved architectural or security-boundary findings remain across the five changed source files. Hosted CI, automatic alert closure, final build/evidence binding, and release operations remain separate gates.

Review bound to staged tree 93b617c283b20866f3b209047e931246dbf9b009, based on ae2fa81d9903d63b4bec8f01d61082f48a999e2f. Reviewer: native independent final_security_arch_review architect lane; read-only, no source changes, no test reimplementation.

## Analysis

Filesystem validation now governs the opened file. The shared reader opens first, checks bigint identity/type/link count/size before allocation, reads bounded chunks, probes exact EOF, and rechecks handles, paths, and ancestors. All handles remain open through callback validation and final observations (scripts/foundation-release/candidate-descriptor.mjs:100).

The earlier cleanup concern is resolved. Every handle receives a close attempt; close failures preserve an existing validation error. A dedicated regression verifies both failure paths (candidate-descriptor.mjs:149; candidate-artifact.test.mjs:162).

Producer safeguards remain intact. Saved descriptor/archive checks retain exact bytes, sizes, and digest pins. Source stability checks and nonrecursive cleanup with ownership checks remain in place (build-candidate-artifact.mjs:123,144,154). The new recreated fixture writer exclusively creates the path and writes through its opened fd (candidate-artifact.test.mjs:51,642), addressing the actual #107 write site.

Ancestor protection has direct coverage. The corrected junction test preserves the original descriptor inode and requires an ancestor/directory refusal, resolving the earlier ambiguous test (candidate-artifact.test.mjs:113).

CI coverage is concretely wired. The existing foundation test command now includes candidate tests; the existing Ubuntu job invokes it (package.json:55; .github/workflows/ci.yml:106,187).

Smoke correction preserves rejection behavior. Passing undefined places the timeout in evaluate's third argument while retaining the existing readiness selectors, retries, and empty-text assertion (frontend/tests/smoke/system/system-pages-helpers.ts:775).

## Root Cause

The security sites separated pathname checks from subsequent file operations. The smoke helper passed timeout options as the evaluated function's argument, allowing a detached empty state to consume the default action timeout. The changes address these causes through reusable descriptor-backed operations and the correct native API argument position.

## Validation and Binding

Inspected combined test receipt: 125 tests, 122 passed, zero failed, three explicit Windows leaf-symlink capability skips (sec509/wired-foundation-tests.txt:155). Junction and ancestor attacks executed locally. Source tests were not repeated by this architect; the existing fresh exact-source receipts were reviewed.

Reviewed real-browser evidence: original detachment rejected after approximately 30 seconds; corrected helper passed in 2.171 seconds; persistent unknown empty still rejected (sr509/summary.md:37). Inspected known-empty-desktop.png and populated-table-mobile.png, at 1280x720 and 390x844. These are controlled fixtures, not full application acceptance or product polish claims. The impeccable skill and its visual-quality checklist were applied.

Fresh independent fd-backed archive verification passed for all 1176 entries, with every reviewed source byte-equal to its frozen worktree file (functions.exec chunk d78da7).

Candidate: candidate-af7b5e4ba7e5b086df902b3190c5daf9f0cbc757ae0fe6d91208a329ed6e7a61
Descriptor SHA256: fa1d30d65ee38ecf067d2fbaa17bce3b345696efb986da7a182891313014927f
Archive SHA256: 69e67550b3c49b729586e7258faaea64c9f76b90895c75d89037fd8ba5026151

Reviewed source SHA256:

- scripts/foundation-release/build-candidate-artifact.mjs: 6196730755893349e7d42088c0e4a03ebd2064cac3924d52e8f456d7b501dc9e
- scripts/foundation-release/candidate-descriptor.mjs: 2cd4c0e7b61b5b920c9c5e0e070a0a292621dc5397624c4c92d7a0468c0b594c
- scripts/foundation-release/candidate-artifact.test.mjs: 341fb61709eed19b24feaa65778b1548bbc7738d0edc4159c0c1f118cbe44ff3
- frontend/tests/smoke/system/system-pages-helpers.ts: 0e2c20882e7fb20ad5884c64dc85388ca8acd2ecdab074e8887520dc19a59981
- package.json: aeacce2b72366bc648943d7860355efecab431d28e0d9dacc573bb7bea260a3c

## Recommendations and Trade-offs

Proceed with standard consumer build validation using this candidate. Require exact hosted CI and automatic closure of alerts #100–108 before downstream closeout.

The shared Node reader is the smallest reusable repair. Its path observations provide tamper detection, not atomic namespace locking; final saved handles close before publication rename (build-candidate-artifact.mjs:149). That limitation is explicit and unchanged. No new dependencies, workflow changes, query suppressions, dismissals, or gate weakening were introduced in the five-source diff.

This review stops at source/candidate approval. Final governance and executable receipt binding remain pending; approval does not assert merged/released/CI-green state.
