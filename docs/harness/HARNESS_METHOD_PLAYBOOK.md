---
title: Harness Method Playbook
doc_type: Contract
layer: platform
status: Active
updated_at: 2026-06-08
---

# Harness Method Playbook

English version: [HARNESS_METHOD_PLAYBOOK.en.md](./HARNESS_METHOD_PLAYBOOK.en.md)

本文件不再承载完整方法定义。

## 当前关系

- `agentic-method-kit/`：唯一方法源，负责方法编排、模板、schema、portable checks
- `docs/harness/*`：当前仓库的 repo-local 合同与落地层
- `scripts/harness/*`：当前仓库的 mechanical gates

## 阅读顺序

1. 先读 `agentic-method-kit/README.md`
2. 再读 `agentic-method-kit/HARNESS_CORE_MODEL.md`
3. 再读 `agentic-method-kit/HARNESS_COVERAGE_MODEL.md`
4. 再读 `agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.md`
5. 再读 `agentic-method-kit/TOOL_ADAPTER_MATRIX.md`
6. 再读 `agentic-method-kit/METHOD_PLAYBOOK.md`
7. 再读当前仓库需要落地执行的合同：
   - `HARNESS_ENGINEERING_CONTRACT.md`
   - `TRIVIALITY_CLASSIFICATION_POLICY.md`
   - `TASK_PACKET_SPEC.md`
   - `TOOL_ADAPTERS.md`
   - `VERIFICATION_EVIDENCE_SPEC.md`
   - `REVIEW_LOOP_SPEC.md`
   - `VISUAL_QUALITY_PROTOCOL.md`
   - `VISUAL_EVIDENCE_PROMOTION_POLICY.md`
   - `FAILURE_RATCHET_POLICY.md`
   - `FAILURE_REGISTRY_PROMOTION_POLICY.md`
   - `HARNESS_RETIREMENT_REVIEW.md`
   - `INHERITANCE_HARNESS_PROTOCOL.md`

## 当前仓库职责

当前仓库保留这些内容，是因为它们直接服务本仓库运行：

- `docs/harness/*`：合同、格式、治理规则
- `scripts/harness/*`：校验器和 CI 门禁
- 新增 generic gates：review、template health、runtime evidence、docs links、sync drift
- `.agents/*` / `.codex/skills/*`：工具适配层

如果方法层与仓库落地层出现冲突，以 `agentic-method-kit/` 的方法定义为先，再同步仓库落地层。
