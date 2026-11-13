APPROVE the exact two-file Base legacy permission-tail repair: no CODE/spec/security findings. Separately, REQUEST CHANGES for the task-only Vite helper. These decisions are independent; P0 remains false.

The Base production repair is exactly one underscore inserted in registry.go:27. It accepts business:observability:metric_source:view without normalization while leaving domain/module, permission-prefix, method and route boundaries unchanged. The preserved RED test demonstrates the original rejection. Independent race tests pass six top-level tests and twelve subtests, both native gopls file checks are clean, and gofmt reports no paths. Current sources match preserved source copies and remain unchanged during review. Author vet/build receipts were authenticated and inspected, not represented as independently rerun.

[MEDIUM] .local/continuation-20261111-gates/vite-net-use-fallback.cjs:10 replaces Node exec without preserving its custom promisify behavior. A controlled ordinary-command reproduction changes {stdout, stderr} into a stdout string and loses the promise's child handle. Preserve the original property/custom-promisify contract and add that primary-path regression.

[MEDIUM] .local/continuation-20261111-gates/vite-net-use-fallback.cjs:14 and :19 use an un-narrowed caught value for error.code and the execution-error callback. TypeScript6.0.3 language-service diagnostics report TS2339 and TS2345; TS2741 at :10 corroborates the missing exec contract. Narrow and document the error shape, preserving original error identity and the exact fallback boundary, and clear diagnostics without suppression.

The helper's thirteen callback/ESM/negative-path checks pass, and its compatibility callback preserves the original synchronous EPERM evidence. Authenticated historical build logs show a failing ordinary build and a passing helper build, but those do not repair the lost primary promise API. No helper approval or final build-gate acceptance is granted. No sources, dependencies, plans, sealed snapshots, release/lock/candidates or .harness artifacts were modified by this reviewer.

Performed checks and inspected author checks, exact source pins, independent reproduction, source stability and remaining gaps are recorded below.

```json
{
  "subject": "Base-legacy-permission-tail-v1",
  "lane": "CODE",
  "decision": "APPROVE",
  "independent": true,
  "reviewedUTC": "2026-11-11T04:43:04.666265+00:00",
  "scope": "Exact two-file legacy permission-tail compatibility repair only",
  "sourceHashes": {
    "backend/pkg/permissionroutes/registry.go": "18d5714e63a0a3630de2e8649000a9bbcfb9634c03b991238388b6c8b7b262fb",
    "backend/pkg/permissionroutes/registry_test.go": "a966a5922fbca3f86cbfb588e87252b597554d798d80a2966bdd02944466cb56"
  },
  "sourceStable": true,
  "filesReviewed": 2,
  "issues": [],
  "severityCounts": {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0
  },
  "specCompliance": "PASS: exact existing underscore key accepted; strict business module/domain, prefix, method and path guards preserved; no normalized alias or role grant added",
  "rootCauseGuard": "PASS: one-character repair to the controllable primary validation contract; preserved RED evidence rejects the actual legacy key before the fix",
  "performedChecks": {
    "evidenceAuthentication": "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\.local\\post-config-reviews\\base-legacy-code-mwbmqu80\\authenticated-evidence.json",
    "nativeGoChecks": [
      {
        "name": "race",
        "command": [
          "D:/Go/bin/go.exe",
          "test",
          "-mod=readonly",
          "-race",
          "-p",
          "1",
          "-count=1",
          "-json",
          "./pkg/permissionroutes"
        ],
        "exitCode": 0,
        "elapsedSeconds": 2.562,
        "logSHA256": "3b98912beadceec5660e5dc8409d862bf2282361f232856ea105b25161fa9e3f",
        "sourceStable": true,
        "topLevelPassed": 6,
        "subtestsPassed": 12,
        "failed": [],
        "skipped": []
      },
      {
        "name": "gopls-registry",
        "command": [
          "D:/Go/bin/gopls.exe",
          "check",
          "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\backend\\pkg\\permissionroutes\\registry.go"
        ],
        "exitCode": 0,
        "elapsedSeconds": 3.063,
        "logSHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "sourceStable": true,
        "diagnosticLines": []
      },
      {
        "name": "gopls-test",
        "command": [
          "D:/Go/bin/gopls.exe",
          "check",
          "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\backend\\pkg\\permissionroutes\\registry_test.go"
        ],
        "exitCode": 0,
        "elapsedSeconds": 5.765,
        "logSHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "sourceStable": true,
        "diagnosticLines": []
      },
      {
        "name": "gofmt",
        "command": [
          "D:/Go/bin/gofmt.exe",
          "-l",
          "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\backend\\pkg\\permissionroutes\\registry.go",
          "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\backend\\pkg\\permissionroutes\\registry_test.go"
        ],
        "exitCode": 0,
        "elapsedSeconds": 0.031,
        "logSHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "sourceStable": true,
        "diagnosticLines": []
      }
    ],
    "manualReview": [
      "git diff and authenticated pre-repair/current bytes; exact production underscore insertion",
      "entire registry and tests: authorization boundaries, batch atomicity, copying, locking, idempotence and unchanged method/path validation",
      "unchanged exact keys and no synthetic normalized registration/grant",
      "fallback/security-pattern source inspection; no masking alternate path introduced by Base fix"
    ]
  },
  "inspectedChecks": [
    "Author RED command/log at original registry hash: actual metric_source spelling fails, both hyphen cases pass",
    "Author GREEN -race package test:6 top-level and12 subtests pass",
    "Author go vet -mod=readonly -p1 package receipt/log:exit0",
    "Author go build -mod=readonly -p1 package receipt/log:exit0",
    "Historical frontend failure/pass build logs and two461-file hash manifests authenticated"
  ],
  "diagnostics": {
    "tool": "gopls v0.23.0 check",
    "files": [
      "backend/pkg/permissionroutes/registry.go",
      "backend/pkg/permissionroutes/registry_test.go"
    ],
    "errors": 0,
    "warnings": 0,
    "logs": ["gopls-registry.log", "gopls-test.log"],
    "toolLimitations": "MCP lsp_diagnostics, ast_grep_search and CodeGraph tools unavailable; native gopls supplied diagnostics and full source inspection supplied pattern/security review"
  },
  "separateHelperReview": {
    "subject": "task-only-Vite-net-use-preload",
    "decision": "REQUEST_CHANGES",
    "helperPath": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs",
    "helperHash": "db6164260bffb69761631b9d03aa95c3cf6dce2c4acd28adad7c5ff2cf99da88",
    "viteVersion": "8.3.5",
    "viteDependencyHash": "5d40302b2d86ff8f3501df6503a69908dce2c2eab4ce03c154cd8745c0bec5f2",
    "sourceStable": true,
    "scope": "Exact task-local helper only; historical passing build is inspected evidence and is not final gate acceptance",
    "issues": [
      {
        "severity": "MEDIUM",
        "file": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs",
        "line": 10,
        "issue": "Replacing exec drops its custom promisify contract even for ordinary delegated commands: result becomes stdout string instead of stdout/stderr object and returned promise loses child handle.",
        "evidence": "helper-promisify-reproduction.json: builtin/custom exec has custom symbol and child; wrapper has neither; primary attempt still runs exactly once",
        "fix": "Preserve the original exec custom promisify/property contract when wrapping it, synchronize ESM afterward, and add a regression proving ordinary promise API result and child handle alongside callback behavior."
      },
      {
        "severity": "MEDIUM",
        "file": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs",
        "line": 14,
        "relatedLines": [19],
        "issue": "checkJs semantic diagnostics also reject reading code from the un-narrowed caught value (TS2339) and passing that value to ExecException callback (TS2345). TS2741 at line10 confirms the separate lost exec contract.",
        "evidence": "helper-diagnostics.json: TypeScript6.0.3 language service;0 syntactic,3 semantic,0 compiler-option diagnostics",
        "fix": "Narrow/document the caught Node execution-error shape before inspecting code and invoking the callback, keeping the original error identity and the exact EPERM boundary; clear the three diagnostics without suppression or broadening fallback."
      }
    ],
    "performedChecks": {
      "callbackContracts": {
        "helper": "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\.local\\continuation-20261111-gates\\vite-net-use-fallback.cjs",
        "helperHash": "db6164260bffb69761631b9d03aa95c3cf6dce2c4acd28adad7c5ff2cf99da88",
        "sourceStable": true,
        "checks": [
          {
            "name": "builtin ESM export synchronized",
            "passed": true
          },
          {
            "name": "ordinary delegation preserves receiver arguments and return",
            "passed": true
          },
          {
            "name": "primary asynchronous success remains delegated",
            "passed": true
          },
          {
            "name": "primary asynchronous failure remains delegated",
            "passed": true
          },
          {
            "name": "matching synchronous EPERM reaches existing callback once asynchronously",
            "passed": true
          },
          {
            "name": "rethrows different command",
            "passed": true
          },
          {
            "name": "rethrows different error",
            "passed": true
          },
          {
            "name": "rethrows visible window",
            "passed": true
          },
          {
            "name": "rethrows window option missing",
            "passed": true
          },
          {
            "name": "rethrows options omitted",
            "passed": true
          },
          {
            "name": "rethrows callback missing",
            "passed": true
          },
          {
            "name": "rethrows case variant",
            "passed": true
          },
          {
            "name": "rethrows non-code error",
            "passed": true
          }
        ],
        "totalPassed": 13,
        "fallbackEvidence": "Vite optional net use: synchronous EPERM delivered to its existing failure callback.\n",
        "alternateCommands": 0,
        "P0Approved": false
      },
      "languageServiceDiagnostics": {
        "engine": "TypeScript language service",
        "version": "6.0.3",
        "file": "D:\\workspace\\go\\pantheon-platform\\pantheon-base\\.local\\continuation-20261111-gates\\vite-net-use-fallback.cjs",
        "syntactic": [],
        "semantic": [
          {
            "file": "D:/workspace/go/pantheon-platform/pantheon-base/.local/continuation-20261111-gates/vite-net-use-fallback.cjs",
            "line": 10,
            "column": 1,
            "code": 2741,
            "category": "Error",
            "message": "Property '__promisify__' is missing in type '(command: string, options: ExecOptionsWithBufferEncoding | ExecOptions | ExecOptionsWithStringEncoding | null | undefined, callback: ((error: ExecException | null, stdout: NonSharedBuffer, stderr: NonSharedBuffer) => void) | ... 2 more ... | undefined) => any' but required in type 'typeof exec'."
          },
          {
            "file": "D:/workspace/go/pantheon-platform/pantheon-base/.local/continuation-20261111-gates/vite-net-use-fallback.cjs",
            "line": 14,
            "column": 41,
            "code": 2339,
            "category": "Error",
            "message": "Property 'code' does not exist on type '{}'."
          },
          {
            "file": "D:/workspace/go/pantheon-platform/pantheon-base/.local/continuation-20261111-gates/vite-net-use-fallback.cjs",
            "line": 19,
            "column": 35,
            "code": 2345,
            "category": "Error",
            "message": "Argument of type '{}' is not assignable to parameter of type 'ExecException'.\n  Type '{}' is missing the following properties from type 'ExecException': cmd, name, message"
          }
        ],
        "options": []
      },
      "promisifyReproduction": {
        "reproduced": true,
        "builtinExecHasCustomPromisify": true,
        "before": {
          "hasCustom": true,
          "hasChild": true
        },
        "after": {
          "hasCustom": false,
          "hasChild": false
        },
        "baselineResult": {
          "stdout": "stdout",
          "stderr": "stderr"
        },
        "actualResult": "stdout",
        "callbackAttempts": 1,
        "defect": "wrapper loses custom promisify behavior for ordinary commands",
        "affectedSource": ".local/continuation-20261111-gates/vite-net-use-fallback.cjs:10",
        "sourceEdited": false,
        "P0Approved": false
      }
    },
    "inspectedChecks": [
      "Vite dependency lines2477-2501: exact optional hidden net use callback returns on error; no returned child handle consumed",
      "Historical build without helper:exit1,externalize-deps spawn EPERM at Vite optional lookup",
      "Historical build with exact helper:exit0; explicit synchronous EPERM callback evidence logged; unchanged source/helper/dependency hashes"
    ],
    "rootCausePolicy": "The narrow callback adapter is acceptable only at the pinned Windows/Vite optional network-drive lookup boundary, with visible original failure evidence and tested primary/compatibility behavior. Current ordinary exec contract loss and diagnostics prevent approval.",
    "stopCondition": "Successor helper preserving callback and promise contracts, clean diagnostics and a new build receipt require fresh review; do not infer approval from historical build."
  },
  "remainingGaps": [
    "Broader candidate integration, downstream Ops verification and runtime acceptance are not certified by this focused review",
    "Current helper must be repaired/reviewed before its build can serve as a final gate"
  ],
  "P0Approved": false,
  "runtimeAcceptance": false,
  "stopCondition": "Two-file Base source verdict complete at exact pins; helper separately requires changes"
}
```
