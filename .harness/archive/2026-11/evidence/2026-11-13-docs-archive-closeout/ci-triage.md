# CI Triage: large completed-work archive

Workflow: Code Quality Gates (.github/workflows/quality.yml). Job: Change Scope. Step: Resolve touched smoke modules. Failed head9034d4f3; run43429346051.

Annotation reports process /usr/bin/bash could not start: Argument list too long. CHANGED_FILES_JSON from dorny all_files includes long archive paths. Existing governance-only classification already skips all runtime smoke gates. Minimal repair avoids spawning this redundant resolver for that classification, preserving resolver execution for mixed/application changes.

Evidence: ci-failure-annotations.json; quality-regression-red.log.gz; quality-regression-green.log.gz; actionlint.log.gz. Linux single-string limit is represented by a fixture over128KiB; predicate truth table evaluates the actual YAML guard for PR/push governance-only and mixed changes. Existing resolver suite confirms module selection. Exact hosted replay remains required.

## CI Unit Tests continuation — PR #512

CI run43432817954, Unit Tests job131910312426, step Run npm script tests failed on head2e42531975e9430401e88725577aaab64f76a499. Scripts209/208/1: task-manifest-status.test.mjs expected at least one task manifest. All completed tasks have moved to monthly archives, so the live-only inventory is empty. Local npm run test:scripts reproduced the failure (commands.json entry70); after including live and monthly archived manifests, the full suite passes210/210, zero skips (entry71). The nonempty assertion remains, and an archive-only fixture confirms illegal done still fails schema validation. No product helper, dependency, status vocabulary, archived history or quality policy changed. Full hosted replay pending. Hosted failure and hashes: unit-test-hosted-failure.json.
