# 任务包目录

English version: [README.md](./README.md)

当工作属于非琐碎任务时，在这里创建 task packet：

```text
docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
```

编写时使用：

- `agentic-method-kit/templates/task-packet.template.md`
- `docs/harness/TASK_PACKET_SPEC.md`

保留规则：

- 当 task packet 对应的 evidence、review、remediation 或后续任务仍然活跃时，保留。
- 如果 task packet 已经被稳定设计、验收文档或 release note 完全取代，应在文档清理时补 successor 链接或删除该 task packet。
- 不要只因为 task packet 旧就归档。只要它仍解释当前整改状态或可复用 agent 工作流，就应保留。
- 一次性的 release 发布 task packet，在 `releases/<version>/` 产物目录、release runbook 与 release 设计文档都已保留后，可以删除。
- 像 `.note.md` 这样的临时过程笔记，一旦内容已经被 task packet、evidence、release note 或稳定合同文档吸收，就应直接删除。
- 像 `.harness/evidence/*/pr-body.md` 这样的一次性 PR 正文草稿，只要保留下来的 task/evidence/review 链或 release 产物已经完整保留长期记录，也应删除。
