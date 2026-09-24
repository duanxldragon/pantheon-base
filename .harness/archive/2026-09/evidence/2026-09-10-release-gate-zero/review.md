# Review — 2026-09-10-release-gate-zero

## Scope confirmation

- Touched: backend deps (grpc v1.83.2), 3 Go module trees with analyzer
  findings (org/dept, i18n, lowcode/dynamicmodule), OIDC module (comments +
  complexity extraction), 3 smoke-core test files (smell-level only),
  k8s probe config, release-push.sh (string const).
- Not touched: auth/OIDC runtime logic, API contracts, permissions, i18n
  keys, DB schema, Sonar/gitleaks configuration.

## Risk classification

Medium: dependency bump (patch-level, advisory-driven) + Go restructures
where the guard moved lexically in front of the sink; runtime behavior
unchanged by design.

- grpc v1.83.1 → v1.83.2 is a patch bump fixing GHSA-2v4p-qf9q-27wj;
  full backend suite (19/19) and live core smoke (23/23) pass on it.
- i18n `Select().Updates(struct)` writes the same columns with the same
  values as the map form; only the GORM call shape changed.
- registry `fs.FS` rooting preserves the exact path set the previous
  resolve-guard admitted; sinks see only rooted paths now.
- OIDC helper extraction is branch-for-branch; no logic reordering.

## Gate honesty

- No `nosec`, no Sonar ignore markers, no gitleaksignore additions this
  round — every finding fixed at the source.
- Smoke test waits were replaced 1:1 with deterministic waits; assertion
  semantics unchanged (verified by the live 23/23 run).

## Residual risks

- SonarCloud acceptance is verified post-merge; if the analyzer still
  flags any of the 2 restructured taints, follow-up will be pattern-level
  (not suppression) per repo rules.
- S6897/S6596 k8s probe changes are config-only; verified by manifest
  shape review, not by cluster deploy.
