# Evidence Summary: 2026-09-02-foundation-release-v0-10-26-and-ops-sync

Command-level status and explicit gaps are recorded in `commands.json`.

## Scope

- Merge the remaining Base Sonar cleanup branch without changing public API, schema, permission, menu, i18n, or audit contracts.
- Publish `pantheon-base-v0.10.26` only after a successful `Release Gate Summary` on final `main`.
- Consume the immutable release from a clean Pantheon Ops worktree; preserve the dirty primary Ops worktree.

## Local Validation

- `npm run check:docs-frontmatter` - passed.
- `npm run check:task-packet-template` - passed.
- `npm run check:structure` - passed after removing the unreferenced backend-root import rewrite scripts and documenting the existing frontend library entrypoint.
- `npm run check:github-feedback -- --repo duanxldragon/pantheon-base --pr 279` - passed after the review thread was resolved.
- `go test -race ./...` with `CGO_ENABLED=1` and MinGW - passed.
- `gofmt -d` for the 10 Go files reported by hosted `golangci-lint` - passed with no output after formatting; the full Windows CGO race gate passed again.
- `npm run lint` - passed.
- `npm run type-check` - passed.
- `npm run build` - passed, including frontend contract checks.
- `npm install --package-lock-only --ignore-scripts` - passed; only an existing Node engine warning for `jsdom@30.0.1` was reported.
- `frontend/package.json` and the root frontend lockfile package records now identify the release candidate as `0.10.26`; `npm run build` passed again after the version alignment.
- `git diff --check 117a22ce480da72a8604482498e9f1f406e4b665..HEAD` - passed after removal of the obsolete migration guide.

## Hosted Evidence

- PR `#279` merged after its GitHub Feedback Prereq, Quality Gates, Security Gates, SonarCloud, CodeQL, backend tests, and Smoke Sanity checks passed in run `33594919214`.
- The remaining Sonar cleanup branch requires a new PR and its own hosted checks before merge.

## Known Gaps

- The final Base `main` commit and its `Release Gate Summary` do not exist yet.
- The immutable `pantheon-base-v0.10.26` assets and the Ops consumer-lock validation do not exist yet.
- The mechanical and architecture review record is available in `review.md`; release and consumer stop conditions remain pending by design.
