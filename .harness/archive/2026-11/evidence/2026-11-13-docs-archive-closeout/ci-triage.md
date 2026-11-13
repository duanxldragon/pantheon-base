# CI Triage: large completed-work archive

Workflow: Code Quality Gates (.github/workflows/quality.yml). Job: Change Scope. Step: Resolve touched smoke modules. Failed head9034d4f3; run43429346051.

Annotation reports process /usr/bin/bash could not start: Argument list too long. CHANGED_FILES_JSON from dorny all_files includes long archive paths. Existing governance-only classification already skips all runtime smoke gates. Minimal repair avoids spawning this redundant resolver for that classification, preserving resolver execution for mixed/application changes.

Evidence: ci-failure-annotations.json; quality-regression-red.log.gz; quality-regression-green.log.gz; actionlint.log.gz. Linux single-string limit is represented by a fixture over128KiB; predicate truth table evaluates the actual YAML guard for PR/push governance-only and mixed changes. Existing resolver suite confirms module selection. Exact hosted replay remains required.
