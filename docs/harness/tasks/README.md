# Task Packets

Chinese version: [README.zh.md](./README.zh.md)

Create task packets here for non-trivial work:

```text
docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
```

Use:

- `../../../../pantheon-harness/patterns/templates/task-packet.template.md`
- `docs/harness/TASK_PACKET_SPEC.md`

Retention:

- Keep task packets while their evidence, review, remediation, or follow-up work is still active.
- If a task packet is fully superseded by a stable design, acceptance document, or release note, either link that successor from the task packet or delete the task packet during docs cleanup.
- Do not archive task packets only because they are old. Keep them when they explain current remediation state or reusable agent workflow.
- One-off release publication task packets may be deleted once the retained `releases/<version>/` artifact set, release runbook, and release design docs fully capture the enduring record.
- Delete ad hoc process notes such as `.note.md` files once their content is absorbed by a task packet, evidence artifact, release note, or stable contract doc.
- Delete one-off PR body drafts such as `.harness/evidence/*/pr-body.md` once the retained task/evidence/review chain or release artifacts already preserve the enduring record.
