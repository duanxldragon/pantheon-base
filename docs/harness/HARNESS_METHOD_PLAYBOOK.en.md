# Harness Method Playbook

Chinese version: [HARNESS_METHOD_PLAYBOOK.md](./HARNESS_METHOD_PLAYBOOK.md)

Type: Playbook
Layer: platform
Status: Active

This file no longer carries the full method definition.

## Current Relationship

- `agentic-method-kit/`: the single method source, responsible for method orchestration, templates, schema, and portable checks
- `docs/harness/*`: the repo-local contract and landing layer for this repository
- `scripts/harness/*`: the mechanical gates for this repository

## Reading Order

1. First read `agentic-method-kit/README.md`
2. Then read `agentic-method-kit/HARNESS_CORE_MODEL.md`
3. Then read `agentic-method-kit/HARNESS_COVERAGE_MODEL.md`
4. Then read `agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.md`
5. Then read `agentic-method-kit/TOOL_ADAPTER_MATRIX.md`
6. Then read `agentic-method-kit/METHOD_PLAYBOOK.md`
7. Then read the contracts this repository executes locally:
   - `HARNESS_ENGINEERING_CONTRACT.md`
   - `TRIVIALITY_CLASSIFICATION_POLICY.en.md`
   - `TASK_PACKET_SPEC.md`
   - `VERIFICATION_EVIDENCE_SPEC.md`
   - `REVIEW_LOOP_SPEC.md`
   - `VISUAL_QUALITY_PROTOCOL.md`
   - `VISUAL_EVIDENCE_PROMOTION_POLICY.en.md`
   - `FAILURE_RATCHET_POLICY.en.md`
   - `FAILURE_REGISTRY_PROMOTION_POLICY.en.md`
   - `HARNESS_RETIREMENT_REVIEW.en.md`
   - `INHERITANCE_HARNESS_PROTOCOL.md`

## Responsibilities In This Repository

This repository keeps the following because they directly serve local execution:

- `docs/harness/*`: contracts, formats, governance rules
- `scripts/harness/*`: validators and CI gates
- added generic gates: review, template health, runtime evidence, docs links, and sync drift
- `.agents/*` / `.codex/skills/*`: tool adaptation layers

If the method layer conflicts with the repository landing layer, the method definition in `agentic-method-kit/` wins, and the repository landing layer should then be synchronized.
