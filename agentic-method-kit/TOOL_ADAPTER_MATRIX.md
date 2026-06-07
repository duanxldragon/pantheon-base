# Tool Adapter Matrix

Chinese version: [TOOL_ADAPTER_MATRIX.zh.md](./TOOL_ADAPTER_MATRIX.zh.md)

This matrix keeps the method tool-agnostic while still naming practical execution options.

Tools may be recommended by a repository, but they do not define the method. If a tool is unavailable, use another adapter that satisfies the same harness capability.

| Harness capability | Required outcome | Possible adapters |
|---|---|---|
| Change identity | Non-trivial work has a stable change reference | OpenSpec, issue ID, task packet only, human-maintained change log |
| Planning | Work has bounded scope, steps, risks, and verification | superpowers planning, Claude/Codex/Cursor prompt workflow, human plan |
| Execution | Work is implemented against the plan | Codex, Claude Code, Cursor, Copilot, OpenHands, Aider, human engineer |
| UI quality | Visual, interaction, accessibility, and state quality are checked | impeccable, design review agent, human designer, Playwright plus checklist |
| Browser evidence | User flows are inspected in a running app | gstack browse, Playwright, Chrome DevTools MCP, manual browser screenshots |
| Runtime evidence | Logs, metrics, traces, and performance signals are visible | local observability stack, CLI logs, cloud observability APIs, manual exports |
| Review | Findings-first review checks regressions and evidence | review agent, human reviewer, CI report, pair review |
| Mechanical closure | Artifacts are structurally valid and linked | repo-local scripts, CI, pre-commit hooks, manual checklist |

## Adapter Rule

When adopting a new tool, document only:

- which harness capability it satisfies
- what artifacts it reads and writes
- what evidence it produces
- what fallback exists when it is unavailable

Do not move method rules into a tool-only configuration.
