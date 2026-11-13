# Root capture of actual independent ARCH v2 helper review

Actual `/root/post_config_review_arch` final at 2026-11-11T04:55:25Z; returned by a read-only lane. Findings and machine block captured below. Original helper remains blocked.

No blocking architectural findings. **APPROVE / CLEAR** for the four pinned task-local files. The original helper remains blocked; this verdict covers the v2 successor only.

The successor resolves the predecessor’s fundamental defect: replacing `exec` with a plain function discarded its custom promisify contract. The v2 Proxy changes only invocation handling, leaving property access and descriptors attached to the original callable. Its normal invocation forwards the receiver and complete argument list through `Reflect.apply`.

The interception boundary remains narrow: exact command `net use`, synchronous `EPERM`, strictly true `windowsHide`, and a callable third argument. It preserves discriminator short-circuiting, queues the original exception with empty outputs, and returns an unspawned child. Other tested failures preserve their original thrown values.

Run the pinned build lane after the required CODE approval and retain its source/dependency stability receipt. **The actual build gate remains pending.** This review grants tooling clearance; runtime, candidate, release and P0 acceptance remain outside its scope.

Actual returned machine block, verbatim:

```json
{
  "subject": "Vite-net-use-fallback-v2",
  "lane": "ARCH",
  "decision": "APPROVE",
  "architecturalStatus": "CLEAR",
  "independent": true,
  "reviewedUTC": "2026-11-11T04:55:25Z",
  "reportPath": "pantheon-base/.local/continuation-20261111-gates/vite-net-use-fallback-v2-evidence-e8914ee42300/review-arch-20261111T045525Z.md",
  "reportWrittenByLane": false,
  "scope": "Exact four task-local v2 files; task build subprocess tooling only",
  "findings": [],
  "sourceHashes": {
    ".local/continuation-20261111-gates/vite-net-use-fallback-v2.cjs": "a75f801805611a559c2c945e539005d9ee9c594c29a07de51d50fbe3bfca6da9",
    ".local/continuation-20261111-gates/verify-vite-net-use-fallback-v2.cjs": "c4b7cb997633ee4b2e8e63c1da342d12bff32b2d2bfdedccf5de3ecb547a4ddf",
    ".local/continuation-20261111-gates/check-vite-net-use-fallback-v2.cjs": "010456a539a26dc43e6fdba31c0a0fea591efafda1311fe85c9d4f960e1c216f",
    ".local/continuation-20261111-gates/run-vite-net-use-fallback-v2.py": "3854d0aa45a0385116e6f10dc962222d99fbe54f24dce29e72acec7766b58563"
  },
  "sourceStable": true,
  "originalHelper": {
    "sha256": "db6164260bffb69761631b9d03aa95c3cf6dce2c4acd28adad7c5ff2cf99da88",
    "unchanged": true,
    "decisionRemains": "REQUEST_CHANGES",
    "architecturalStatusRemains": "BLOCK",
    "historicalEvidencePreserved": true
  },
  "performedChecks": {
    "contractVerifier": {
      "exitCode": 0,
      "passed": 29,
      "failed": 0,
      "spawnAttempts": 0,
      "replacementCommands": 0,
      "nativePropertiesAndCustomPromisifier": "PASS",
      "promiseOutputsChildAndRejection": "PASS",
      "callbackAndNarrowBoundary": "PASS",
      "installedVitePrimaryAsyncAndSyncFailure": "PASS"
    },
    "actualCheckJS": {
      "exitCode": 0,
      "typescriptVersion": "6.0.3",
      "nodeTypesVersion": "26.6.6",
      "syntacticDiagnostics": 0,
      "semanticDiagnostics": 0,
      "compilerOptionDiagnostics": 0,
      "emittedFiles": 0
    },
    "equivalentScopedNodeProbe": {
      "passed": true,
      "customPromisifierAndESM": "PASS",
      "parentEnvironmentUnchanged": true,
      "execCommandsCalled": 0,
      "evidenceWritingWrapperInvoked": false
    },
    "currentAndFrozenFourSources": "PASS",
    "preservedLegacyFilesVerified": 47,
    "ownedAndDependencyPinsVerified": 10,
    "frontendCurrentSnapshotFilesVerified": 461,
    "pythonAST": "PASS",
    "finalRehash": "PASS"
  },
  "inspectedChecks": {
    "predecessorContract": {
      "exitCode": 1,
      "passed": 24,
      "failed": 5
    },
    "predecessorCheckJSDiagnostics": [2741, 2339, 2345],
    "authorV2ContractAndCheckJS": "Authenticated",
    "authorWritingWrapperProbe": "Authenticated",
    "actualFullBuild": "Pending"
  },
  "evidencePins": {
    "authorReportSHA256": "3c44c0b11a8776815a7ebff9435ff6b20afe043bcf38323df42fe7adc4766b9e",
    "frozenSourceSHA256": "707cd59be06010cb17d22ff43cdc59e2c58be71c59c6be24ed200dea8f8277fc",
    "verificationSummarySHA256": "e6ce5ddb68243d1c97168216c809e2c5f14d8eab0955f93bf26631f793fb1797",
    "preservedBeforeSHA256": "c890e57e91cfce908d122f4b3f1cec4e989b5ad286e07c52b3156da844d19da3",
    "redContractLogSHA256": "066792bea587507ec1548ef2872f882a54b1ea7e4129f0c07a9e81fc63c6d00a",
    "greenContractLogSHA256": "3ddc76b7031af7e5fb38b303ed4245e2fbdaca5a7eb1fe11fb25e7aac140c48a",
    "redCheckJSLogSHA256": "478085b45ec4f5f428cc7cb433143bb3d6e067055726e2d997277cf90a02b053",
    "greenCheckJSLogSHA256": "abbdea17d3c616f354821d1c2897ed02e046df28d846b22bc52ccb0dc0f6d2b1",
    "scopedProbeReceiptSHA256": "d18b4c1b666e2b6a7c8dd854eda7100c95748766ccc23809ce82d01927a7143f",
    "scopedProbeLogSHA256": "fd7898ad5d4c6b2812959670db5493705ca69c980921439d6e516d73731fa6ee",
    "frontendBeforeAfterSnapshotSHA256": "45571fce0c811135a3841d37304bc9ab5235e21275d60abaa5f2f92e7484235d",
    "installedViteChunkSHA256": "5d40302b2d86ff8f3501df6503a69908dce2c2eab4ce03c154cd8745c0bec5f2",
    "installedViteFunctionSHA256": "f5ca7b581e0518f6a27f276ad2058443504927315395e5b65e09e8ccd9fec4c7"
  },
  "toolingOnly": true,
  "buildGateAccepted": false,
  "candidateIntegrationApproved": false,
  "runtimeAcceptance": false,
  "releaseApproved": false,
  "P0Approved": false,
  "filesWritten": 0,
  "remoteActions": 0
}
```
