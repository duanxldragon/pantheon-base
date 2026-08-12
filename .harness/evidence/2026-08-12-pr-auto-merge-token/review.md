# Review Artifact

## Scope

- Layer: `ci-workflow`.
- Runtime-sensitive: yes, because merge automation changes repository state.
- Product UI impact: none.

## Review Focus

- The write-scoped job passes `github.token` only to the merge step.
- A failed `gh pr merge --auto` command exits non-zero.
- The regression test rejects the previous fail-open workflow shape.

## Residual Gate

- Hosted GitHub Actions must prove the workflow can enable auto-merge on this PR.
