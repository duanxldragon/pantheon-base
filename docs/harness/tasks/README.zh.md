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
