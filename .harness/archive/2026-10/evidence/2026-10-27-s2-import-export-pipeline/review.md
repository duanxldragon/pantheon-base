# Review — S2-import-export-pipeline (RC-016)

Verdict: approved (self-review under maintainer delegation 2026-10-28)

## Review posture (per packet reviewerPosture)

1. **Every pre-existing validation checked against the inventory.** `validation-inventory.md` lists R1–R7 (receive), S1–S11 (service skeleton), E1–E4 (export), A1–A3 (authorization), T (templates) with a before/after home for each (§8). Nothing was dropped; two packet premises that did not exist in code (extension check, audit/login import copies) are documented as keep-outs rather than invented.
2. **CSV formula injection on both sides.** Export: `sanitizeCSVCell` untouched; new test proves `=1+1`, `+cmd`, `-label`, `@x`, `\ttab` get the `'` prefix and numeric `-5` does not (pipeline_test.go TestWriteCSVFormulaInjectionEscaping). Import: formula cells are ordinary data — ReadCSV/csv.go untouched, and the template note/example rows still start with `#` so `IsCSVRecordEmpty` skips them exactly as before (i18n's two unprefixed example rows pass through verbatim — behaviour unchanged from before the wave, since they were unprefixed there too).
3. **Authorization stayed in the handler/routes.** No route registration or middleware file is in the diff (`git diff main --stat` — only handlers/services/pkg/impexp/evidence). Permission keeps `failPermissionServiceError` and passes `common.GetRoleKeys(c)`; user keeps data-scope via its existing svc call.
4. **Smoke checked for converted modules, not just the pipeline package.** Live server on the branch + `npm run test:smoke:system:api` = 11 passed, covering dept/post/permission/dict×2/user import+export round-trips, all templates with comment rows, role/audit/login exports (commands.json step 9, smokePerModule).

## Equivalence notes

- The receive helper reproduces the five receive steps and the three envelope keys verbatim; cap errors still fold into `import.file.invalid_csv` (no new error class).
- `BuildHeaderIndex` preserves the later-duplicate-header-wins behaviour (tested).
- `ForEachDataRow` preserves skip semantics and 1-based row numbering (tested, including comment rows mid-file); the one removed expression (i18n's `|| IsCSVRecordBlank`) was provably dead because `IsCSVRecordEmpty` returns true for all-blank records.
- Permission's dropped BadRequest sentinel was constructed but discarded by the caller (`if err != nil { return result, nil }`) — unobservable.
- Result shape: `NewImportResult` keeps `Applied:false` and a non-nil `Errors` slice so the JSON envelope still serialises `"errors":[]`.
- Templates: golden tests lock headers, note text, padding and example rows for the shape; all eight builders converted with their exact literals.

## Quality profile: i18n (packet harnessProfile)

- All envelope/message keys preserved byte-for-byte (import.file.*, import.header.missing, import.file.empty, import.error.too_many_rows, per-module import errors, dept/permission/i18n row keys). No i18n key added or changed; the wave is user-visible-text-neutral.

## Checks

- [x] One pipeline and one template builder exist (pkg/impexp/pipeline.go, template.go)
- [x] Validation inventory complete with per-row after-homes
- [x] CSV formula injection escaped on export; import behaviour unchanged
- [x] Import/export smoke passes for every converted module (guide's automated API smoke, 11/11)
- [x] One module per commit; wave runs as its own PR (human gate delegated 2026-10-28)
- [x] doNotTouch respected: pkg/impexp/import_helpers.go, pkg/upload/**, migrations, frontend importExport utils — none in diff
- [x] gofmt / build / vet / tests green before each module commit and at wave close
- [x] Runtime evidence captured (login probe 200, smoke 11 passed, server stopped, port released)

## Machine Readable

```json
{
  "taskId": "2026-10-27-s2-import-export-pipeline",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s2-import-export-pipeline/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s2-import-export-pipeline/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s2-import-export-pipeline/review.md",
    "changeRef": "backend/pkg/impexp/pipeline.go",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  },
  "qualityProfile": "i18n",
  "checks": {
    "validationInventoryComplete": "pass",
    "csvFormulaInjectionPreserved": "pass",
    "authorizationInHandler": "pass",
    "perModuleSmokeEvidence": "pass",
    "singleImplementation": "pass",
    "noForbiddenTouch": "pass",
    "testsNotWeakened": "pass",
    "premiseDeltasDocumented": "pass"
  },
  "knownGaps": [
    "i18n import has no API-smoke entry (guide scope predates it); go suite covers the service layer",
    "per-module smoke ran as one serial suite; per-module isolation is the commit ladder",
    "smoke guide §1 role line stale (role import routed at system_modules.go:219; pre-existing drift)"
  ],
  "commits": ["92282b53", "22ee1f3b", "5b2d2132", "e572fc17", "4ca58011", "55ea3552", "5f07dea6", "a2383019", "7edacd7b"]
}
```
