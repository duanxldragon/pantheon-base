# Independent ARCH review — v0.18.7 release preparation snapshot

Verdict: APPROVE. Architectural status: CLEAR (two non-blocking findings).

## Checks

1. Sanitizer layering intact. `backend/internal/middleware/request_context_middleware.go:28` applies the pre-existing exported `logging.SanitizeLogValue` at the call site because `logging.LogFromContext()` returns a raw `*zap.Logger` sink that bypasses the package-level `sanitizeLogFields` wrappers. No new import direction; no business semantics in platform code.
2. Patch versioning defensible. PR #504 adds only backward-compatible exported surface (`permissionroutes.Seal`, auditpolicy registry, businessauth ports) plus a revocation correctness repair; a strict semver reading could argue 0.19.0, but this repository's 0.18.x line precedent (0.18.3-0.18.6 all carried code/migration changes at patch) and the tag-anchored immutable release model make 0.18.7 the norm-consistent choice. `docs/contracts/SYSTEM_IAM_CONTRACT.md` already binds permissionroutes+Seal as authoritative, and the upgrade notes disclose the consumer-visible behavior change.
3. Packet/manifest/evidence structurally consistent with the v0186 template and honest about pending release/consumption; review.md/commands.json gaps resolved in this batch before merge.
4. Smoke helper keeps its sentinel role: the visible `.arco-empty` text must still match `pageEmptyTexts`; only the actionability wait was replaced with a bounded evaluate, and detached-element races now retry instead of stalling.

## Findings

| Sev | Issue                                                                                                                                                      | Disposition                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| P2  | Global auditpolicy registry mutation from tests without isolation helper (pre-existing pattern).                                                           | Follow-up hygiene, non-blocking            |
| P2  | `-race` reproduction hit a Windows ThreadSanitizer allocation error in the reviewer environment; targeted race rerun in the dispatcher environment passed. | Dispatcher rerun recorded in commands.json |

Reviewer: local independent architecture agent (maintainer-selected local panel method).
