# Evidence Summary — foundation-release bundle tar fix (Windows)

## Problem
`npm run release:foundation:cut` failed at the `createArchive` step:
`tar (child): Cannot connect to D: resolve failed`. Node's `path.join` yields
native Windows paths (`D:\workspace\...`), and Git Bash's `tar` treats `D:` as a
remote tape device.

## Fix
Added `toPosixPath()` in `build-release-bundle.mjs` and used it for the `tar`
subprocess args (`-czf <archive>` and `-C <distRoot>`), converting
`D:\workspace\...` → `/d/workspace/...`. `dist/` was already gitignored; added
`releases/` to `.gitignore` so `publish`'s clean-worktree check passes on the
next cut+publish cycle.

## Verification
- After fix, `cut` produces `dist/foundation-releases/base-v0.9.0/foundation-release-base-v0.9.0.tgz`.
- `base-v0.9.0` tag + GitHub release published successfully.

## Risk
Low. Tooling-only change; no product/runtime impact.
