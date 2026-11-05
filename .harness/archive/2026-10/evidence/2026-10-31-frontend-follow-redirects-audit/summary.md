# Summary — 2026-10-31-frontend-follow-redirects-audit (pantheon-base)

## What happened

`follow-redirects@1.16.1`, reached through `axios@1.20.0`, entered the advisory range of
GHSA-mrwp-f3q8-3g9p (high, CWE-201, `>=1.16.0 <=1.16.1`). Nothing in the repository changed; the
dependency gate simply started failing on the same lock. The consumer (`pantheon-ops`) hit it first
on `main`; base carries the identical pin.

## What changed

One lock entry in `frontend/package-lock.json`: `node_modules/follow-redirects` moves from
`1.16.1` to `1.16.2` (version, resolved URL, integrity) — three lines in, three lines out.
`frontend/package.json` is untouched, no `overrides` entry is added, no workflow or source file
changes.

`1.16.2` is the smallest published version outside the advisory range and still satisfies
`axios`'s constraint, so the resolver keeps owning the version. `npm audit fix` would also
re-resolve `@typescript-eslint/*`, `i18next` and `react-i18next`; `npm update` rewrites unrelated
`libc` fields on optional platform packages. Both were rejected in favour of the single entry edit
proven by `npm ci`.

## Verification

- `npm ci` from the edited lock installs cleanly and `axios@1.20.0 -> follow-redirects@1.16.2`.
- Frontend audit: high 0, critical 0 (19 moderate remain, all below the gate threshold and all in
  dev-tooling chains that would need major upgrades).
- `lint`, `type-check` and `build` are clean.

## Inheritance note

`frontend/package*.json` are not foundation `sharedPaths`, so no new tag or release is needed. The
consumer repo applies the same single-entry edit to its own lock, which keeps both trees green
without a rebuild round.
