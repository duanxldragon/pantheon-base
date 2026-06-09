# Tool Adapters

English version: [TOOL_ADAPTERS.en.md](./TOOL_ADAPTERS.en.md)

类型：Design
归属层：method
状态：Active

本文说明方法层如何支持多种 agent 工具而不被某个工具锁死。

## 1. Adapter 原则

Adapter 只负责把通用协议映射到具体工具。

通用协议在：

- `docs/harness/HARNESS_METHOD_PLAYBOOK.md`
- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`
- `docs/harness/AGENT_INTERFACE_CONTRACT.md`
- `docs/harness/TASK_PACKET_SPEC.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/harness/REVIEW_LOOP_SPEC.md`

其中 `HARNESS_METHOD_PLAYBOOK.md` 负责回答“默认先做什么、再做什么、每个工具负责什么”；其余合同负责边界、格式和门禁。

工具说明在：

- `.agents/adapters/codex.md`
- `.agents/adapters/claude-code.md`
- `.agents/adapters/cursor.md`
- `.agents/adapters/github-copilot.md`
- `.agents/adapters/openhands.md`
- `.agents/adapters/opencode.md`（如项目采用）
- `.agents/adapters/human.md`

## 2. 不允许的锁定

不允许出现以下状态：

- 关键流程只写在 `.codex/skills`。
- 关键 review 规则只写在 Claude prompt。
- 关键架构边界只写在 Cursor rule。
- 任务证据只存在于聊天记录。
- CI 无法独立验证 agent 声称的完成状态。

## 3. 允许的工具差异

不同工具可以有不同执行方式：

- Codex 可以使用 skills 和 sandbox approval。
- Claude Code 可以使用 Todo 和 Skill tool。
- Cursor 可以使用 rules 和 composer。
- Copilot 可以使用 issue/PR instructions。
- OpenHands 可以使用 repo instructions 和 runtime scripts。
- opencode 或其他 agent 可以使用自身的计划、补丁和命令执行能力。
- 人工可以按 task packet 和命令执行。

但它们必须共享：

- task packet
- verification plan
- evidence format
- review findings format
- human gate 规则

## 4. 与 Agent 工具的关系

Harness Engineering 不是 Codex、Claude Code、Cursor、opencode 或未来 agent 的替代品。它是这些工具共同遵守的仓库级控制系统。

Agent 决定如何计划、编辑、执行命令和总结；Harness 决定开工前必须知道什么、什么证据证明完成、哪些变更必须交给人判断，以及重复失败如何升级为 guide、template、sensor 或 gate。
