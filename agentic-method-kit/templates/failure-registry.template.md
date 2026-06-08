# Failure Registry

Use this registry to turn repeated agent or process failures into harness changes.

## Scope

- Repository:
- Owner:
- Review cadence:
- Last reviewed:

## Registry

| Failure ID | Category | Failure Class | Owner Layer | Occurrences | Example | Impact | GitHub Signal | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Promotion Decision | Promotion Deadline | Status |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| `FR-001` | behaviour \| maintainability \| architecture-fitness \| runtime-quality \| method-health | instruction-gap \| task-boundary-gap \| architecture-drift \| test-gap \| static-sensor-gap \| runtime-evidence-gap \| security-boundary-gap \| ci-signal-noise \| method-health-gap | portable-method \| consumer-template \| consumer-repository \| agent-adapter \| no-action | 1 | short concrete example | user/system impact | method-gate \| repo-quality-gate \| runtime-evidence-gate \| external-flaky \| not-applicable | guide path or none | sensor path or none | gate path or none | test/review/human/runtime | sensor or review that missed it | guide/sensor/gate/template/adapter/registry-only/no-action | no-repeat-observed \| guide-updated \| sensor-added \| gate-updated \| template-updated \| adapter-updated \| registry-only | date or none | open \| accepted \| implemented \| rejected |

## Review Notes

- Repeated failures:
- Sensors with false positives:
- Sensors with known false negatives:
- Rules to remove or downgrade:
- Next harness changes:
