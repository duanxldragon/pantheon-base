# Harness Method Playbook

English version: [HARNESS_METHOD_PLAYBOOK.en.md](./HARNESS_METHOD_PLAYBOOK.en.md)

类型：Playbook
归属层：method
状态：Active

本文件不再承载完整方法定义。

## 当前关系

- `agentic-method-kit/`：唯一方法源，负责方法编排、模板、schema、portable checks
- `docs/harness/*`：当前仓库的 repo-local 合同与落地层
- `scripts/harness/*`：当前仓库的 mechanical gates

## 阅读顺序

1. 先读 `agentic-method-kit/README.zh.md`
2. 再读 `agentic-method-kit/HARNESS_CORE_MODEL.zh.md`
3. 再读 `agentic-method-kit/METHOD_FIRST_DELIVERY_POLICY.zh.md`
4. 再读 `agentic-method-kit/HARNESS_COVERAGE_MODEL.zh.md`
5. 再读 `agentic-method-kit/CROSS_AGENT_RATCHET_MODEL.zh.md`
6. 再读 `agentic-method-kit/DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md`
7. 再读 `agentic-method-kit/HUMAN_AGENT_COLLABORATION_PLATFORM_ASSESSMENT.zh.md`
8. 再读 `agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.zh.md`
9. 再读 `agentic-method-kit/TOOL_ADAPTER_MATRIX.zh.md`
10. 再读 `agentic-method-kit/METHOD_PLAYBOOK.zh.md`
11. 再读当前仓库需要落地执行的合同：
   - `HARNESS_ENGINEERING_CONTRACT.md`
   - `TRIVIALITY_CLASSIFICATION_POLICY.md`
   - `TASK_PACKET_SPEC.md`
   - `VERIFICATION_EVIDENCE_SPEC.md`
   - `REVIEW_LOOP_SPEC.md`
   - `VISUAL_QUALITY_PROTOCOL.md`
   - `VISUAL_EVIDENCE_PROMOTION_POLICY.md`
   - `FAILURE_RATCHET_POLICY.md`
   - `FAILURE_REGISTRY_PROMOTION_POLICY.md`
   - `HARNESS_RETIREMENT_REVIEW.md`
12. 如果当前仓库采用项目专属 overlay，再读取 overlay-owned protocols、checker 和升级规则。

## 当前仓库职责

当前仓库保留这些内容，是因为它们直接服务本仓库运行：

- `docs/harness/*`：合同、格式、治理规则
- `scripts/harness/*`：校验器和 CI 门禁
- 新增 generic gates：review、template health、runtime evidence、docs links、sync drift
- `.agents/*` / `.codex/skills/*`：工具适配层

如果方法层与仓库落地层出现冲突，以 `agentic-method-kit/` 的方法定义为先，再同步仓库落地层。
