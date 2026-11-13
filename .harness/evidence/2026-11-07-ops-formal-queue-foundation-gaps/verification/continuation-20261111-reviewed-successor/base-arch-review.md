# Root capture of actual independent ARCH review

Origin: `/root/post_config_review_arch`, native installed architect, actual final message at 2026-11-11T04:41:12Z. The read-only lane returned its report for Root capture. The findings and machine block below are captured from that actual response. The original helper verdict is retained; CODE subsequently raised a separate helper contract defect, so this capture authorizes only the exact Base two-file compatibility fix. A fresh helper successor review is required.

No blocking architectural findings. **APPROVE / CLEAR** for the exact two-file permission compatibility fix.

The preserved registry rejected `_` in permission tails, while Ops declares `metric_source:view/create/update/delete` and uses that spelling for authorization. The repair adds one underscore to the tail character class, preserving the existing key without introducing an alias.

The change preserves domain, route, method and batch boundaries. Module names still exclude underscores; registration requires the exact module prefix, confines paths to that business domain, validates methods and segments, and commits only after validating the complete batch and checking conflicts.

Keys remain exact through IAM. The workbench copies registry entries under their original keys; role normalization only trims whitespace, removes empty entries and deduplicates. Desired policies require exact membership in the role’s held keys.

**Integration consequence:** restored registration also expands the routes managed by later role synchronization. That synchronizer may remove managed policies absent from the role’s desired set. Registration itself grants no role, but downstream validation must exercise both held and unheld legacy keys.

**Architectural status: CLEAR.** Review is complete for these exact bytes. Candidate integration, full-current Base gates, downstream Ops verification, runtime, release and P0 acceptance remain separate gates.

Actual returned machine block, verbatim:

```json
{
  "subject": "Base-legacy-permission-tail-v1",
  "lane": "ARCH",
  "decision": "APPROVE",
  "architecturalStatus": "CLEAR",
  "independent": true,
  "reportPath": "pantheon-base/.local/base-permission-legacy-key-20261111/review-arch-20261111T044112Z.md",
  "reportWrittenByLane": false,
  "reviewedUTC": "2026-11-11T04:41:12Z",
  "parent": "2026-11-07-ops-formal-queue-foundation-gaps",
  "parentRevision": "O4 rev4",
  "findings": [],
  "sourceHashes": {
    "backend/pkg/permissionroutes/registry.go": "18d5714e63a0a3630de2e8649000a9bbcfb9634c03b991238388b6c8b7b262fb",
    "backend/pkg/permissionroutes/registry_test.go": "a966a5922fbca3f86cbfb588e87252b597554d798d80a2966bdd02944466cb56"
  },
  "originalSourceHashes": {
    "backend/pkg/permissionroutes/registry.go": "0c07c2a03dabbe924c22d246b7623a4f96b74d208f3b9b311a1dfb86fd5299c1",
    "backend/pkg/permissionroutes/registry_test.go": "7aee0c318ad365288e950f3df2da303bdc0b3653fc4e6bf2ca453b5a07a843e5"
  },
  "helperReview": {
    "decision": "APPROVE",
    "architecturalStatus": "CLEAR",
    "scope": "Pinned task build subprocess only",
    "path": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs",
    "sha256": "db6164260bffb69761631b9d03aa95c3cf6dce2c4acd28adad7c5ff2cf99da88",
    "installedViteSHA256": "5d40302b2d86ff8f3501df6503a69908dce2c2eab4ce03c154cd8745c0bec5f2",
    "runnerSHA256": "ae0492b3eb7af53f977b346fec9de76b4daa6b43765e8288b77ceb12baebaaf4",
    "independentVMChecksPassed": 11,
    "runtimePreloadApproved": false
  },
  "performedChecks": {
    "currentFrozenOriginalHashes": "PASS",
    "productionDeltaOneUnderscore": "PASS",
    "testChangesAdditionOnly": "PASS",
    "receiptAndRawLogHashes": "PASS",
    "greenLogRecount": {
      "topLevelPassed": 6,
      "subtestsPassed": 12,
      "failed": 0,
      "skipped": 0
    },
    "frontendCapturedCurrentFilesVerified": 461,
    "nodeVMChecks": "11/11 PASS",
    "nodeSyntaxCheck": "PASS",
    "gofmtReadonlyCheck": "PASS",
    "finalSourceRehash": "PASS"
  },
  "inspectedChecks": {
    "focusedGoRedRaceExitCode": 1,
    "focusedGoGreenRaceExitCode": 0,
    "focusedGoVetExitCode": 0,
    "focusedGoBuildExitCode": 0,
    "frontendOriginalBuildExitCode": 1,
    "frontendFallbackBuildExitCode": 0,
    "commandsRerunByThisLane": false
  },
  "evidencePins": {
    "repairDiffSHA256": "b952b1544518cc7b5b37263e58a9360c80d13095ff87de9d08b2b5706a96f3c4",
    "frozenSourceSHA256": "8ec8f6399d83e5b8bd1f671ff3c6906b93f2ca975c7d1d928566f7b0754d9738",
    "redReceiptSHA256": "9362d0cba4534a46276a706f82ed679c9cc2efa9f4fadf69f142cdb599df5f6e",
    "redLogSHA256": "cf7b8d86b3b5fc92cb5b8bd40c546e760565ea0f3b953c81216a9bc7bcba68f3",
    "greenReceiptSHA256": "e826c68fa11cc97866c4ba15a94486d9f59a2e59879c2e1f6633a7ab651e50de",
    "greenLogSHA256": "5eb8a59b08cacc1a9a89389c69eb7a422ef0edbb600c614bb912fb91de9632e1",
    "vetReceiptSHA256": "01d5d0a9aee90080dc7617d5cf49ea81dbc3008d44acc9d6e3c1d07e9fbe0c1d",
    "buildReceiptSHA256": "911872f8e0ac553021fe4a3bf8ea537254c5b233a1bcc58ba1efea5fde8e448f",
    "emptyVetBuildLogSHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "frontendOriginalReceiptSHA256": "d1d9465588dec68fafbf4dd59cd3408bad43ce83d3a6da1e46d094821a51e976",
    "frontendOriginalLogSHA256": "f7fffc2589b00cf6cd2f13d9df1a7a08d015be4d4b1b96e4d870ed8b0be1df59",
    "frontendFallbackReceiptSHA256": "924059deaea6557cdab839dd588bd0825a96dc3595ce21a1d1320c3331fa7ceb",
    "frontendFallbackLogSHA256": "28b216ba869b981af2d53731f464f10d8d4eeedc5912a7260b434eafa5585598",
    "frontendBeforeAfterSnapshotSHA256": "45571fce0c811135a3841d37304bc9ab5235e21275d60abaa5f2f92e7484235d"
  },
  "approvalScope": "Exact two-file compatibility repair and separately pinned task build helper",
  "candidateIntegrationApproved": false,
  "runtimeAcceptance": false,
  "releaseApproved": false,
  "P0Approved": false,
  "remainingGates": [
    "Full-current Base race, vet and build",
    "New candidate integration",
    "Downstream Ops registration and role-policy verification",
    "Runtime and release acceptance"
  ],
  "filesWritten": 0,
  "remoteActions": 0
}
```
