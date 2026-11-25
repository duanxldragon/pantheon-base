# Archive formatter protection

L2; shared repository engineering configuration. Parent: the Ops history audit at
`../pantheon-ops/.harness/tasks/2026-11-17-ops-history-audit/manifest.json`.

In: protect monthly historical task/evidence and preservation snapshots from default
Prettier writes, prove the normal lint-staged entry preserves worktree/index bytes,
retain formatting for active documents, and record the downstream inheritance gap.
Out: publishing, merging, changing the Ops foundation lock/tree, gate waivers, unrelated
existing changes, and rewriting historical evidence to satisfy formatting checks.

Minimum approach: reuse Prettier's standard root ignore file; no new dependency,
wrapper or Ops override. The official Base repo.tar includes committed root files.
Ops copies the verified Base snapshot and does not own .prettierignore, so the fix
must reach Ops through a subsequent formal release and consumer verification.

Verification: explicit Prettier write in an isolated fixture; actual lint-staged with
the existing package configuration, a negative witness without protection, and exact
worktree/index byte checks; scoped task/evidence/review/doc checks; independent code
and architecture review; Ops archive integrity and unchanged governance delta.

Stop condition: source fix, regression and independent review recorded; publication,
consumer adoption, existing governance debt and final product acceptance remain explicit.
