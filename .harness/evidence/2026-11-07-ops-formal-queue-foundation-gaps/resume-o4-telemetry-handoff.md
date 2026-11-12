# O4 telemetry privacy repair — Generator handoff

Date: 2026-11-10. Status: implemented and scoped checks passed; **not self-approved**. Base parent and mandatory O4 remain **OPEN**. This distinct handoff filename must survive the adapter's terse final `codex -o` report.

Parent packet: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`. Plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`, revision4 A/E. Evidence directory: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/`.

## Finding, scope and implementation decision

Independent prerequisite CODE reported HIGH / REQUEST CHANGES and ARCH reported BLOCK for production `main.go:145` OTel capture. Both `resume-o4-prerequisite-independent-{code,arch}.md` files were read; their contents are the overwritten terse summaries. The paired receipts provide no event-file path. Bounded filename searches in Base evidence, Base/workspace `.omx` and `.codex` did not locate those reviewers' event logs. No unobserved review detail is inferred: the concrete telemetry finding was independently reproduced from the installed implementation and actual SDK/OTLP output. The independent candidate-cleanup finding belongs to another lane.

Owner: Base shared middleware/system auth/audit boundary, L2. Implementer: this Generator. Reviewers: original independent CODE and ARCH lanes must rerun against this exact source plus candidate repair. Human/release gate remains with root/maintainer. Minimum evidence: default production RED, actual registered/sealed parameter routes, SDK creation and export inspection, real production OTLP exporter inspection, preserved unmatched defaults, scoped CGO race/vet/build/diagnostics and stable source hashes.

The minimal-complexity decision was to reuse `auditpolicy.Match/Metadata/ActionName/OutcomeName`, the existing server request-context UUID, global OTel provider, recovery and installed SDK/exporter. Installed `otelgin v0.69.0` has filters and additive span options but no way to disable built-in request attributes or `c.Errors` collection. `gin.go` calls `RequestTraceAttrs`, `c.Errors.String()` and `RecordError(err.Err)`; `internal/semconv/server.go` reads path, User-Agent and peer/header-derived address information. Renaming spans or redacting after capture cannot satisfy this boundary. One small opt-in adapter is required. No new dependency/framework or `pkg/telemetry` change was necessary.

## Exact source and APIs

Only these production/test files were changed by this lane:

| File                                                                | SHA256                                                             | Change                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/cmd/server/main.go`                                        | `df1e3ea0d0f89cc1faf2db495e875832df2f280ff4d25be6f919957ed9180998` | Add safe tracing at line142 before body denial; replace line145 with filtered legacy tracing; remove the obsolete direct otelgin import. Existing logger/recovery, context/audit, other middleware, API registration and provider/policy sealing remain. |
| `backend/internal/middleware/business_telemetry_middleware.go`      | `b7b896bedf4e5263005727759ee77c52f09934f7a6e46bb31b5b57f689693170` | New opt-in adapter and legacy filter.                                                                                                                                                                                                                    |
| `backend/internal/middleware/business_telemetry_middleware_test.go` | `11d8295ff2a12fccc32239cd7e9d0d9ab439662264c264fd60ccdf267bb9c6c3` | Real SDK/OTLP hostile matrix, startup sealing and production-order regression.                                                                                                                                                                           |

Additive middleware APIs:

```go
func BusinessTelemetryMiddleware() gin.HandlerFunc              // source line25
func LegacyTelemetryMiddleware(service string) gin.HandlerFunc  // source line90
```

The safe adapter must follow `RequestContextMiddleware` and precede body/CSRF/rate/auth denial. Gin has already selected the exact FullPath before this global middleware runs. It matches the sealed startup policy with method+template, freezes a server context flag, and starts one Server span with registered action, method, route and server-generated request ID. It reads no body, response bytes, URL, headers, User-Agent or error message. Source-authorized numeric metadata comes only from the existing typed audit policy; IDs exceeding signed OTel integer range project to unknown0 rather than overflow. Existing audit validation bounds count/outcome.

Final attributes are exactly method/template/action/request ID, HTTP status, fixed outcome, actor/tenant/datasource/history/view IDs, count and catalog version. Missing typed success stays unknown/error, so business HTTP200 failures remain visible. Only constant `business.request.error` and `business.request.panic` events are emitted, without attributes or exception strings. Panic presence is detected without coercion, HTTP500 is recorded, the span is ended, and the original value is rethrown to existing metadata-aware recovery. Status descriptions are empty.

Adopted traces deliberately start a new server root: client trace IDs, tracestate and inherited/HTTP baggage cannot carry opaque input. Request cancellation, deadlines and server context values are retained. The current server span is available in the handler context and propagates downstream using the existing global propagators. No incoming propagator extraction occurs on adopted routes. The installed provider/exporter is shared with legacy traces; all telemetry is not disabled.

Filtered legacy otelgin remains at its original position after body/CORS and before Prometheus/CSRF. The server-only frozen flag also prevents later request mutation from re-enabling raw capture. Unknown routes, an unadopted route, and the same template with another method retain default OTel capture/remote propagation. Client strategy-looking headers cannot select either branch. Legacy oversized-body denial remains untraced as before.

## Reproduction and fresh verification

`resume-o4-telemetry-red.txt` records exit1 from the real current-production middleware sequence with `otelgin.Middleware("pantheon-base")`, before repair. The suite used the actual SDK recording exporter and actual `telemetry.InitTracer` HTTP exporter, not handcrafted spans. It found sentinel-bearing URL/UA/address attributes, Gin/provider exception/status values, incoming baggage/correlation and OTLP bytes. Oversized-body denial produced no span; only16/17 request spans reached OTLP. The initial RED main hash is `f420438509293437abac5228c343b7d52af0e66b606a8b2ea9a3e14dcc606950`; the pre-repair test hash is in `resume-o4-telemetry-red-test-hash.json`. The test pipeline was then switched to the two repaired production adapters, and strengthened with creation-time and wiring checks.

Final `TestBusinessTelemetryPrivacy` at test line72 runs in a subprocess because the real registry is process-wide/startup-only. It registers actual POST parameter routes on the engines that serve the hostile requests, validates those real route tables and invokes `auditpolicy.Seal` before serving. Late registration is refused. It uses `tracetest.NewInMemoryExporter` with the real SDK, plus snapshots in `SpanProcessor.OnStart`; a capture-then-sanitize implementation cannot pass by hiding initial attributes at export.

All17 adopted cases passed with one safe server span at Start and End: success, raw200/missing outcome, business-code HTTP200 failure, invalid typed metadata, provider, storage, `c.Errors` after success, string panic, error panic, invalid JSON, CSRF, API rate, auth, tenant denial, Content-Length body denial, streamed body-limit/bind failure and canceled context. Early denials have no handler calls/body reads/inferred owner. Success preserves all seven source-authorized numeric fields. The test also verifies route/action/status, empty status text, constant events, no remote parent/links/tracestate, cleared baggage, intact request body, deadline/cancellation and outbound server trace propagation.

Final actual production OTLP output: **17 spans, 10321 protobuf bytes, zero synthetic sentinel matches**, SHA256 `97232ea98dbc7c6f6f0e1b4e3036aed29f3952ff60446b7e1b32d69bbfc8358f`. Original protobuf bytes and the decoded full protojson, including resource/event/status/link values, were inspected. Trace IDs/timestamps make the wire hash run-specific. The local receiver uses no external provider or credentials. These final receipts are in the scoped race log and `resume-o4-telemetry-privacy-receipt.json`; `resume-o4-telemetry-green.txt` is the earlier17-case green run before the final creation/wiring-strengthened test revision.

`TestBusinessTelemetryProductionWiring` at test line186 pins safe tracing before every relevant denial, legacy tracing at its original position, and actual API registration→provider seal→policy route validation→policy seal ordering. The test pipeline uses the actual production middleware functions; `OperationLogMiddleware(nil)` avoids a credentialed audit DB. It does not substitute for persisted MySQL audit acceptance.

Commands ran from `backend` with `D:\msys64\mingw64\bin` prepended, `CGO_ENABLED=1`, `CC=D:\msys64\mingw64\bin\gcc.exe`:

| Command                                                                                                                                         | Fresh result                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `go test -race ./internal/middleware ./cmd/server ./pkg/auditpolicy ./pkg/telemetry -count=1 -timeout=180s -json`                               | Exit0; all4 packages passed;121 passing test events,43 existing MySQL/Redis skips,0 failures. The new telemetry child suite has no skips. |
| `go vet ./internal/middleware ./cmd/server ./pkg/auditpolicy ./pkg/telemetry`                                                                   | Exit0, no output.                                                                                                                         |
| `go build ./cmd/server ./internal/middleware ./pkg/auditpolicy ./pkg/telemetry`                                                                 | Exit0, no output. Multiple-package build leaves no executable in the workspace.                                                           |
| `gopls check cmd/server/main.go internal/middleware/business_telemetry_middleware.go internal/middleware/business_telemetry_middleware_test.go` | Exit0, no diagnostics.                                                                                                                    |
| `gofmt` on the3 owned files and `git diff --check -- backend/cmd/server/main.go`                                                                | Clean.                                                                                                                                    |

526 backend Go/SQL/mod/sum file hashes are identical before and after those checks; receipts retain the whole list. No external credentials were opened, no native agent/model delegation occurred, and no Ops, locale, generator, candidate, parent ledger, lock or documentation source was edited. The repository's many prior working edits were preserved.

## Evidence and root follow-up

- `resume-o4-telemetry-checks.json`: exact verification commands, exits, durations and skip/gap accounting. Zero-output vet/build/gopls are recorded directly here; PowerShell Tee-Object created no stdout files for those empty streams.
- `resume-o4-telemetry-privacy-receipt.json`: default-production RED, safe17-case metadata receipt, actual OTLP digest and unmatched-default controls.
- `resume-o4-telemetry-source-hashes.json`: exact owned files/hashes.
- `resume-o4-telemetry-verification-before-hashes.json` / `resume-o4-telemetry-verification-after-hashes.json`: full526-file stable-source boundary.
- `resume-o4-telemetry-scoped-race.jsonl`: final raw verification and privacy receipts.

Root must add both new middleware files to Base expected inventory/manifest and downstream candidate packaging before sealing a candidate. Main is already within the parent audit/entry scope. No parent/manifest/docs additions were made by this lane. Both independent original CODE and ARCH lanes must rerun against these exact files plus the separate candidate ownership repair. Do not treat this Generator handoff or the local privacy receipt as independent approval.

Known runtime limits:43 existing database/Redis-dependent tests skipped without configured test connections; no live MySQL audit persistence, Redis authorization lifecycle, external providers, paired candidate startup/runtime or remote115.190.251.143 acceptance was exercised here. Whole-repository checks, paired/runtime/privacy/official-consumption gates and original human acceptance remain root-owned. Unadopted legacy telemetry still has its old raw capture behavior by the explicitly bounded contract. **Parent stays OPEN until independent review and all mandatory gates pass.**
