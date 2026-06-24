# Context Engineering Protocol

Chinese version: [CONTEXT_ENGINEERING_PROTOCOL.zh.md](./CONTEXT_ENGINEERING_PROTOCOL.zh.md)

This protocol distills portable workflow methods from memory-first and skill-driven agent systems into repo-owned Harness Engineering assets.

It is not a Claude-only or Codex-only feature guide. It defines how durable context should be stored, loaded, retrieved, redacted, and promoted inside the harness.

## 1. Goals

Use this protocol to:

- reduce repeated human restatement of the same project context
- keep high-value context durable across session resets and handoffs
- retrieve prior state in stages instead of front-loading full transcripts or logs
- keep sensitive or non-retainable context out of shared durable state unless explicitly required

## 2. Context Surfaces

Not all context belongs at the same layer.

Recommended precedence:

1. repo-owned contracts and entry files
2. current task packet, plan, and structural-scope notes
3. evidence summaries, review summaries, and decision logs
4. raw evidence such as commands, logs, traces, and screenshots
5. local-only notes, personal preferences, or tool-managed auto-memory

Rules:

- Keep entry surfaces short and deep by link.
- If two surfaces disagree, prefer repo-owned contracts and current task state over private or tool-managed memory.
- Do not treat tool-local memory as a source of truth when the repository already has explicit state.

## 3. Progressive Retrieval

Retrieve context in layers.

### Layer 1: Index

Use compact signals first:

- task IDs
- file paths
- short summaries
- review finding titles
- decision labels

### Layer 2: Scoped Narrative

Then load only the bounded story that explains the current branch of work:

- relevant task packet sections
- `summary.md`
- review findings
- timeline or decision summaries

### Layer 3: Raw Detail

Fetch raw artifacts only after the first two layers narrow the need:

- `commands.json`
- full logs or traces
- screenshots
- transcript fragments

Default retrieval order:

```text
entry guides -> task packet -> summary/review -> raw evidence
```

Rules:

- Prefer the current file, task, or affected subgraph.
- Batch related raw retrieval instead of opening many small artifacts one-by-one.
- Avoid replaying the same transcript or log fragments into context after the summary already captures the point.

## 4. Resume And Checkpoints

Long-running work must survive context reset through repo state, not through chat memory alone.

Use durable artifacts for resume:

- task packet
- evidence summary
- review artifact
- decision log
- explicit resume artifacts listed by the task packet

Use checkpoints or rewind features for reversible exploration when the runtime supports them, but keep these rules:

- checkpoints are for experimentation, not for auditable closure
- checkpoints are not a substitute for version control
- once an experiment wins, write the chosen path back into repo state

## 5. Sensitive Context

Shared durable state should not become a secret dump.

Rules:

- Store secrets in shared artifacts only when the repository explicitly requires it and the storage path is approved.
- Otherwise store redacted placeholders, stable aliases, or operator-only references.
- Tool adapters may offer private tags, local-only notes, or excluded memory scopes. The portable method requirement is simpler: non-retainable input must stay out of shared durable state.

## 6. Adapter Guidance

Tool adapters should help the protocol, not replace it.

### Skills And Guides

Use progressive disclosure:

```text
metadata -> focused instructions -> referenced resources/scripts
```

Do not front-load large manuals when a short entry guide plus linked depth is enough.

### Hooks And Context Injection

Hooks may preload, validate, or summarize context, but they should:

- inject only relevant and bounded material
- prefer summaries over raw transcripts
- deduplicate repeated history
- avoid blocking primary coding work because an auxiliary helper is temporarily unavailable

### Failure Semantics

Memory or context helper failures should usually degrade gracefully.

Block the workflow only when the failure means:

- a contract or safety rule cannot be enforced
- the retrieved context is known to be misleading
- a required audit trail would be lost

## 7. Task Packet Usage

For long-running, high-context, cross-session, or sensitive tasks, add a short `Context Strategy` section to the task packet:

```md
## Context Strategy

- Entry Sources: `AGENTS.md`, `CLAUDE.md`, current task packet, latest review summary
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none | redact tokens and keep secrets out of .harness artifacts`
```

This section does not replace linkage or evidence. It simply makes the loading order and privacy boundary explicit before work begins.
