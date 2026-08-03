# Summary

`quality.yml` exempted Dependabot from heavy PR-body ceremony, but
`pr-automation.yml` independently ran the same body validator. This duplicate
policy drift made every Dependabot PR fail `PR Governance Prereq` even though
all product, security, documentation, and SonarCloud checks passed.

The PR automation prerequisite now uses the same Dependabot policy while
keeping body validation mandatory for human and agent-authored PRs. Regression
coverage protects both the skip condition and the successful prerequisite
output needed by the existing auto-merge path.
