# Evidence Summary

PR `#246` completed every required check but stayed open because the auto-merge step invoked GitHub CLI without `GH_TOKEN`. The command failed while the workflow swallowed the failure and reported success.

This change injects `github.token`, removes the failure-swallowing branch, and adds a source-level workflow regression test.
