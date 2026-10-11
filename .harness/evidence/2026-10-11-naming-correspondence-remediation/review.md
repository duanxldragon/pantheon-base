# Review — naming-correspondence-remediation

## Verdict

Accepted. The change closes the 12-item action list from the 2026-10-11 review, and — more
importantly — repairs the two harness gates that had been reporting success while enforcing
nothing. No API route, database row, permission code, menu `componentKey` or runtime behaviour
changed.

## Review points

- **The gates were the real defect, not the naming.** Naming drift is a readability cost; a
  boundary gate that scans zero files is a false guarantee. Both are fixed, and the fix is proven by
  a before/after finding count rather than by the gate's own (previously untrustworthy) output.
  Fixtures confirm the rules fire in both directions, so "0 findings" now means "checked and clean",
  not "did not check".
- **Scope discipline on the runtime contract.** The remediation is structural. `componentKey` is a
  literal string that couples the database, the Go validation registry, the frontend
  `componentRegistry.ts` and `check:menu-contract`; none of it was touched. The 128-file backend
  commit changes only `package` clauses, leaving every import path intact.
- **Baseline ratchet, not renewal.** The baseline shrank 5 → 1 by *executing* the remedy that the
  four retired entries recorded, not by re-dating them. The surviving entry is a documented
  type-only architectural seam (`platform` → `system/iam/menu/api`). A ratchet that actually ratchets
  is the difference between a baseline and a graveyard.
- **The rename surfaced a real bug.** `go vet` caught a local `setting` variable shadowing the
  renamed `setting` package in `modules/auth/login/login_runtime_test.go`. Fixed, not suppressed.
  Likewise, fixture N2 exposed that the component detector initially missed camelCase-named
  components, and `vitest.config.ts` still had coverage globs pointing at the pre-rename
  `core/permissions` / `core/settings` — which would have silently dropped two directories from
  coverage. All three were caught by running the checks rather than trusting them.
- **i18n and audit were documented, not renamed.** `system/i18n`'s module value is `system.config`,
  and the audit module's name differs from its REST resource name. Unifying that vocabulary would
  change API routes, permission codes and menu data — the explicit non-goal of
  `NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`. The mismatch is now explained in the
  correspondence table (§11) instead of being silently "fixed" into a breaking change.
- **Non-component JSX modules are legitimate.** `core/menu/icon.tsx`,
  `modules/auth/session/clientInfo.tsx` and `modules/platform/widgets.tsx` are JSX modules that
  declare no component. Rather than renaming them to satisfy a naming rule, the contract encodes a
  mechanical discriminator (`declaresComponent()`), so the rule matches reality.
- **CI caught what the local toolchain structurally could not — twice.** First, five in-place
  case-only renames were never recorded by git, because Windows and macOS resolve filenames
  case-insensitively — so `tsc`, `eslint`, `vite build` and `vitest` all passed while Linux CI failed
  three checks (`check:import-path-case`: 13 problems; five test suites: `Failed to resolve import`).
  Then the very same hazard reappeared: `check-shell-visual-contract.mjs` hardcodes the old filename
  as a path segment and died on Linux with `ENOENT` while passing locally. Both are real defects
  introduced by this change, both are fixed, and both were re-verified. Recorded rather than quietly
  fixed: they are the clearest demonstration that these gates must stay blocking.
- **The obvious ratchet was tested and rejected.** A gate validating hardcoded source paths in
  `frontend/scripts/**` with exact case was probed and produced 34 findings, essentially all false
  positives (`package.json`, `.spec.ts`, `index.js`, `List.tsx` templates). Shipping it would mean a
  large allowlist, which is the opposite of fixing a root cause. The evidence records the probe
  result and the actionable rule instead — refusing to add a gate is the right call when the gate
  would be noise.
- **The runtime contract is proven, not claimed.** Rather than asserting "no API/permission/menu
  change", the change set is verified by diffing literal sets between `main` and `HEAD`: 20
  `componentKey` registry keys, 116 permission codes and 60 API route paths, all byte-identical.
  `componentRegistry.ts` shows the point exactly — every key is unchanged while every `import()`
  target moved.
- **Completion honesty.** `check:structure`, `check:harness-encoding` and the `tests/scripts`
  suites cannot run on this host (Node cannot spawn child processes here). This is recorded as a
  known gap with the exact substitute used, not presented as a local pass.

## Reviewer posture

- Assume the gate's "0 findings" is a no-op: refuted by the before/after counts, the five boundary
  fixtures and the nine structure fixtures.
- Assume a 128-file rename silently changed an import path: refuted by `go build`, `go vet`,
  `gofmt -l` and by the fact that only `package` clauses changed.
- Assume a structural change leaked into the runtime contract: refuted by `check:menu-contract`
  (16 menus / 20 routes / 89 permissions / 20 component keys) and by an unchanged set of route
  paths and module metadata.
- Assume the baseline was re-dated to hide findings: refuted by the 5 → 1 shrink and by the retired
  entries' own recorded remedy being the change that was made.
- Assume a rename landed just because the local build is green: refuted — five case-only renames
  were silently dropped by git on a case-insensitive filesystem and only Linux CI caught them. A
  green local build is not evidence that a rename was recorded.
- Do not accept "the check passes" as evidence on this host: the three git-shelling gates are
  explicitly listed as CI-only, with the substitution recorded.
