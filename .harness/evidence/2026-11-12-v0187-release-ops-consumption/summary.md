# v0.18.7 release preparation

Release preparation for the immutable Base patch that carries the closed formal-queue foundation contracts merged through Base PR #504 (provider-owned permission routes with startup seal, permission-cache revocation repair, shared operational UI/Dashboard adapter contracts and consumer artifact governance). VERSION advances from 0.18.6 to 0.18.7.

Two release-blocking CI remediations ride with the preparation because the first main push (c8a71003) could not satisfy the gates:

- `backend/internal/middleware/request_context_middleware.go` now logs the matched audit route's method and template through the existing `logging.SanitizeLogValue` sink sanitizer, closing the open CodeQL `go/log-injection` alert that failed Security Gates; a middleware test asserts the `business request` fields equal the registry values and contain no control characters.
- `frontend/tests/smoke/system/system-pages-helpers.ts` reads the empty-state text via `evaluate()` with a 2s timeout instead of the raw `innerText()` actionability wait, which stalled for the full 30s test budget on the transient Arco loading empty state and failed the operation-log smoke twice on the main push.

No publication, tag, asset or Ops consumption is claimed by this preparation. Those require the exact merged-commit Release Gate and official four-asset verification recorded here afterwards.

Unwaived residuals carried from the predecessor task: real S3 provider skip without waiver, unsigned maintenance freeze, FR028 oversized audit storage, separate Ops CMDB/O2/O3/O4/D2 product acceptance.
