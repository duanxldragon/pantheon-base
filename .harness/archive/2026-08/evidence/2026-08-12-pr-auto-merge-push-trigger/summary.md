# Evidence Summary

PR `#247` proved that `github.token` can enable squash auto-merge, but the resulting merge commit did not receive GitHub Actions `push` workflows because GitHub suppresses recursive workflow execution for merges performed with the repository token.

This remediation requires the existing `RELEASE_GATE_TOKEN` for the merge operation, fails closed instead of falling back to `github.token`, adds manual CI recovery, and protects both behaviors with source-level workflow tests. Hosted evidence must confirm that the merged commit receives exact-commit push workflows before publication.
