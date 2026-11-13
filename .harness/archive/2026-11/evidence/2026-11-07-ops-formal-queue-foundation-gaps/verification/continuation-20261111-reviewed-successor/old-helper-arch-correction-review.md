# Actual independent ARCH supplemental result

Root capture from `/root/post_config_review_arch`, 2026-11-11T04:45:43Z; native read-only lane returned this correction. Original report preserved.

Supplemental ARCH note: **Base remains APPROVE / CLEAR. The original Vite helper is now REQUEST CHANGES / BLOCK.** Preserve the earlier report and build evidence as historical; this note withdraws its helper clearance.

My earlier checks covered callback delegation and Vite’s failure branch but missed the ordinary Promise API. Replacing `exec` at helper line 10 drops its custom promisify property. I independently reproduced CODE’s result: the original resolves `{stdout, stderr}` and exposes `.child`; the wrapper resolves only `stdout` and loses `.child`, despite delegating the command exactly once. The reproduction used mocks and wrote no files.

The successor must preserve ordinary callback and Promise behavior, including result shape and `.child`, and narrow the error without diagnostic suppression. Fresh contract checks and a task build are required before helper approval. Its narrow interception predicate does not remove the obligation to preserve the process-wide API it replaces.

Actual returned machine block, verbatim:

```json
{
  "subject": "Base-legacy-permission-tail-v1",
  "lane": "ARCH",
  "decision": "APPROVE",
  "architecturalStatus": "CLEAR",
  "independent": true,
  "supplement": "Original helper scope correction",
  "reviewedUTC": "2026-11-11T04:45:43Z",
  "reportPath": "pantheon-base/.local/base-permission-legacy-key-20261111/review-arch-helper-supplement-20261111T044543Z.md",
  "preserveOriginalReport": true,
  "baseDecisionUnchanged": true,
  "sourceHashes": {
    "backend/pkg/permissionroutes/registry.go": "18d5714e63a0a3630de2e8649000a9bbcfb9634c03b991238388b6c8b7b262fb",
    "backend/pkg/permissionroutes/registry_test.go": "a966a5922fbca3f86cbfb588e87252b597554d798d80a2966bdd02944466cb56"
  },
  "helperReview": {
    "decision": "REQUEST_CHANGES",
    "architecturalStatus": "BLOCK",
    "path": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs",
    "sha256": "db6164260bffb69761631b9d03aa95c3cf6dce2c4acd28adad7c5ff2cf99da88",
    "earlierHelperClearanceWithdrawn": true,
    "originalBuildEvidenceRetainedHistorical": true,
    "findings": [
      {
        "severity": "MEDIUM",
        "line": 10,
        "issue": "Wrapper loses custom promisify result shape and promise child handle for ordinary delegated commands",
        "independentlyReproduced": true
      },
      {
        "severity": "MEDIUM",
        "lines": [10, 14, 19],
        "issue": "TypeScript 6.0.3 checkJS reports TS2741, TS2339 and TS2345",
        "independentlyConfirmed": true
      }
    ],
    "successorApproval": "Pending fresh review"
  },
  "performedChecks": {
    "nativeExecCustomPromisifyProperty": "CONFIRMED",
    "readonlyMockPromiseRegression": "REPRODUCED",
    "delegatedAttempts": 1,
    "readonlyLanguageServiceDiagnostics": {
      "version": "6.0.3",
      "syntactic": 0,
      "semantic": 3,
      "options": 0,
      "codes": [2741, 2339, 2345]
    },
    "originalHelperHashStable": true,
    "baseSourceHashesStable": true
  },
  "evidencePins": {
    "codeReportSHA256": "20be08b385f376f85be605d4f1f7fad02b285c70ee44c37d89a0c36293be34c2",
    "codeReproducerSHA256": "bc897887ef5cec809e1244d43b34f20db093e0d3b9ca2c147214a0b56fdb836c",
    "codeReproductionReceiptSHA256": "77546fa64e5605273c95b267d7d054f2f20aea64e55744d10675d0d3e38ecd29",
    "codeDiagnosticScriptSHA256": "a5b6b5a19ae4f4a638e79d1e025c29b903e68600a9b90832d7e032ecd4a48d15",
    "codeDiagnosticReceiptSHA256": "329605a90ec4dc54e47229e18182e7c11a5c4d1b171974da938c1337c9b2626c"
  },
  "candidateIntegrationApproved": false,
  "runtimeAcceptance": false,
  "releaseApproved": false,
  "P0Approved": false,
  "filesWritten": 0,
  "commandsExecutedByMocks": 0,
  "remoteActions": 0
}
```
