# Dependabot sprintf-js DoS remediation — verification summary

## What the alert was

`gh api repos/duanxldragon/pantheon-base/dependabot/alerts?state=open` returned exactly one open
alert before this change:

| Field | Value |
| --- | --- |
| Alert | #43 |
| Package | `sprintf-js` (npm, dev scope) |
| Manifest | `frontend/package-lock.json` |
| Severity | medium |
| Advisory | GHSA-hp3w-g68c-fv3c / CVE-2026-97058 |
| Vulnerable range | `<= 1.1.3` |
| First patched version | **none** |

Code scanning alerts: 0. Secret scanning alerts: 0.

## Root cause

The vulnerable package was never a direct dependency. It arrived through the coverage tooling:

```
nyc@18.0.0 ─┐
            ├─► @istanbuljs/load-nyc-config@1.1.0 ─► js-yaml@3.15.2 ─► argparse@1.0.10 ─► sprintf-js@1.0.3
vite-plugin-istanbul@9.0.1 ─┘   (deduped onto the same load-nyc-config)
```

`@istanbuljs/load-nyc-config@1.1.0` is the newest release of that package and still pins
`js-yaml: ^3.13.1`. `js-yaml@3` pulls `argparse@^1.0.7`, and `argparse@1.0.10` is the only
consumer of `sprintf-js`. Because `sprintf-js` 1.1.3 is the latest published version and is
still inside the advisory range, Dependabot has no patched version to offer — which is why it
kept reporting `first_patched_version: null` instead of opening a fix PR.

## Fix

`frontend/package.json` gained an `overrides` entry that forces the `js-yaml` dependency of
`@istanbuljs/load-nyc-config` onto the already-present top-level `js-yaml@^5.4.2`:

```json
"overrides": {
  "@istanbuljs/load-nyc-config": {
    "js-yaml": "^5.4.2"
  }
}
```

This is safe because `load-nyc-config` only calls `require('js-yaml').load(...)`
(`index.js:80`), and `load()` still exists in js-yaml v5. The removed `js-yaml@3` chain
(`argparse@1`, `sprintf-js`, `esprima`) drops out of the graph entirely.

`frontend/package-lock.json` was edited surgically — four package entries removed, **45 deleted
lines, zero version changes**. A full re-resolve was explicitly rejected because npm floated 104
unrelated package versions (`@arco-design/web-react`, `data-urls`, `ansi-styles`, the whole
rolldown binding set, …), which is far outside the scope of a security patch.

## Verification performed

1. `npm ls sprintf-js --depth=20` → **empty tree** (was one path before).
2. `npm ci --dry-run` → lockfile accepted as in sync; planned change is exactly
   `remove js-yaml 3.15.2, argparse 1.0.10, sprintf-js 1.0.3, esprima 4.0.1`.
3. `@istanbuljs/load-nyc-config` now resolves `js-yaml` to
   `frontend/node_modules/js-yaml/dist/js-yaml.cjs.js` (v5.4.2) and successfully parsed a
   `.nycrc.yml` (`reporter=lcov,text`, `checkCoverage=true`) → **PASS**.
4. `npm run lint` and `npm run type-check` clean; no source files changed.

## Completion status

completed (pending the default-branch push that lets Dependabot close alert #43)

## Residual risk

- The advisory itself is a denial-of-service via unbounded precision specifiers in a **dev-only**
  code-coverage dependency; it was never reachable from the shipped runtime.
- `sprintf-js` remains unmaintained upstream. If a future dependency reintroduces it, the same
  `overrides` pattern is the documented remedy.
