# Review Artifact — govulncheck working-directory fix (#190)

- **Scope**: `.github/workflows/security.yml` only.
- **Change type**: CI configuration fix (working-directory + output path).
- **Logic change**: none in application code.
- **Contracts / permissions / DB / i18n / menu**: unchanged.
- **Reviewer notes**: This restores the govulncheck Security Gate to a working state
  so future vulnerability scans actually run. Trivial, low-risk, safe to merge.
- **Follow-up**: N/A.
