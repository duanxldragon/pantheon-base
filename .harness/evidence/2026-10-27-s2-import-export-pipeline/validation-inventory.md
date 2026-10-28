# Validation Inventory — S2-import-export-pipeline

Wave: 2026-10-27-s2-import-export-pipeline (RC-016)
Rule: every pre-existing validation must be accounted for before and after conversion. Any unaccounted validation stops the wave.

## 0. Premise-vs-reality deltas in the packet

| Packet premise | Reality on base@04aa64b1..main | Decision |
| --- | --- | --- |
| "validate extension and size" (8 handlers) | **No extension or MIME check exists in any of the eight import handlers.** The only file-level gates are the 10 MB byte cap and the 5000-row cap inside `impexp.ReadCSV` (csv.go:91-108). A wrong-extension file that happens to parse as CSV succeeds; one that does not parse fails with `import.file.invalid_csv`. | The pipeline must NOT invent an extension check — scope-out forbids changing allowed types, and adding one would change observable behaviour (a `.txt` file with valid CSV would start failing). Recorded as intentional keep-out. |
| "audit_handler.go:482-518 in login_handler.go" import copy | Audit and login handlers are **export-only** (`impexp.WriteCSV` at audit_handler.go:142 and login_handler.go:480/498/516). They have no `c.FormFile` receive path. | They are not part of the receive pipeline conversion; they consume the already-shared export half. |
| "eight module copies" | Exactly **8 import endpoints in 7 files**: dept, post, role, user, dict-type, dict-item, permission, i18n. | Confirmed count. |
| "six template builders" | `BuildDeptImportTemplate`, `BuildPostImportTemplate`, `BuildRoleImportTemplate`, `BuildUserImportTemplate`, `BuildDictTypeImportTemplate`, `BuildDictItemImportTemplate` = **6**; permission and i18n build templates in `permission_service.go` / `i18n_export.go` (grep found `BuildImportTemplate` on service, same pattern). | Converted with the same column-driven builder; exact content locked by golden tests. |
| "size caps or allowed types must not change" | Caps: `maxImportBytes = 10 << 20`, `maxImportRows = 5000` (csv.go), `maxExportRows = 10000` (export_limits.go) + per-module `maxRoleExportRows = 10000` var. | Untouched. |

## 1. Receive path — before (identical in all 8 handlers)

| # | Check / behaviour | Where today |
| --- | --- | --- |
| R1 | multipart field name is exactly `file` | each handler `c.FormFile("file")` |
| R2 | missing file → `common.Fail(CodeParamInvalid, "import.file.required")` | each handler |
| R3 | open failure → `common.Fail(CodeError, "import.file.read.error")` | each handler |
| R4 | multipart part closed via explicit `defer file.Close()` (belt-and-braces on top of ReadCSV's own close) | each handler |
| R5 | parse failure / oversized / too many rows → `common.Fail(CodeParamInvalid, "import.file.invalid_csv")` (cap errors are folded into this envelope key) | each handler |
| R6 | 10 MB byte cap (`maxImportBytes`), BOM trim, RFC4180 parse, 5000 data-row cap (`maxImportRows`) | `pkg/impexp/csv.go` ReadCSV — already shared, untouched |
| R7 | audit metadata set before receive (`common.SetAuditMetadata(c, "<module>.import.title", common.BusinessImport)`) | each handler — stays local |

**After conversion**: R1-R5 move verbatim into `impexp.ReadImportCSV(c)` (pipeline.go); R6 untouched; R7 stays at the top of each handler.

## 2. Service-side skeleton — before (identical shape in all 8 services)

| # | Check / behaviour | Where today | Variants found |
| --- | --- | --- | --- |
| S1 | `result := &impexp.ImportResult{Applied: false, Errors: []impexp.ImportError{}}` | all 8 entries | none |
| S2 | `s.db == nil` → `return nil, common.ErrDatabaseNotInitialized` | all 8 | none |
| S3 | `len(records) == 0` → `AppendImportError(result, 0, "file", "import.file.empty"); return result, nil` | all 8 | none |
| S4 | header index built from row 0 with per-cell `TrimSpace`, later header wins on duplicate | all 8 | dict:748 & role:165 identical fn; post inlines it; user:139 / dept:79 combine with S5 |
| S5 | required headers missing → `AppendImportError(result, 0, <header>, "import.header.missing")` per missing header | all 8 | required lists differ per module (kept at call site) |
| S6 | gate on `result.Failed > 0` → soft-fail `return result, nil` | all 8 | permission returns via `validate*` err path, same effect |
| S7 | data-row loop starts at index 1, skips `impexp.IsCSVRecordEmpty` rows (blank or first-non-empty-cell-`#`), `rowNumber = rowIndex + 1` | all 8 | permission's `validateImportRows` implements the same skip inline |
| S8 | per-row mapping/validation | module-local (row mapper) | intentionally stays local |
| S9 | apply rows in transaction | module-local | intentionally stays local |
| S10 | success marks `result.Applied = true` | all 8 | **i18n variant**: `Applied = result.Created > 0 || result.Updated > 0` — kept |
| S11 | `deptImportRollbackSentinel` soft-failure contract (dept only): validation failure inside tx rolls back via sentinel | dept_import.go | stays local |

**After conversion**: S1 → `impexp.NewImportResult()`; S4 → `impexp.BuildHeaderIndex(records)`; S5 → `impexp.RequireHeaders(result, headerIndex, required...)`; S7 → `impexp.ForEachDataRow(records, fn)`. S2/S3/S6/S8/S9/S10/S11 stay in the module services (they are short, load-bearing, or module-specific).

## 3. Export path — before

| # | Check / behaviour | Where |
| --- | --- | --- |
| E1 | UTF-8 BOM prefix, header row first, `sanitizeCSVRow` applied to every data row | `pkg/impexp/csv.go` WriteCSV — already shared, untouched |
| E2 | formula-injection neutralisation: leading `= + - @ \t \r` non-numeric cells get a `'` prefix; numeric cells (e.g. `-5`, `+3.14`) pass through unescaped | `sanitizeCSVCell` csv.go:33-46 — untouched by this wave |
| E3 | filename: `Content-Disposition` with quoted + RFC5987-escaped name; empty filename falls back to `export.csv` | csv.go:76-84 — untouched |
| E4 | 10000-row export cap pushed into SQL `LIMIT` | per-module export query (e.g. role_export.go:85) — untouched |

## 4. Authorization

| # | Check | Where |
| --- | --- | --- |
| A1 | route-level permission middleware for every import/template/export endpoint | route registration — untouched by this wave |
| A2 | permission import operator scope check (`validateImportPolicyWriteScope(operatorRoleKeys, rows)`, service) | permission_service.go — untouched; handler keeps passing `common.GetRoleKeys(c)` |
| A3 | user import data-scope resolution | handler passes `common.GetDataScope(c)` where it does today — untouched |

## 5. Templates

| Builder | Filename | Headers |
| --- | --- | --- |
| dept | system-dept-import-template.csv | parentDeptPath, deptName, sort, leader, phone, email, status |
| post | system-post-import-template.csv | (post_service.go:336) |
| role | system-role-import-template.csv | roleName, roleKey, sort, status, menuIds, permissionKeys |
| user | system-user-import-template.csv | username, password, nickname, email, phone, deptPath, postCode, status, roleKeys |
| dict type | system-dict-type-import-template.csv | dictCode, dictName, module, status, remark |
| dict item | system-dict-item-import-template.csv | (dict_service.go:694) |
| permission | (permission_service.go BuildImportTemplate) | |
| i18n | (i18n_export.go BuildImportTemplate) | |

Note row is a single `#说明：…` string in cell 0 padded with empty cells to header length; example row's cell 0 is `#`-prefixed so `IsCSVRecordEmpty` skips it on re-import. After conversion `impexp.BuildImportTemplate(filename, note, columns)` reproduces the rows byte-for-byte; `template_test.go` golden-asserts every header, note row and example row against the pre-conversion literals.

## 6. Conversion order (one module per commit, smoke after each) — AS EXECUTED

1. `feat(impexp)` — pipeline.go (ReadImportCSV, NewImportResult, BuildHeaderIndex, RequireHeaders, ForEachDataRow) + template.go (BuildImportTemplate) + tests, no callers
2. `refactor(dept)` — handler swap; composite buildImportHeaderIndex → BuildHeaderIndex + RequireHeaders; parseImportRows loop → ForEachDataRow; template
3. `refactor(post)` — handler swap; inline header index → shared pair; **row loop kept local**: the skip lives inside `readImportRow` which returns `(row, err)` and hard-fails on lookup errors, a materially different shape from ForEachDataRow (packet rule: do not bend the pipeline)4. `refactor(user)` — handler swap; composite buildUserImportHeaderIndex → shared pair; parseUserImportRows loop → ForEachDataRow; template
5. `refactor(role)` — handler swap; buildImportHeaderIndex + validateRequiredImportHeaders deleted → shared pair; row loop → ForEachDataRow; template
6. `refactor(dict)` — both handlers; both service entries; both parse loops → ForEachDataRow; both templates; local buildImportHeaderIndex + reportMissingImportHeaders deleted
7. `refactor(permission)` — handler swap (keeps `failPermissionServiceError` — the one custom error responder); validateImportHeader composite → shared pair (its internal `NewBadRequest("import.header.missing")` sentinel was discarded by the caller and never observable — dropped); validateImportRows loop → ForEachDataRow keeping the trailing hard-fail; template
8. `refactor(i18n)` — handler swap (keeps `updatedBy` username input and the `Applied = Created>0 || Updated>0` variant); buildI18nImportHeaderIndex + validateI18nImportHeaders deleted → shared pair; buildI18nImportRows loop → ForEachDataRow — the old loop's `|| IsCSVRecordBlank(record)` was dead: all-blank rows already satisfy IsCSVRecordEmpty (its loop falls through to `return true`), so the shared skip is exactly equivalent; template with two unprefixed example rows passed through verbatim

## 7. Additions — AS EXECUTED

- `TestReadImportCSVOversizedFileFailsInvalidCSV`: >10 MB upload is rejected with the same folded `import.file.invalid_csv` envelope the handlers emit today (no new error class).
- `TestReadImportCSVAcceptsNonCSVExtension`: a `.txt` upload with parseable CSV content is **accepted**, locking the reality that no extension check exists (see §0) so the pipeline cannot silently add one.
- `TestWriteCSVFormulaInjectionEscaping`: `=1+1`, `+cmd`, `-label`, `@x`, `\ttab` are `'`-prefixed on export while numeric `-5` passes through — sanitiseCSVCell untouched.
- `TestRoleTemplateShapeMatchesPreExtractionLiteral` + `TestBuildImportTemplatePadsNoteAndKeepsExamples`: golden lock on template shape.

## 8. Where every check lives after conversion (summary)

| Inventory rows | After |
| --- | --- |
| R1–R5 | `impexp.ReadImportCSV` (pipeline.go) — verbatim |
| R6 | pkg/impexp/csv.go — untouched |
| R7 | handler top lines — untouched |
| S1 | `impexp.NewImportResult()` |
| S2, S3, S6, S8, S9, S10, S11 | module services — untouched (short, load-bearing or module-specific) |
| S4 | `impexp.BuildHeaderIndex` |
| S5 | `impexp.RequireHeaders` (required lists stay at call sites) |
| S7 | `impexp.ForEachDataRow` — except post (skip inside readImportRow, see §6.3) |
| E1–E4 | untouched |
| A1–A3 | untouched (route middleware, operator-scope input, data-scope input) |

Net code diff: modules −430/+40, pkg/impexp +118 new (pipeline 96 + template 22), tests +235.
