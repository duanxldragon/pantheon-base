# Pre-migration 400 body captures (2026-10-28)

Packet runtime-evidence item: diff the pre-change 400 body for at least role, tenant, dict and dept.
All four captured BEFORE any replacement; every probe method is parse-first (fails before any service access), engines built with nil services.

| Module | Probe endpoint | HTTP | Body |
|--------|----------------|------|------|
| role | `GET /roles/abc/members` (GetRoleMembers) | 200 | `{"code":400,"data":null,"message":"param.invalid"}` |
| dict | `DELETE /dict/types/abc` (DeleteDictType) | 200 | `{"code":400,"data":null,"message":"param.invalid"}` |
| dept | `GET /depts/abc/leader-candidates` (GetDeptLeaderCandidates) | 200 | `{"code":400,"data":null,"message":"param.invalid"}` |
| tenant | `GET /api/v1/system/tenant/abc` — existing merged test `TestPlatformTenantHandlerErrorEnvelopeIsUnifiedAndLeakFree` | 200 | `{"code":400,"data":null,"message":"param.invalid"}` |

All four bodies are identical and are exactly what `common.ParseUintParam` writes (`common.Fail(c, common.CodeParamInvalid, common.ErrParamInvalid)`; `ErrParamInvalid` = `"param.invalid"`, the same value as every module-local `errParamInvalid`/`msgParamInvalid` const). 
Temporary probe files (zz_capture_test.go ×3) deleted after capture.
