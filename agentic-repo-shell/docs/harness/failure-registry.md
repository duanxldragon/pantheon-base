# Failure Registry

This registry turns repeated agent or process failures into concrete harness changes.

## Scope

- Repository: replace with repository name
- Owner: replace with owner
- Review cadence: after each release or after repeated agent failure
- Last reviewed: replace with date

## Registry

| Failure ID | Category | Example | Impact | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `FR-001` | method-health | The repository adopted the Harness method and seeded a failure registry. | Future repeated failures have a durable place to become guide, sensor, gate, or template changes. | `docs/harness/HARNESS_COVERAGE_MODEL.md` | `scripts/harness/check-failure-registry.mjs` | repository review | method adoption | none | no-action | implemented |

## Review Notes

- Repeated failures: none recorded yet.
- Sensors with false positives: none recorded yet.
- Sensors with known false negatives: none recorded yet.
- Rules to remove or downgrade: none.
- Next harness changes: replace this seed row with real repository failures as they are discovered.
