# Summary — Base freeze: SonarCloud zero-open-issue control + workflow supply-chain hardening

## Goal

Close Pantheon Base for version freeze: remediate open SonarCloud findings in
code, harden GitHub Actions supply-chain posture, and strengthen the Release
Gate so the freeze is provably free of unresolved static-analysis debt.

## Changes

### SonarCloud code remediation (scripts)

| File | Finding class | Fix |
|------|--------------|-----|
| `frontend/scripts/check-shell-visual-contract.mjs` | Regex built from unescaped input (reliability) | `hasDeclaration` now escapes property and value internally; ~30 call sites pass plain CSS values instead of hand-double-escaped patterns |
| `scripts/harness/check-boundaries.mjs` | Redundant filter/validation flow | `--repo` validated against `REPOSITORIES` directly, then selected — same behavior, simpler data flow |
| `scripts/harness/{check-evidence,scaffold-graph-review,build-graph-review-import}.mjs` | S106-class console output for machine-readable JSON | JSON output moved to `process.stdout.write` |
| `scripts/create-pr.mjs` | Unvalidated CLI input reaching `execFileSync` | `validateCliInput` allowlist patterns for title/branch/message/profile; explicit `shell: false` |

### Workflow supply-chain and least-privilege hardening

- `npm ci --ignore-scripts` everywhere in CI (ci/quality/security/smoke-full
  workflows and Dockerfile), followed by explicit `npm run patch:arco-react19`
  where the frontend needs the Arco patch (it was previously a postinstall
  hook — now invoked explicitly, no arbitrary lifecycle scripts run in CI).
- `npx tsc`/`npx eslint`/`npx playwright` → `./node_modules/.bin/...` so CI
  can never fall back to fetching an unpinned package from the registry.
- `lint-workflows.yml`: actionlint installed via `go install ...@v1.7.10`
  with SHA-pinned `setup-go` instead of `bash <(curl ...)`.
- `pr-automation.yml`: top-level write permissions removed; split into
  `governance-prereq` + `feedback-prereq` (read-only) gating
  `automate-solo-pr` (write scoped to that job only); triggers extended to
  reopened/edited/ready_for_review; draft handler gets scoped `issues: write`.
- `security.yml`: summary job renamed `security-gates` and now hard-fails if
  dependency-vulnerabilities, workflow-security, or codeql-scan failed
  (previously only secret-scan and CodeQL alert count were enforced).
- `quality.yml` test pin: `dorny/paths-filter` moved to
  `7b450fff21473bca461d4b92ce414b9d0420d706` with matching test update.

### Release Gate policy alignment

`release-gate.yml` Gate 3 now requires **zero OPEN issues of any type**
(BUG, VULNERABILITY, and CODE_SMELL) on SonarCloud, not just bugs/vulns.
Per the task packet, bulk acceptance is not a release path; a genuine false
positive requires an individually documented rationale.

## Verification

See `commands.json`: quality-workflow tests 3/3, shell visual contract pass,
boundaries 0 findings, harness sync/inventory strict 0 findings, docs
frontmatter / structure / pr-governance / task-packet-template all green,
pr-governance test suite 6/6. actionlint runs in CI (Lint Workflows job).

## Risk

CI-workflow + tooling-script change; no `backend/` or `frontend/src/` runtime
code touched. Behavioral risks and their controls:

- `--ignore-scripts` could skip a needed lifecycle hook → the only required
  hook (`patch:arco-react19`) is now invoked explicitly at every site.
- Stricter `security-gates` could newly block merges → it only enforces jobs
  that were already expected green; a red there was previously silent risk.
- Release Gate CODE_SMELL=0 is intentionally strict for the freeze window.
