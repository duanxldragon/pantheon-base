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

## 6. Conversion order (one module per commit, smoke after each)

1. Shared pipeline package (no callers yet) + tests
2. dept → smoke
3. post → smoke
4. user → smoke
5. role → smoke
6. dict (type + item in one commit — same module/service file) → smoke
7. permission (keeps `failPermissionServiceError` and operator-scope input) → smoke
8. i18n (keeps `updatedBy` username input and `Applied` variant) → smoke

Smoke = `cd frontend && cmd /c npm run test:smoke:system:api` against a locally started backend (`.env.test` DSN), per docs/acceptances/SYSTEM_IMPORT_EXPORT_SMOKE_GUIDE.md.

## 7. Additions (packet scope-in)

- New test: oversized file (>10 MB), wrong extension and `=1+1` formula cell behaviour are asserted to match today's semantics (cap → `import.file.invalid_csv` envelope; formula cell escaped on export via `'` prefix and treated as data on import — no extension rejection exists to keep).
