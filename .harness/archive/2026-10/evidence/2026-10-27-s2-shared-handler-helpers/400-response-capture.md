# Captured 400 replacement target (2026-10-28)

- Handler: mounted platform tenant handler, `GET /api/v1/system/tenant/abc` (bad path id), engine built by `newPlatformTenantEngine(NewService(nil))` — DB-free bad-id path.
- Captured via a temporary `go test -v` t.Logf probe (`TestZZCapture400BodyForS2Evidence`), deleted after capture.

```
CAPTURED_HTTP_STATUS=200
CAPTURED_400_BODY={"code":400,"data":null,"message":"param.invalid"}
```

- Repo envelope convention: HTTP 200 carries the business code (400) inside the JSON envelope.
- `common.ParseUintParam` writes `common.Fail(c, common.CodeParamInvalid, common.ErrParamInvalid)` — literally the same call the inline blocks make, so the envelope is byte-identical; `pkg/common/handler_test.go` asserts the same fields (code 400, message param.invalid, data null).
