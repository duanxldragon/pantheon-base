# Review artifact — 2026-10-11-smoke-test-tiering

## Verdict

**Accept.** The refactor is behaviour-preserving by construction and by measurement: all 59 top-level
test blocks are byte-identical, the 845-line helper region is preserved, and the before/after
TypeScript error multiset is identical. The new gate wiring is fail-safe — anything that is not
unambiguously inside one module escalates to every module, and that default is asserted by a unit
test rather than merely documented.

## Review points

- **The problem was real and measurable.** The blocking PR smoke job ran the whole 81-test monolith on
  every pull request. The split is not speculative tidying: it removes work that was provably
  unrelated to the change under test.
- **The taxonomy is borrowed, not invented.** `audit`, `config`, `i18n`, `iam`, `org`, `profile`
  already exist in both `frontend/src/modules/system/` and `backend/modules/system/`. Reusing them
  means a future contributor can guess the spec filename from the module they edited.
- **The split was verified against the file it replaced, not against itself.** Byte-level equivalence
  of every test block plus the helper region is a stronger claim than "the suite passes", because it
  bounds what *could* have changed. A passing suite would not prove that no assertion was silently
  weakened.
- **The two caught mistakes are the argument for the type-check.** `apiBaseUrl` inside a template
  literal and `formItem` in the registrar block were both dropped by the import analysis and both
  caught by `tsc`, not by reading. `tests/` has no static coverage in CI, so this had to be
  constructed deliberately. That gap is worth fixing separately.
- **The escalation default is the load-bearing decision.** If `resolve-smoke-modules.mjs` ever
  under-selected, the PR gate would quietly shrink instead of re-focusing. The unit test pins the
  behaviour for shared frontend core, shared smoke scaffolding, non-system backend and unknown paths.
- **`smoke-core` was correctly left alone.** Its README forbids promoting it to blocking before it has
  been green for several consecutive runs. Folding it into L1 would have been an easy and wrong move.
- **Two gates pinned the deleted filename and both were updated in the same patch.**
  `check:system-page-admission` reads its target file from JSON config; pointing it at the wrong new
  spec would have made the gate pass vacuously. The replacement file was chosen because it is the one
  that actually contains all four required tokens.
- **`pr-smoke-modules` is blocking when it runs and skipped when nothing is touched.** `skipped` is
  treated as acceptable in the aggregator, so docs-only and governance-only PRs are not blocked by a
  job that never ran. This is stated explicitly in the enforcement clause.
- **Verification gaps are stated, not hidden.** Playwright cannot execute on this host (host-level
  `spawnSync EBUSY`, reproducible with the tool sandbox disabled), so the executed proof is CI. The
  evidence records what was and was not run locally rather than implying a local pass.

## Reviewer posture

- Treat the diff as a mechanical move: if any changed assertion, route string, permission string,
  fixture value or cleanup step appears, that is a defect — there should be none.
- Confirm the equivalence numbers, not the prose: 59/59 blocks, 845/845 helper lines, 69 = 69 type
  errors, 13/13 resolver tests.
- Check the escalation test cases before trusting the module selection. A too-narrow map is the only
  way this change could reduce coverage, and the unit test is the guard.
- Confirm in CI that `PR Smoke Modules` actually ran (not skipped) for a module-scoped PR, and that it
  ran `module:all` for a shared-core PR.
- Do not accept "the local smoke passes" as evidence — it cannot run here. The authoritative
  confirmation is the CI Quality Gates run.
- Follow-ups deliberately not bundled: adding `tests/` to CI's static coverage (69 pre-existing
  errors), and factoring the duplicated mysql/redis service block out of the workflow jobs.
