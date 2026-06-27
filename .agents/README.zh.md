# Agent Adapters

English version: [README.md](./README.md)

这个目录包含面向不同工具的、用于适配仓库 Harness 协议的 adapter。

事实源不是某一个单独 adapter。建议先读：

1. `../../pantheon-harness/patterns/README.md`
2. `../../pantheon-harness/patterns/method-playbook.md`
3. `../../pantheon-harness/patterns/execution-guardrails.md`
4. `../../pantheon-harness/patterns/context-engineering-protocol.md`
5. `docs/harness/HARNESS_METHOD_PLAYBOOK.md`
6. `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`
7. `docs/harness/AGENT_INTERFACE_CONTRACT.md`
8. `docs/harness/TASK_PACKET_SPEC.md`
9. `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
10. `docs/harness/REVIEW_LOOP_SPEC.md`

这些 adapters 的作用，是把这套共享协议映射到不同工具：

- `adapters/codex.md`
- `adapters/claude-code.md`
- `adapters/cursor.md`
- `adapters/github-copilot.md`
- `adapters/openhands.md`
- `adapters/human.md`

仓库本地 Codex skills 放在：

- `skills/README.zh.md`
