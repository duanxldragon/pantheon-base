# Task Packets

English version: [README.md](./README.md)

非 trivial 工作在这里创建 task packet：

```text
docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
```

使用：

- `../../../../pantheon-harness/patterns/templates/task-packet.template.md`
- `docs/harness/TASK_PACKET_SPEC.md`

保留策略：

- 当 task packet 仍关联活跃 evidence、review、remediation 或 follow-up 时保留。
- 如果 task packet 已被稳定设计、验收文档或 release note 完全替代，要在 task packet 中链接 successor，或在文档清理时删除。
- 不要只因为 task packet 旧就归档；当它仍解释当前整改状态或可复用 agent workflow 时应保留。
- 一次性 release 发布 task packet 可在 `releases/<version>/` artifact、release runbook 和 release design docs 已完整保留长期记录后删除。
- `.note.md` 等临时过程笔记应在内容被 task packet、evidence artifact、release note 或稳定合同文档吸收后删除。
- `.harness/evidence/*/pr-body.md` 等一次性 PR body 草稿应在 task/evidence/review 链或 release artifact 已保留长期记录后删除。
