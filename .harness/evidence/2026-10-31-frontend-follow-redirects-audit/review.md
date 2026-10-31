# Review — 2026-10-31-frontend-follow-redirects-audit (pantheon-base)

## Posture readings

1. **Boundary** — one entry in `frontend/package-lock.json`. `package.json`, the security workflow
   and every source path are untouched.
2. **Failure attribution** — the gate went red without a commit: the advisory range changed under a
   pinned transitive dependency, so the attribution is time, not code.
3. **Fix minimality** — `1.16.0` and `1.16.1` are the only vulnerable releases; `1.16.2` is the
   smallest step out, and `axios`'s range still accepts it.
4. **Lock consistency** — `npm ci` from the edited lock is the proof that the three edited fields
   match what the resolver would write.
5. **Gate integrity** — no `overrides`, no audit exemptions, no threshold change, no `--omit=dev`
   trick. The gate keeps catching this class.
6. **Residual advisories** — the 19 moderate entries stay; they are below the enforced severity and
   need major lint/coverage toolchain upgrades that belong in their own change.
7. **Inheritance** — `frontend/package*.json` are not `sharedPaths`, so this needs no release; the
   consumer applies the same edit in its own repository so both trees stay green.

## Verdict

Approve. Lockfile refresh with no behavioural surface.

## Machine Readable

```json
{
  "taskId": "2026-10-31-frontend-follow-redirects-audit",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/package-lock.json (node_modules/follow-redirects entry only)",
      "docs/harness/tasks/2026-10-31-frontend-follow-redirects-audit.task.md (new packet)",
      ".harness/tasks/2026-10-31-frontend-follow-redirects-audit/manifest.json (new manifest)",
      ".harness/evidence/2026-10-31-frontend-follow-redirects-audit/ (new evidence)"
    ],
    "checks": ["cycle", "hub"],
    "findings": [
      "P3: 19 moderate advisories remain in the frontend dev-tooling chains (@typescript-eslint/*, eslint, minimatch, nyc, vite-plugin-istanbul); they are below --audit-level=high and clearing them needs major toolchain upgrades, so they stay out of this unblocking patch.",
      "P3: the advisory arrived through upstream publication time, not a commit; the same class can turn main red on any day without repository activity, and whether to add a pinned advisory snapshot or an automated remediation lane is a maintainer decision."
    ],
    "notes": "Lockfile refresh only. follow-redirects 1.16.1 (reached through axios@1.20.0) entered the vulnerable range of GHSA-mrwp-f3q8-3g9p; 1.16.2 is the smallest published version outside the range and still satisfies axios's constraint. The entry's version/resolved/integrity triple is edited in place (3 insertions, 3 deletions), then npm ci proves lock consistency, npm ls shows axios@1.20.0 -> follow-redirects@1.16.2, npm audit falls from 1 high to 0 high, and lint/type-check/build stay clean. No overrides entry, no audit exemption, no threshold change, and no frontend/package.json edit. frontend/package*.json are not sharedPaths, so no foundation release is required; pantheon-ops applies the same single-entry edit in its own repository."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-frontend-follow-redirects-audit/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-frontend-follow-redirects-audit/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-frontend-follow-redirects-audit/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-31-frontend-follow-redirects-audit.task.md"
    ]
  }
}
```
