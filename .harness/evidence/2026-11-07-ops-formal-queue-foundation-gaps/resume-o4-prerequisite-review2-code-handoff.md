# O4 prerequisites — second independent CODE/spec/security handoff

**Verdict: REQUEST CHANGES. CRITICAL 0 / HIGH 0 / MEDIUM 2 / LOW 0.**

The prior HIGH concerning protected telemetry is closed by the current production wiring and a fresh real SDK/OTLP verification. The prior MEDIUM concerning Ops path-only directory ownership is closed for the repaired Ops cleanup implementation: observed replacement directories and unknown assembled directories are refused and retained. The complete prerequisite set still cannot receive this lane's approval: the in-scope Base producer retains the same destructive path-only cleanup defect, and the new Ops cleanup refusal masks original assembly failures.

This is a new independent review of current source, not an implementer's self-review, plan approval, architecture verdict, product seal, final P0 acceptance, production approval, release or publication approval. No source implementation or regression tests were authored. The CLI final summary is separate from this detailed handoff.

## Scope, linkage and review sequence

- Reviewer role: independent Code Reviewer / Pantheon 专家; code/spec/security lane only. No delegation, model/config/credential changes, remote mutation, Git mutation, commit or release.
- Layer: L2, Base platform contracts/middleware/producer, system/auth and IAM/config read adapters; Ops candidate resolver/entry. Actual Ops business adoption, generator B implementation/runtime approval, migration37, live tenant/provider/browser acceptance and official consumption remain separate.
- Parent: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`; machine packet: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`.
- Scope guidance only: `../pantheon-ops/.local/ops-acceptance/resume-o4-prerequisite-code-prompt.txt`. Its original output filename was deliberately not used.
- Spec: revision4 `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`, SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`.
- Both repair handoffs were present and read: Base `resume-o4-telemetry-handoff.md`; Ops `../pantheon-ops/.harness/evidence/2026-11-07-ops-planned-task-closeout/verification/p0-integration-20261109/resume-o4-candidate-cleanup-handoff.md`.
- Reviewed diagnostic scope: 46 Go source/test files and the 6 original Base/Ops candidate JS source/test files; 69 unique source/context paths frozen below. Critical implementation bodies and meaningful regression assertions were read directly, including all three added telemetry files/production placement and directory replacement tests. Context includes unchanged tenant/session algorithms, legacy groups, formal tooling and runtime/exporter composition; a context hash does not assert line-by-line review of every unrelated formal tool.
- Started with current `git status`, `git diff --stat`, then scoped tracked diffs; untracked implementations were read as current files. The Ops candidate sources are untracked in the current checkout, so an empty tracked diff was not treated as absence of changes.
- Stage 1 was performed before quality analysis: A/E intent was reconstructed from the approved plan, actual read ports, production composition and test assertions. F1 fails the ownership/evidence requirements below. The root-cause guard independently fails for the masking assembly catch. Supplemental LSP/syntax/security checks were completed to ground the verdict; no Stage 2 approval or style-first verdict is issued after those failures.

The existing `resume-o4-prerequisite-independent-code.md` currently contains a concise CLI-sized summary with a self-link, not a recoverable detailed original source report. Its receipt has no source inventory. This review therefore used the original prompt only for scope and rebuilt the source assessment independently. Both existing files were left intact.

## Findings requiring repair

### [MEDIUM] Base producer failure cleanup deletes a foreign real directory replacement

**File:** [build-candidate-artifact.mjs:103](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:103).

The producer creates a `.candidate-seal-*` sibling with `mkdtempSync`, but its finally block only tests whether that pathname exists before calling `fs.rmSync(stage, { recursive: true, force: true })`. It records neither the directory instance nor its ancestors/subtree. A process can rename the created directory, recreate a real directory at the same pathname, and cause a write/verification failure; cleanup then recursively deletes the replacement and its foreign content. The earlier input/output path checks and source hashes do not establish ownership of this replacement.

**Fresh reproduction against the actual current exported producer:** a disposable OS-temporary output parent was used, with a read-only current Base module as input and current Git HEAD read for provenance. A temporary in-process write hook renamed the producer's created stage, created a different real directory at its old pathname, placed a synthetic foreign marker there and threw before the first artifact write. No commit, configuration, current source edit, product candidate seal or source adoption occurred. The diagnostic harness was removed afterward.

```json
{
  "probe": "actual Base producer cleanup after observed rename/recreate",
  "caught": "synthetic producer write failure",
  "originalID": "6473924465208839",
  "replacementID": "14918173766565645",
  "differentInstances": true,
  "foreignReplacementExists": false,
  "originalExists": true,
  "outputSealed": false
}
```

Different bigint inode values prove actual directory instances. The replacement was already present when cleanup began; this is not the unavoidable race after a last identity check.

**Fix:** give the producer's created stage, required ancestor chain and cleanup subtree the same narrowly scoped instance-ownership discipline as the repaired consumer. Compare trustworthy platform identity and refuse unknown/replaced directories. Avoid recursive pathname deletion of an unchecked replacement; retain the original failure and stage when safe ownership cannot be proved. Add a regression exercising rename/recreate and a nested/ancestor replacement before cleanup, asserting both the replacement and renamed original survive. No general lock framework is requested.

### [MEDIUM] Ops cleanup refusal overwrites the original assembly/integrity failure

**File:** [rebuild-from-candidate.mjs:258](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs:258).
**Related:** [foundation-candidate.mjs:804](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.mjs:804), [foundation-candidate.test.mjs:199](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs:199).

The catch calls `removeCandidateStage(cacheRoot)` without passing the caught error. When the unchanged assembler has created `assembled`, the new ownership policy correctly refuses to enroll that unknown directory and throws `CandidateCleanupError`. Execution never reaches `throw error`. Its `cause ?? error` now contains the cleanup ownership error, rather than the original source mutation, shared drift, migration conflict or assembly failure. The CLI prints only the resulting ownership message. The original failure is lost even though candidate publication remains refused.

The repaired tests explicitly accept generic cleanup refusal for the eight assembly mutation cases and drift/migration failure cases. `assertCleanupRefused` checks the original cause only when a cause pattern is supplied; the assembly calls supply none. Passing those tests therefore proves retention/no receipt, not preservation of the primary failing evidence. The cleanup handoff candidly records this exact call-site gap; documentation does not close it.

**Fix:** pass the original caught error through the already available `{ cause: error }` cleanup argument. Keep the typed ownership refusal and retained stage, but preserve the assembly cause and make both failures visible. Strengthen the existing assembly mutation/drift/conflict assertions to require the specific original cause. This is a small primary error-contract repair; do not suppress the cleanup error or reintroduce unsafe deletion.

**Root-cause guard:** this diagnostic masking is a review blocker even with green test counts. Safe refusal is necessary, but cannot replace evidence of why the primary assembly failed.

## Prior blocker closure and protected telemetry coverage

**Prior HIGH telemetry: CLOSED for the current prerequisite implementation.** Sources: [main.go:142](/D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:142), [business_telemetry_middleware.go:26](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/business_telemetry_middleware.go:26), [business_telemetry_middleware_test.go:72](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/business_telemetry_middleware_test.go:72).

- Selection uses actual exact method + Gin FullPath in the startup registry, before body capture, buffering, bind, CSRF, API rate, auth or tenant denial. Main registers real routes, seals business providers, validates policy routes and seals policies before serving. No prefix/header strategy switch was introduced.
- The safe adapter starts before BodySizeLimit/CORS/legacy OTel/Prometheus/CSRF. Default otelgin is filtered at its existing relative placement for unmatched requests; a frozen server flag prevents later request mutation from re-enabling raw otelgin capture on an adopted request.
- Span name/action, method and template are code-owned registration values. Request ID is the server UUID from the preceding protected request-context branch. IDs/count/catalog come only from typed safe metadata. URL/query/user agent/header/body/client address/provider/Gin error/panic values are never supplied to the protected server span.
- Incoming traceparent is not extracted. `WithNewRoot` removes remote ancestry/tracestate from the created SDK span, while the empty baggage context removes incoming/inherited baggage. Original cancellation/deadline/server values remain; outbound injection uses the new service trace. No parent/link/tracestate or inherited baggage survived in the real SDK/OTLP tests.
- The defer reads only panic/error presence, records constant empty-attribute events, uses an empty status description, calls End and rethrows the original panic to metadata-aware recovery. Missing outcome, business-HTTP200 failure, errors after success, abort, cancellation and panic cannot become an OK trace. Existing HTTP envelope behavior remains; error-after-success remains HTTP200, and panic before response remains HTTP500.
- ID narrowing is guarded: uint64 IDs through MaxInt64 retain their value; larger IDs map to safe unknown 0 instead of negative overflow. Count is bounded to 10000 and catalog version is uint16. There is no max-ID boundary test in the current telemetry suite; this branch was verified from its explicit arithmetic guard, not claimed as runtime-tested.
- The fresh suite uses real policy registration/ValidateRoutes/Seal and SDK OnStart snapshots, an in-memory exporter and actual `telemetry.InitTracer` HTTP OTLP export. It is not a handcrafted or capture-then-sanitize span fixture.
- Fresh cases: success, raw200/no explicit outcome, business200 failure, invalid metadata, provider, storage, c.Errors after success, string/error panic, invalid JSON, CSRF, rate, auth, tenant, Content-Length oversized body, streamed body/bind limit and canceled context. All 17 produce one safe span at Start/End. Early controls have zero handler/body-read/inferred-owner evidence.
- Unmatched controls retain default raw capture and remote parent behavior for a legacy route, another method on the same template and an unknown route. Oversized unmatched requests remain untraced as before. This bounded preservation is not an approval of legacy raw telemetry for future adopted routes.
- Current tests verify safe outbound carrier injection, not a complete actual child-span/external-provider instrumentation chain. Such full downstream runtime/privacy acceptance remains a later adoption gate; the current middleware source does not add an uncontrolled child-span capture path.

Fresh OTLP: **17 spans / 10,321 protobuf bytes / zero synthetic sentinel matches**, SHA256 `abe0f6693c662d0d5be3337b48e4b04827c82f39aed2e67b60fb750e834a8a6e`. Both protobuf bytes and decoded protojson are inspected by the test; wire digests naturally vary with IDs/time.

**Prior MEDIUM Ops directory identity: CLOSED for the repaired cleanup function, with bounded limitations.** Sources: [foundation-candidate.mjs:476](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.mjs:476), [foundation-candidate.mjs:762](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.mjs:762), [foundation-candidate.test.mjs:217](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs:217).

The new Map stores actual bigint dev/ino identities, not paths, timestamps or markers. Exclusive mkdir captures identity immediately; source, stage and ancestor chains are checked during verification and cleanup. Complete subtree preflight happens before removal; each unlink/rmdir rechecks ancestors. Symlink/junction/special entries, unavailable/nonpositive identity, renamed/recreated directories and unknown descendants refuse. Recursive rm has been removed. Source verification rejects an unchanged snapshot moved into a replacement parent. Tests read foreign marker bytes and retained original files, covering extraction/assembly stage, snapshot, nested and ancestor replacements, plus assembled replacement, unavailable identity, unknown descendant and a replacement after one owned unlink.

The consumer **does not prove ownership of assembler-created directories**: it refuses and retains them on failure. It never infers their ownership from location. This is the safe, explicitly documented behavior of the current two-file repair, not a claim that assembled directory identities are enrolled or cleanup always succeeds. Finding 2 is about losing the primary error, not a demand to discard this retention policy.

mkdir→lstat enrollment, identity check→unlink/rmdir and external source read/verification are separate syscalls. A namespace change within those intervals remains outside the proven guarantee. Rechecks narrow exposure but do not provide rollback, atomic filesystem locking or a general adversarial namespace guarantee. The deletion-boundary test explicitly allows partial cleanup of the original while retaining a detected replacement. Finding 1 concerns a replacement detectable before cleanup and is fixable without inventing a general lock framework.

## Original A/E/F1 source and assertion coverage

| Boundary                                | Current source/assertion assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strict mode / nil dependencies          | Explicit known compat/multi only; missing/unknown/read/canceled mode refuses. Existing SettingService seam is reused. Typed-nil registration and required DB/RDB/mode/auth checks prevent route registration; provider references are synchronized, replacement/late registration refuses, then seal. Old ModeLoader/legacy groups retain their behavior.                                                                                                                                                                                                          |
| Live opaque session                     | New BusinessTokenAuth uses fresh Redis session/PTTL and independent user/session blacklist absence checks; only redis.Nil is absence, empty markers/wrong-type/closed stores refuse. It clears token role snapshots and performs no token/cache/activity writes. RefreshPrincipal checks actor/session/claim equality, SQL ownership/revocation/refresh expiry/idle and current enabled non-deleted user through the real credential port.                                                                                                                         |
| Global provenance / tenancy             | Actual global0 user-role/role join precedes header capability resolution. Tenant-local admin/platform-like token keys are not promoted. Positive originating claim membership/lifecycle and actual roles remain required under override. Compat is global0 only; subject resolution stays on claim; header checks target lifecycle and acquires only actual global grants; platform fallback requires no active memberships.                                                                                                                                       |
| Current action / DataScope              | A fresh persisted Casbin enforcer is built per checkpoint without using/mutating the process enforcer/cache. Genuine global subjects precede explicit tenant subjects. Optional permission-key checkpoints require the current key as well as current action policy. DataScope uses only granting namespace(s), current user/department and strict role policy, avoiding legacy nil-DB/dept-cache/mixed-key paths.                                                                                                                                                 |
| Freeze/recheck                          | Gin-bound Input is copied by value. Reauthorize verifies frozen mode/identity/provenance/resource/action, refreshes authority and current DataScope before release; a secondary action cannot change tenancy. Real integration assertions revoke SQL session/user/role/binding/member/lifecycle/policy/DataScope/mode or Redis token between entry and release and reject the late provider result. Business handlers must call this seam at their actual sensitive release/write checkpoints.                                                                     |
| Token writer integration                | Reviewed existing no-resurrection Lua repair and tests: Go compares exact uint64 identity/role order; Lua compares current bytes, requires positive PTTL, SET XX KEEPTTL. Deleted/expired/persistent/replaced/error states do not issue a token or extend expiration. Test hooks exercise post-GET interleavings; legacy activity regression leaves a warm cache without resurrecting Redis, so the new fresh reader still denies. No broad token-cache semantic rewrite is claimed.                                                                               |
| Metadata audit/correlation              | Exact method/template selects before input or response capture. Typed safe metadata replaces raw overrides; common response helpers distinguish business-code HTTP200 failure and missing typed success defaults to failure. Correlation is fresh server UUID, canonical/alias paths are exercised. Logger/recovery avoid raw request/panic dumps for adopted routes. Current typed operation audit intentionally does not interpret raw c.Errors; trace error presence is a separate conservative signal. No response-body/error parsing fallback was introduced. |
| Producer/descriptor/resolver            | Reviewed detached independently pinned descriptor/archive identities, sorted bounded normalized inventory, hash/count/aggregate checks, strict regular ustar parsing, link/PAX/GNU/special/path/case/file-directory/size refusal, finite source export capability mapping and self-contained Ops consumer. Producer captures dirty/untracked declared bytes; resolver does not load unverified current Base. Required declaration presence is interface evidence, not behavior/build/runtime approval.                                                             |
| Candidate assembly                      | Canonical Ops manifest only; snapshot.verify and declared Ops hash/stamp/Git-selection/official-lock checks bracket real assembler/drift seams. Derived migrations are byte-checked; candidate receipt is staging-only. Existing mutation/conflict assertions still require no receipt, but primary cause preservation fails as documented. Source stamp/hash checks are bounded observations, not atomic cross-process locks.                                                                                                                                     |
| Required module interface / generator B | RegisterRequiredBackendModules prepares required migrate/bootstrap/menu/permission/i18n stages before routes and propagates errors. Reviewed only as the prerequisite exported interface. Mutable generator implementation, generated default/dev runtime and complete buildable consumer candidate remain separate approval scope.                                                                                                                                                                                                                                |

The A/E source receipt's 33 owned entries were compared with current hashes: **32 match; only main.go differs**, precisely the telemetry repair now separately reviewed/tested. This binds the retained real MySQL/Redis A/E assertions to current implementation files rather than relying on a test count. The retained final race receipt runs required MySQL/Redis with MinGW/CGO, reports 100 passing test/subtest events, zero skipped tests and modules/auth as package-without-tests, not an integration pass. The tests' actual fixture SQL/Redis mutations and assertions were read.

The telemetry repair's three owned hashes match its handoff exactly. The Ops cleanup's two owned hashes match its handoff exactly. Its retained final 63-case candidate result and 62-case overlay result have zero skips; their directory-identity assertions were examined. These logs do not discharge either finding or provide actual product capability/build/runtime proof.

## Fresh verification and gaps

| Check performed during this review                                                                                     | Result                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| gopls check on all 46 Go files listed in the diagnostic inventory                                                      | Exit 0; no LSP diagnostics. GOPROXY=off; local installed gopls CLI used.                                                              |
| node --check on the 6 Base/Ops candidate JS files                                                                      | All exit 0; no syntax diagnostics. This is syntax validation, not a JS type-check claim.                                              |
| go test -race ./internal/middleware -run '^TestBusinessTelemetry(Privacy\|ProductionWiring)$' -count=1 -timeout=90s -v | Exit 0; MinGW PATH/CC, CGO_ENABLED=1, GOPROXY=off; real sealed privacy subprocess + production wiring pass, no selected test skipped. |
| Actual Base producer isolated rename/recreate failure probe                                                            | Exit 0; demonstrates deletion of the foreign replacement, original preserved, no candidate sealed.                                    |
| Scoped git diff --check for the tracked backend prerequisite files                                                     | No whitespace diagnostics.                                                                                                            |
| Scoped fallback/capture pattern examination                                                                            | Native literal search and direct source reading identified recursive cleanup and lost cause; safe span Start/events/status inspected. |

The literal `lsp_diagnostics` and `ast_grep_search` MCP tools were not exposed. Installed `gopls check` supplied real Go LSP diagnostics. No AST-grep executable was available; native literal pattern search plus full relevant body inspection was used, without falsely claiming an AST scan. No console/debug/secret/injection issue is reported merely from CLI help/error output or synthetic test values.

CodeGraph CLI was available and used for status/context. The index reported 27 added and 27 modified files pending; new/modified prerequisite bodies were read directly without syncing/writing the index. Fresh graph context provided the unchanged real credential FindByID, Casbin model and NormalizeFlagValue dependencies. No exploration was delegated.

No broad suites were rerun, per the explicit review scope. Retained A/E, build/vet, token and candidate evidence was inspected instead. The repair's broader race receipt has 43 pre-existing credentialed test skips; those are not counted as runtime acceptance and do not invalidate the independently passing selected privacy suite. No credentials/private configuration/raw provider bodies were opened. No frontend implementation or UI polish is reviewed here, so no rendered UI evidence is asserted.

## Architecture handoff, remaining gates and stop condition

For the authoritative ARCH lane: assess the documented retention of assembler-created unknown instances and the bounded separate-syscall guarantees. This CODE lane supplies source evidence and two concrete failure-contract findings; it does not issue a replacement architecture verdict. The existing public read ports and producer/consumer split do not add a business→system Service/Repository dependency or a contracts→middleware→contracts cycle; middleware uses the businessauth leaf. No new architecture design is prescribed.

**Ops backend adoption may proceed only after these actual prerequisite findings are repaired and both independent CODE and ARCH lanes approve the resulting stable source.** A later complete tenant runtime matrix, generator B runtime, candidate pairing/build capabilities, live IAM/audit/public HTTP and provider/storage privacy, migration37/interruption recovery, rendered/human acceptance and formal immutable release/consumption remain subsequent gates. They are not invented current source defects, and this verdict neither closes P0 nor grants production/publication authority.

The review stops here because original scope coverage, root-cause analysis, focused verification, severity/citations/repairs and source stability are documented. Further implementation belongs to the executor/coordinator.

## Exact source stability receipt

All **69 unique paths** below have identical SHA256 before diagnostics/reproduction and after review. Before/after hashes prove byte stability at the two observed boundaries; they do not rule out an external edit/revert entirely between those observations. Existing concurrent working edits were preserved. The independent A/E historical receipt comparison and repair-owned hash matching are additional, distinct observations.

| Path                                                                     | Before = after SHA256                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `../pantheon-ops/scripts/business-overlay/foundation-candidate.mjs`      | `da8a8eeeb0a9f52514b157353475a75d43675711f264731cd8564398d7610161` |
| `../pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs` | `aeeabfebbdd19bb9c09d18552601beb6ace20697e4ae268256c56a45912df151` |
| `../pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs`    | `1a05b6247bfb4d9d460e928ba53fb4ca4805fd440f093a0440b2a32cfd186828` |
| `../pantheon-ops/scripts/business-overlay/append-legacy-locales.cjs`     | `a28a6d7929b306e962f708fff8ee18294b8e2dd34a7f1555d1a5b809d30a85f8` |
| `../pantheon-ops/scripts/business-overlay/check-business-overlay.mjs`    | `89149cdf554b6f10b3b4d79cf734938127ca3438c543eb83c8184cb8d1c66730` |
| `../pantheon-ops/scripts/business-overlay/check-shared-drift.mjs`        | `b60ceb39cb309761d928252da22442e4c05ee507f85f199cc7a17b92b469c085` |
| `../pantheon-ops/scripts/business-overlay/extract-v12-locales.cjs`       | `5e25b32b815ea693e86d609e34b716d71e8383a6915ac2e2fcb7617404a6ba76` |
| `../pantheon-ops/scripts/business-overlay/foundation-release.mjs`        | `e6a9de8d5afcbcfbfb949f8cdb6da78395cb33b0e88ea158443062608b99175b` |
| `../pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs`         | `5706de2dcd8d2334b374fa8dd1f621a9c4ddeb4b8b1a075172f4395e4ae2fdbd` |
| `backend/cmd/server/business_startup_test.go`                            | `2b043fbc30bafc00729ff55883795eabd76b1554de4854ef6f30f05fca838e21` |
| `backend/cmd/server/main.go`                                             | `df1e3ea0d0f89cc1faf2db495e875832df2f280ff4d25be6f919957ed9180998` |
| `backend/go.mod`                                                         | `e275137d9a027ff2c3d73e17ed9a8dd2d70157a57f356eb4c675f460be0c8753` |
| `backend/go.sum`                                                         | `3c9804a1441c4df7b7e8defd0d6c7a1db542884857535f680c517ed2a2796f8a` |
| `backend/internal/middleware/business_authorization_test.go`             | `5d9f181d83fb2e066bd9ace3ba6b607193e0006593d6ad2875907edc6dc0a141` |
| `backend/internal/middleware/business_authorization.go`                  | `261afa640740845215149a0e1195d17f37c758d0987284e04ca9602f943fa3de` |
| `backend/internal/middleware/business_telemetry_middleware_test.go`      | `11d8295ff2a12fccc32239cd7e9d0d9ab439662264c264fd60ccdf267bb9c6c3` |
| `backend/internal/middleware/business_telemetry_middleware.go`           | `b7b896bedf4e5263005727759ee77c52f09934f7a6e46bb31b5b57f689693170` |
| `backend/internal/middleware/business_tenant_context_test.go`            | `59e1065607036b50d985757770d5ac20e9da209d6ce488c711c8024df6c015b3` |
| `backend/internal/middleware/business_tenant_context.go`                 | `f7b19e42ee68ee3c297c844c2b742a2bb0e3afc71f251c75bc134141dd387ba6` |
| `backend/internal/middleware/business_token_middleware_test.go`          | `692566b29c96b9201b6bdf453067664a66e38571ced2f927e31e6baac08404dd` |
| `backend/internal/middleware/business_token_middleware.go`               | `539a5ddcf7dc52d5ef870a2186b01ff289e1a9a8bfdf45c3eec1770d02bd4848` |
| `backend/internal/middleware/operation_log_metadata_test.go`             | `40a94c6155d14a86749c968698ebd2bc9b331d53a8f1cdb28badb757e36d9362` |
| `backend/internal/middleware/operation_log_middleware.go`                | `8ff2f1a5a900d241987729a86a702b0258626e2d38c535f544bd56452aa66386` |
| `backend/internal/middleware/request_context_business_test.go`           | `0ef0202b2ce13ae586f1e7487e4964e0c588a29d8c098c095985a74a9bc84caf` |
| `backend/internal/middleware/request_context_middleware.go`              | `d72f7d1df950f1eb0239414dfc4e7896b7e8831913740f4ec1d84a344d47dd55` |
| `backend/internal/middleware/token_activity_regression_test.go`          | `2f795baf9e8f905b455c0c96dc6f4801a01bccb1297c456b6e7a31df37fee844` |
| `backend/internal/middleware/token_middleware.go`                        | `2e4e02e8be0e2f9fe909de5253ef1b8e5ea106af696f7421d28047570fdb0e0b` |
| `backend/modules/auth/login/business_authorization_test.go`              | `559b921339d693da162f006077f03ded44f0fe5b9f3390f286ec15d68629e037` |
| `backend/modules/auth/login/business_authorization.go`                   | `c3eca93387a5d73c9cc06a2dd1d1a13d32cd2a4f50c053c5d6b686c6a7585a37` |
| `backend/modules/auth/login/login_runtime_types.go`                      | `9548be5a7a1287ad633f8b4583abb6b938e99f5d1a6cd9d0967e366417bbea62` |
| `backend/modules/auth/login/login_runtime.go`                            | `c99d4a3725305bf4efa87d4d9a4a19177ebc53c8e28f0f122ff5fcea0d99fb8a` |
| `backend/modules/auth/module.go`                                         | `319e5aa2cf1758f90957029af5fd7140d624f1127d9966892e146d2cfdff418a` |
| `backend/modules/system/system_modules.go`                               | `b7662f4c505c352ec14cf1466ad65dd74a31d0b28d9e1569bde706f849304f2a` |
| `backend/pkg/auditpolicy/policy_test.go`                                 | `429010a266121cd43fcd6925d56fd0888c2d3ff4f4517f439fd3dbbbfd73bfde` |
| `backend/pkg/auditpolicy/policy.go`                                      | `beefa9757b2c11e3c60f93a94558259dd56071de6927bf96c59fafa7ddff06c3` |
| `backend/pkg/authsession/session_scope.go`                               | `a5f7e250e9a966f92c941ea79a7126fbee2c45392a2792daf194ab70a365bb87` |
| `backend/pkg/authtoken/token_activity_test.go`                           | `f0e5266009dbdb4ee413006c6b50fa9d145b83410aa11c236fd6591657756a23` |
| `backend/pkg/authtoken/token.go`                                         | `faf9db702f30d3a75af75fb9f5d5bbbb91dde582f2150a4340006520770aac13` |
| `backend/pkg/common/http/response_business_test.go`                      | `58a884e1e86efabf57803647e3dc08756d9cb025739dd4ffd4361d0126bd1858` |
| `backend/pkg/common/http/response.go`                                    | `e29cca9bb940b22fec8d8dd0127d6b75604e92a411cf80ee0fdfdc898b3ef288` |
| `backend/pkg/contracts/business_tenant_groups_test.go`                   | `b9c6ebfe98d87d974f3ccea448011b550d4f01f286b28ae9ef5752845d9d60b8` |
| `backend/pkg/contracts/business_tenant_groups.go`                        | `1708fa753d56bf79b76df8dbeec7208b35a2ff44b1ca3300f9640d0ca2a96e6a` |
| `backend/pkg/contracts/businessauth/businessauth_test.go`                | `e814cc620cb20ce21506b10b74c9ef7c8af0e449e5567a857939aa0c57ecb492` |
| `backend/pkg/contracts/businessauth/businessauth.go`                     | `1ac1cc33dbaa21910a4a3dedaf168b0aa2e022ca0b9d339ae82690f26c9d6ade` |
| `backend/pkg/contracts/module_required_test.go`                          | `73633fba4aec9ab74d04d29e621bbef546f53b4e0567fb4a2a50929146df8caa` |
| `backend/pkg/contracts/module.go`                                        | `54855f519b669c10d72281ba37c604858414312e973bc5b8eee356aa5222c9dd` |
| `backend/pkg/contracts/route_groups.go`                                  | `499db195eb028dda27768245dd0c27e8f101e827464a69a8099bd5fe3f050303` |
| `backend/pkg/database/business_policy_test.go`                           | `b2c0eab1088073103e8477496ad81aa6577110d58e14387d655f0e11a78c595f` |
| `backend/pkg/database/business_policy.go`                                | `fdafd8c8cf27099e971cec0f8ed89527f79e92bed0c3766bc88fa46671d2f8d8` |
| `backend/pkg/telemetry/tracer_test.go`                                   | `80ca12c12d8489b472433c90ecce54660cb0937e3051b38e13baf59407a69a85` |
| `backend/pkg/telemetry/tracer.go`                                        | `04de2c0f375b61bec48c435aaceb0b44a2b7077c6ad7ee553ac5576b85c15373` |
| `backend/pkg/tenant/authz.go`                                            | `f100ecba09cffc65d44010a4392f736bb4e23669e55fcdcb64415d5c4d69fbd1` |
| `backend/pkg/tenant/membership.go`                                       | `15efc6c120162e173b2790be663c773aaccbfc48249c37754a9a21a69bf1ec1e` |
| `backend/pkg/tenant/mode_reader_test.go`                                 | `f4eb937f1adbdba6a618888e412402af4d7d6ce9e28fd07120ce5273aa445cfd` |
| `backend/pkg/tenant/mode_reader.go`                                      | `df9baff9f808827070747384388064a9aa15757c18fd9131430aa91ebe580748` |
| `backend/pkg/tenant/platform_scope.go`                                   | `8927c756eee0b77156e32d6922acffac12a01e8a629db1988d8c29a47c8670e2` |
| `backend/pkg/tenant/tenant.go`                                           | `2bb49b52f3fcc0ef1ea12d2bf87957b5dd04ae5ec959dc3240b921a3e3631cd5` |
| `config/foundation-consumer-artifacts.json`                              | `1d3cc1e52d3a5e5fba00a70c2d84467ad8c279ad5d66f3f9f92de238df7f1161` |
| `scripts/foundation-release/build-candidate-artifact.mjs`                | `2485c4da242967777d2c0b1d352f82684dbfa65343b6be229cb440b9322bb55f` |
| `scripts/foundation-release/candidate-artifact.test.mjs`                 | `ceaddf4deb94ef6b16bcaac28bee4525fbdeec8dbc76e3dc7a61440782e02417` |
| `scripts/foundation-release/candidate-descriptor.mjs`                    | `a9b242e4b6d787344f16357b6c7397ab4a7ffda633e21556138e240ccece71a6` |
| `scripts/foundation-release/build-release-bundle.mjs`                    | `3715c789337cc1b9ed8764fcc469e8ce7869e391ac67d50fe83341f5da8c8207` |
| `scripts/foundation-release/build-release-manifest.mjs`                  | `abd1ca92f4d6d0f8fc7a40ce2dbe708dca13fee84804c86a0fa46c50331aafa2` |
| `scripts/foundation-release/check-release-assets.mjs`                    | `83f70497e6270074a97a9594fe6028aa41d8459645b02844d49d1246472b1503` |
| `scripts/foundation-release/check-release-secrets.mjs`                   | `b771f8e5e8f32e8bcaccd3a84e31171f96e76212fff7311954ea83eb0a180ec5` |
| `scripts/foundation-release/cut-foundation-release.mjs`                  | `baedf969f8a8f02f9db7ffc3d9bb2a9ee87da8eb8395ae86dcdb04838c8d5b26` |
| `scripts/foundation-release/frontend-ownership.mjs`                      | `8fe420128ee0797eba07ba7a591119902726225a338cdad71ee9a23ea5d744a8` |
| `scripts/foundation-release/publish-foundation-release.mjs`              | `f6bd698a212fb49fbf41e32e2e82e78543be45ecf4f96a1dc2c7a6f529dbef42` |
| `scripts/foundation-release/release-cli.mjs`                             | `8e6733885a6e3694aa462d52f7354d6f6a529f61b78044c3c49278ddfa191888` |

Current official Ops lock remains `95de1a87270e15c0d4c672418a5df906818a88652f8a3e6c480f1484ee9fa70c`. Prior independent code summary remains `66fbfd1460f5d47ed2921b7c9bdfcfb25992080f420616d52a7f2af238135eef`; its receipt remains `d23731e1e2edc5f0a0c855242cdc2b1cf326ee6d52eb2e5d2ff2198b37def138`. This handoff is the only durable file created by this review; no earlier report/handoff was overwritten.

## Machine Readable

```json
{
  "taskId": "2026-11-07-ops-formal-queue-foundation-gaps",
  "tier": "L2",
  "role": "independent-code-reviewer",
  "verdict": "REQUEST CHANGES",
  "issues": {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 2,
    "LOW": 0
  },
  "priorTelemetryHigh": "closed-current-source-and-fresh-production-OTLP",
  "priorOpsCleanupMedium": "closed-function-with-explicit-instance-refusal-and-race-limits",
  "sourceFilesHashed": 69,
  "sourceStable": true,
  "goLspFiles": 46,
  "goLspExit": 0,
  "nodeSyntaxFiles": 6,
  "nodeSyntaxExit": 0,
  "astGrep": "unavailable; literal search plus source review",
  "freshTelemetryRaceExit": 0,
  "freshOTLP": {
    "spans": 17,
    "bytes": 10321,
    "syntheticMatches": 0,
    "sha256": "abe0f6693c662d0d5be3337b48e4b04827c82f39aed2e67b60fb750e834a8a6e"
  },
  "newProducerReplacementDeletionReproduced": true,
  "opsBackendAdoptionApproved": false,
  "architectureVerdict": "reserved-for-independent-ARCH-lane",
  "generatorRuntimeApproved": false,
  "productionApproved": false,
  "finalP0Approved": false,
  "publicationApproved": false,
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md",
    "plan": ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md",
    "report": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-code-handoff.md"
  }
}
```
