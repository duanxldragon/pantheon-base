# Agent Tool Best-Practice To Harness Concept Map

Chinese version: [CONCEPT_MAP.zh.md](./CONCEPT_MAP.zh.md)

This kit borrows architectural ideas from modern coding agent tools and translates them into portable harness patterns.

Representative sources consulted:

- GitHub repo overview: https://github.com/shanraisshan/claude-code-best-practice
- Harness engineering for coding agent users: https://martinfowler.com/articles/harness-engineering.html
- Agent Harness Engineering: https://addyosmani.com/blog/agent-harness-engineering/
- OpenAI Codex harness engineering: https://openai.com/index/harness-engineering/

## Core Ideas Carried Over

### 1. Commands Are Workflow Entry Points

Modern agent tools treat commands as stable workflow entry points.

Portable equivalent:

- stable playbook sections
- reusable prompt entry patterns
- standard task packet templates

### 2. Skills Are Method Modules

Agent tools emphasize skills or reusable capability blocks.

Portable equivalent:

- method modules
- project how-to guides
- repo-local scripts
- tool adapters

The important idea is not “use one magic system”, it is “compose specialized modules into one default method”.

### 3. Subagents Are Specialized Workers

Agent tools increasingly separate planner, generator, evaluator, reviewer, and janitor roles.

Portable equivalent:

- role-specific work contracts
- separate implementation and evaluation passes
- parallel bounded subtasks when supported
- human role as final owner of goals and tradeoffs

### 4. Hooks Become Mechanical Gates And Sensors

Agent tools use hooks and lifecycle scripts heavily.

Portable equivalent:

- repo-local check scripts
- CI gates
- template-enforced linkage
- runtime or browser sensors
- review gates

This is more portable than relying on one tool's hook runtime.

### 5. Memory Becomes Repo Artifacts

Agent tools use memory scopes, resumable sessions, context compaction, and handoff artifacts.

Portable equivalent:

- OpenSpec change artifacts
- task packets
- evidence
- archived plans/specs

These are inspectable, copyable, and survive tool changes.

### 6. Guides And Sensors Are First-Class

Harness engineering distinguishes feedforward guides from feedback sensors.

Portable equivalent:

- guides: repo rules, contracts, specs, task packets, plans
- sensors: tests, static checks, browser evidence, observability, review
- gates: explicit pass/fail or approval decisions

### 7. MCP And External Tools Stay Optional

Agent tools include MCP servers, plugins, browser tools, or hosted sandboxes.

Portable rule here:

- method should work without any one MCP dependency
- when tools exist, they plug into the same workflow, they do not redefine it

## The Main Translation

The biggest portable lesson is:

- do not make the tool the method
- make the method explicit, then map each tool into it

That is why this kit centers:

- playbook
- templates
- schemas
- mechanical closure scripts

instead of one tool-specific config file.

See also:

- [HARNESS_CORE_MODEL.md](./HARNESS_CORE_MODEL.md)
- [HARNESS_COVERAGE_MODEL.md](./HARNESS_COVERAGE_MODEL.md)
- [HARNESS_TEMPLATE_TAXONOMY.md](./HARNESS_TEMPLATE_TAXONOMY.md)
- [TOOL_ADAPTER_MATRIX.md](./TOOL_ADAPTER_MATRIX.md)
