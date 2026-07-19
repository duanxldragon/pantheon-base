# Review — 2026-07-15-code-review-remediation

**Posture**: security + mechanical (self-review; independent reviewer recommended at PR stage)

## Security-posture checks

- Refresh rotation deletes the old token only after the new pair is issued — no lockout window; failure is logged, not fatal (session-state validation remains the backstop). ✔
- Cascade revoke is fail-open by design (Warn log): DB `revoked_at` is authoritative, Redis deletion is defense-in-depth. Verified all four revoke paths call the cascade. ✔
- `RevokeOtherSessionsForUser` collects session IDs inside the transaction but cascades after — a rollback would leave Redis entries intact (correct: no premature deletion). ✔
- SecureActionMiddleware additions are backward-compatible: frontend auto-retries with `X-Operation-Token` on `auth.operation.verification_required`. ✔
- Private-host default flip is a **breaking change for intranet deployments** — documented in DEPLOYMENT_GUIDE.md; release notes must call it out. ⚠ noted
- Migration 000010 deletes duplicate i18n rows (keep-newest). Data loss is bounded to exact-duplicate keys and matches runtime normalizer semantics. Down migration cannot restore deduped rows — acceptable, documented in the file. ✔

## Mechanical checks

- gofmt/vet/eslint/tsc all clean; full test suite passes including new/updated tests (authtoken cascade ×2, generator datasource ×2 cases, upload fixtures).
- Staged-tree isolation verified: commit content was built and tested with unstaged toolbar work stashed away.

## Residual risks

1. `sessref` index TTL equals refresh TTL; a session revoked after refresh-token expiry is a silent no-op (correct behavior).
2. Multi-instance: pipeline (not MULTI/EXEC) is used for the two-key write; a crash between SETs could leave an index without a token or vice versa — both degrade to the no-op/backstop path, no security impact.
3. pantheon-ops carries the same generator audit-metadata warnings; not addressed here (out of scope, recorded in fix-report roadmap).
