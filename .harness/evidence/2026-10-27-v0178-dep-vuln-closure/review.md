# Findings-first Review — v0.17.8 Dependency Vulnerability Closure

## Findings

### P2 — Base owns the files but did not see the defects; the first signal came from the consumer

`GO-2026-6809` and `GHSA-mrhx-c7xc-m3w5` are pinned in base-owned files, yet nothing in base's own CI
reported them. `.github/workflows/security.yml` runs its scanners in report-only mode (the non-zero
exits are absorbed, documented there as a time-boxed exception tracked by the maintainer), so base's
`Security Gates` stayed green while `pantheon-ops` main, which runs the same scanners with a blocking
`Enforce dependency vulnerability gate` and no `|| true`, went red. The routing of the fix to base is
correct; the routing of the *detection* was not — the owner of a dependency contract learned about its
vulnerabilities from a downstream consumer's gate.

Evidence: ops run `40457897311`, job `Dependency Vulnerabilities` `122035403107`, step echo
`npm audit (frontend): failure` / `osv call analysis: failure`, while the equivalent base workflow has
the same scanners guarded.

This round does not close it. Promoting base's security gate from advisory to blocking changes merge
policy and is a maintainer decision, exactly like the outstanding FR-016 / FR-017 wiring question. It
is recorded so the next round does not have to rediscover it.

### P2 — Reproducing the failing gate locally: first diagnosis was wrong, then corrected

The round's acceptance claims that ops's two failing inputs flip green. The first pass measured that
indirectly — `govulncheck` v1.3.0 on the real base source (`No vulnerabilities found`, 0 called) plus
an `osv-scanner` v2.3.3 lockfile differential — because the consumer's exact command, a whole-tree
`--call-analysis=go` scan, reported `No package sources found` here (exit 128).

The explanation written into this file at the time — "osv-scanner skips paths containing dot-prefixed
segments" — was false, and it is corrected rather than quietly replaced. A control experiment on the
same v2.3.3 scanned `.../plain/.wt/proj` and a D: drive path with no trouble, so hidden segments are
not skipped. The actual cause is that OSV's recursive mode honours `.gitignore`, and
`pantheon-base/.gitignore:26` ignores `.tmp/`, which is where this linked worktree lives. Nothing about
the gate was weakened to get around it; `--no-ignore` is a scan-scope correction, not a threshold
change. With it, base's own call-graph reading is now on record: backend `go.mod` yields one vulnerable
group, `golang.org/x/crypto 0.57.0` / `GO-2026-5932`, `called: false`, 0 reported vulnerabilities,
scanner exit 0 — the same instrument and flags the consumer's `Enforce OSV call analysis` step uses,
run against the post-fix tree.

So the debt this finding recorded is paid on the base side. The ops reading on `main` after consuming
v0.17.8 stays as the confirmation that the aggregate gate step goes green, which is the thing no
local run can assert for another repository.

### P3 — One fact, four hand-maintained copies

The Go version is read from `backend/go.mod` by every workflow (`go-version-file`), from the
`Dockerfile` image tag by container builds, and from prose in `README.md`, `README.en.md` and
`docs/DEPLOYMENT_GUIDE.md`. Nothing checks that those agree, so this round had to propagate 1.26.10 to
five places by hand — and had to notice, separately, that the Dockerfile was stale at 1.26.5 even
before this change (a three-patch-line drift that only became visible because the directive moved).

A checker comparing the `golang:*-alpine` tag against the `go` directive would be the sensor. It is not
added here: writing a new strict checker is a gate change, and the last time an unchecked advisory
checker existed (`check-evidence`) it was red on `main` precisely because nothing ran it. The
maintenance cost of a new gate is a decision for the maintainer.

## Positive Signals

- The ownership decision was made from the overlay contract rather than from instinct. Reading
  `business-overlay.json` first is what shows that a consumer-side bump of `go.mod` or
  `package-lock.json` is not a fix but a temporary state that the next `rebuild:from-base` deletes;
  had this round started in ops it would have produced exactly the "green PR, reverted tree" class of
  bug the inheritance model is meant to prevent.
- Both fixes carry a measured before/after: `npm audit` 1 high → 0, OSV 3 vulnerable groups → 1 with
  the two blocking advisories gone. The pre-fix readings were taken against the old files, not quoted
  from the advisory database.
- No gate, threshold, or scanner configuration was touched. `Enforce OSV call analysis`,
  `npm audit --audit-level=high` and `Enforce dependency vulnerability gate` still fail on the same
  conditions; only their inputs changed.
- The lockfile stayed minimal on purpose. Accepting `npm update`'s incidental deletion of six `libc`
  arrays would have mixed a host-npm artifact into a security patch, so the churn was reverted and the
  reduced lock re-verified by a real `npm ci` and build rather than by inspection.
- `zod`'s blast radius was established before shipping, not after: `src/` has no import, and the only
  consumers are `eslint-plugin-react-hooks` and `zod-validation-error` with a `^4.0.0` range, which is
  why `npm run lint` is a meaningful compatibility reading rather than a formality.

## Decision

Accept this round and publish it as `pantheon-base-v0.17.8`. The two P2s are real but neither is
closable inside a dependency patch: one is a merge-policy change reserved to the maintainer, the other
is explicitly handed to the ops consumption round as its gate-level proof. The P3 stays open on
purpose — the version-copy problem is documented now, and the sensor for it should be scheduled on its
own merits rather than attached to a security release.

## Unknowns

- Whether ops's seven open dependabot PRs collide with the base-owned `package-lock.json` once the
  consumer rebuilds from v0.17.8. Several are `CONFLICTING` today; the consumption round has to
  disposition them rather than assume they self-close.
- Whether `zod` 4.3.6 → 4.6.7 changes any validation behaviour beyond what ESLint exercises. In this
  tree nothing else calls it, so no test could reveal a difference even if one existed; the range
  statement is `^4.0.0` and the observed lint run is clean, which is the whole of the evidence.

## Machine Readable

```json
{
  "taskId": "2026-10-27-v0178-dep-vuln-closure",
  "status": "reviewed",
  "verdict": "approved with documented P2 follow-up",
  "findings": [
    {"id": "R1", "severity": "P2", "title": "base owns the pinned files but its report-only security workflow never surfaced the advisories; detection came from the consumer gate", "state": "recorded-maintainer-gate-policy"},
    {"id": "R2", "severity": "P2", "title": "the first local root cause for the unreproducible OSV scan was wrong (dot-prefixed paths) and was replaced by the verified one (.gitignore honours .tmp/); the same command with --no-ignore now gives base its own gate reading", "state": "corrected-and-reproduced-locally"},
    {"id": "R3", "severity": "P3", "title": "the Go version lives in five hand-maintained places with no checker comparing the Dockerfile tag to the go directive", "state": "open-by-design"}
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "backend/go.mod",
      "frontend/package-lock.json",
      "Dockerfile",
      ".github/workflows/security.yml"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "R1: base-owned dependency inputs are scanned blocking in the consumer and report-only in the owner, so the owner learns about defects downstream-first",
      "R3: go.mod, Dockerfile and three prose documents are unlinked copies of one version fact"
    ],
    "notes": "No module or call graph changes: no product source file is touched, so cycles and hubs are unchanged by construction. The sensitive flow affected is dependency resolution (toolchain and dev toolchain versions), not authentication, permission or tenant isolation."
  },
  "residualRisk": [
    "golang.org/x/crypto GO-2026-5932 stays in the required graph; both scanners report it not called, and replacing openpgp is a maintainer dependency-risk decision.",
    "SonarCloud Scan stays red on both repositories (SONAR_TOKEN 403 since 2026-09-17), so ops main is not fully green from this round alone.",
    "The gate-level proof for ops lives in the consumption round; if ops main is still red after rebuilding from v0.17.8, the defect is in the consumption path rather than in these two version moves."
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-v0178-dep-vuln-closure/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-v0178-dep-vuln-closure/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-v0178-dep-vuln-closure.task.md",
      "docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md",
      "RELEASE_NOTES_v0.17.8.md"
    ]
  }
}
```
