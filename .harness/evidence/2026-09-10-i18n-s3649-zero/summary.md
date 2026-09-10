# Verification Summary — 2026-09-10-i18n-s3649-zero

## Task

After #305, the Release Gate on `main@2d88ecf7` fails on exactly one job:
**SonarCloud Gate** — "Release blocked: **1** unresolved SonarCloud
issue(s)" (Candidate Checks / new-code gate already passes).

The single remaining issue: **gosecurity:S3649 BLOCKER** at
`backend/modules/system/i18n/i18n_service.go:200` — "Change this code to
not construct SQL queries directly from user-controlled data."

## Root cause

The #304 fix replaced the tainted `First(pk)` lookup with
`Where("id = ?", id)` but kept the **map-values form** of GORM
`Updates()`:

```go
s.db.Model(&t).Select("value", "remark").Updates(map[string]interface{}{
    "value": req.Value, "remark": req.Remark,
})
```

Sonar's Go analyzer tracks map values as an unparameterized query
fragment source regardless of the `Select()` scoping — the map form is
the sink.

## Fix

Convert the payload to the **model-struct form**, the
analyzer-recognized safe pattern (column names come from the model, not
from a runtime map):

```go
s.db.Model(&t).Select("value", "remark").Updates(SystemI18n{
    Value: req.Value, Remark: req.Remark,
})
```

Identical columns written with identical values; zero-zero values are
irrelevant because both fields are validated non-empty and `Select`
pins the column set anyway.

## Verification evidence

- `go build ./... && go vet ./modules/...` — clean
- `go test ./modules/...` — **19/19 packages ok**; `gofmt -l` no output

## Residual gaps

- SonarCloud zero-total confirmation lands with the next main analysis
  after merge.
