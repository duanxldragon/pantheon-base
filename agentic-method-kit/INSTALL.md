# Install Agentic Method Kit

Chinese version: [INSTALL.zh.md](./INSTALL.zh.md)

This kit is designed to be copied as a single folder into a repository root.

## 0. Prerequisites

Required:

- `git`
- `node` 20+

Recommended:

- an OpenSpec workflow or CLI if you want explicit change lifecycle management
- a browser testing path for UI evidence

Not required:

- preinstalled local repo skills
- Codex-only or Claude-only plugins
- any specific MCP server

## Versioning Files

This kit publishes its own version information in:

- `VERSION`
- `METHOD_VERSION.json`
- `CHANGELOG.md`
- `UPGRADE.md`

## 1. Copy The Directory

Copy:

```text
agentic-method-kit/
```

into the target repository root.

## 2. Create Or Reuse Standard Paths

The default config expects these locations:

- `docs/harness/tasks/`
- `.harness/evidence/`
- `.github/pull_request_template.md`
- `openspec/changes/`

If your repository uses different paths, update:

- `agentic-method-kit/config/method.config.json`

## 3. Adopt The Templates

Use these templates as your repo-level source material:

- `templates/task-packet.template.md`
- `templates/review.template.md`
- `templates/pr-template.md`

## 4. Wire The Checks

Typical commands:

```text
node agentic-method-kit/scripts/check-task-packet.mjs --root .
node agentic-method-kit/scripts/check-evidence.mjs --root . --strict
node agentic-method-kit/scripts/check-review.mjs --root . --strict
node agentic-method-kit/scripts/check-adoption.mjs --root .
node scripts/harness/check-method-health.mjs --root . --strict
```

## 4.1 How To Operate Day To Day

Typical non-trivial workflow:

1. create an OpenSpec change
2. create `docs/harness/tasks/<task-id>.task.md`
3. if the task has `## Structural Scope`, scaffold graph review closure:
   `node scripts/harness/scaffold-graph-review.mjs --write <task-id>`
4. if you saved CodeGraph-style review output, normalize it and import it:
   `node scripts/harness/build-graph-review-import.mjs --source trace.json --write .harness/evidence/<task-id>/graph-review.json`
   `node scripts/harness/scaffold-graph-review.mjs --write --import .harness/evidence/<task-id>/graph-review.json <task-id>`
5. implement
6. save `.harness/evidence/<task-id>/commands.json`
7. save `.harness/evidence/<task-id>/review.md`
8. run the checks

Example import file:

- `agentic-method-kit/examples/minimal-repo/.harness/evidence/example/graph-review.json`

Typical trivial workflow:

1. implement
2. run minimum verification
3. record evidence or known gaps according to repo policy

## 5. Recommended Repo-Level Wrappers

If the target repo already has local harness scripts, keep them as thin wrappers around this kit.

Recommended wrapper names:

- `check-task-packet`
- `check-evidence`
- `check-review`
- `check-adoption`

## 6. CI Recommendation

Run all four checks on pull requests for non-trivial changes.

If UI is touched, also require browser or screenshot evidence through your normal QA flow.

## 7. Skill Installation Guidance

You do not need to install a special skill pack for the method to work.

If your agent platform supports skills, the recommended split is:

- use skills for workflow assistance
- use repository contracts and scripts as the enforceable source of truth

Recommended but optional capabilities:

- planning / brainstorming
- disciplined execution
- UI quality review
- browser QA
