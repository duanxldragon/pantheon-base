# Review — 2026-09-10-i18n-s3649-zero

## Scope confirmation

- Touched: `backend/modules/system/i18n/i18n_service.go` — one GORM call
  shape change (map payload → struct payload) inside `Update`.
- Not touched: i18n API/DTO contracts, cache invalidation, validation,
  menus, permissions, any other module.

## Risk classification

Low: single-statement equivalent rewrite.

- `Select("value", "remark")` pins the column set; the struct form writes
  exactly those two columns with the same validated values.
- Struct form actually strengthens safety: column names derive from the
  model's GORM tags at compile time instead of a runtime map literal.
- i18n package tests pass; update flow covered by `ReloadCache()`
  unchanged.

## Gate honesty

- No `nosec`, no Sonar ignore markers — source-level fix only.

## Residual risks

- If the analyzer still reports S3649 on the struct form (not expected —
  it is the rule's documented compliant pattern), follow-up would be to
  route the write through a dedicated repository method with a fully
  parameterized `UpdateColumns` call. Not a suppression.
