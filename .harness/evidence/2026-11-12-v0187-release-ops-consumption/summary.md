# v0.18.7 release preparation

Release preparation for the immutable Base patch that carries the closed formal-queue foundation contracts merged through Base PR #504 (provider-owned permission routes with startup seal, permission-cache revocation repair, shared operational UI/Dashboard adapter contracts and consumer artifact governance). VERSION advances from 0.18.6 to 0.18.7.

Two release-blocking CI remediations ride with the preparation because the first main push (c8a71003) could not satisfy the gates:

- `backend/internal/middleware/request_context_middleware.go` now logs the matched audit route's method and template through the existing `logging.SanitizeLogValue` sink sanitizer, closing the open CodeQL `go/log-injection` alert that failed Security Gates; a middleware test asserts the `business request` fields equal the registry values and contain no control characters.
- `frontend/tests/smoke/system/system-pages-helpers.ts` reads the empty-state text via `evaluate()` with a 2s timeout instead of the raw `innerText()` actionability wait, which stalled for the full 30s test budget on the transient Arco loading empty state and failed the operation-log smoke twice on the main push.

No publication, tag, asset or Ops consumption was claimed by the preparation itself. Those require the exact merged-commit Release Gate and official four-asset verification recorded here afterwards.

## Publication (2026-11-12)

The remaining Release Gate blockers on main were cleared by code-only SonarCloud remediation, following the 2026-10-20 zero-issues policy (no batch won't-fix, no excludes, no gate changes): PR #506 (merge commit fd243497) fixed all 63 unresolved issues with semantics-preserving refactorings, and PR #507 (merge commit 3203624e) removed the 4 residual issues introduced by that refactor; SonarCloud main shows 0 unresolved issues. The CodeQL go/log-injection alert re-detected on the fixed sanitizer code as #109 was closed as maintainer-authorized false positive, consistent with the earlier #99 disposition.

On the exact commit 3203624e55438866edb951bd74e671eab38d2f16 the Release Gate Summary check run 131113763713 (workflow run 43194854386) completed with conclusion success, after which `release:foundation:publish` created the annotated tag `pantheon-base-v0.18.7` (tag object e05161179439cd12fa6527e118d29962d4272dd3 dereferencing to the base commit), pushed it to origin, and created the GitHub release carrying all four official assets (foundation-release-pantheon-base-v0.18.7.tgz, its .sha256, repo.tar, its .sha256). `check:release-assets` verified the local bundle and the hosted release. The release notes/upgrade notes/consumer impact were authored in the gitignored local `releases/pantheon-base-v0.18.7/` tree and embedded in the hosted release body.

Ops consumption remains pending until the downstream repository fetches, verifies and rebuilds from this exact tag with full validation.

Unwaived residuals carried from the predecessor task: real S3 provider skip without waiver, unsigned maintenance freeze, FR028 oversized audit storage, separate Ops CMDB/O2/O3/O4/D2 product acceptance.

## Official consumer continuation — 2026-11-13

[Ops PR #183](https://github.com/duanxldragon/pantheon-ops/pull/183) consumes official v0.18.7 at immutable 3203624e. Source-bound acquisition/rebuild/full validation and review logs are retained in its task evidence. Current head 4404cfde repairs only two receipt paths; independent receipt verification confirms 12 logs exist with matching hashes and both hosted asset digests match the lock. The final hosted smoke and merge are pending; no task completion is inferred before that receipt.

## Official consumer completion — 2026-11-13

[Ops PR #183](https://github.com/duanxldragon/pantheon-ops/pull/183) merged at 2026-11-13T04:44:42Z as fc3fa867630580f7bcf1d40082a77f6b2548ac56 after final Smoke Sanity 04:44:08 and Quality Gates 04:44:14 passed. The source-bound head 4404cfde consumes official v0.18.7 at 3203624e; acquisition/rebuild/full CGO race/frontend/overlay/drift/standard smoke and independent source reviews are in the immutable consumer evidence. The actual merge receipt is retained in ops183-merged.json.gz and commands.json. All original release/consumer task criteria are now complete. The non-required external Vercel preview failure remains visible, and separate runtime/provider/freeze/production/product-acceptance residuals are not waived.
