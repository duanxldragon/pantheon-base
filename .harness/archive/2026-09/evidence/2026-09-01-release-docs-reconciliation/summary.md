# Verification Summary: 2026-09-01-release-docs-reconciliation

The Base README, changelog, and bilingual foundation release model now identify `pantheon-base-v0.10.25` and commit `3008d21c40139f369d8c62ed5dde807ae08ddc12` as the published release. The docs also state that only `main` is retained and that `release/0.10` is compatibility metadata rather than a Git branch.

No product code, GitHub release asset, tag, or Ops file changed.

`npm run check:docs-frontmatter`, `npm run check:harness-docs`, and `git diff --check` passed.
