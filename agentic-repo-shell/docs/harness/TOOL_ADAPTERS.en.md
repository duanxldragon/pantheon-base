# Tool Adapters

Chinese version: [TOOL_ADAPTERS.md](./TOOL_ADAPTERS.md)

Type: Design
Layer: method
Status: Active

This document explains how the method layer supports multiple agent tools without becoming locked into any one tool.

## 1. Adapter Principles

An adapter only maps the shared protocol into a concrete tool.

The shared protocol lives in:

- `docs/harness/HARNESS_METHOD_PLAYBOOK.md`
- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`
- `docs/harness/AGENT_INTERFACE_CONTRACT.md`
- `docs/harness/TASK_PACKET_SPEC.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/harness/REVIEW_LOOP_SPEC.md`

`HARNESS_METHOD_PLAYBOOK.md` answers what should happen first, what happens next, and what each tool is responsible for. The other contracts define boundaries, formats, and gates.

Tool-specific guidance lives in:

- `.agents/adapters/codex.md`
- `.agents/adapters/claude-code.md`
- `.agents/adapters/cursor.md`
- `.agents/adapters/github-copilot.md`
- `.agents/adapters/openhands.md`
- `.agents/adapters/opencode.md`, if the repository adopts opencode
- `.agents/adapters/human.md`

## 2. Lock-In States That Are Not Allowed

The following states are not allowed:

- critical process lives only in `.codex/skills`
- critical review rules live only in a Claude prompt
- critical architecture boundaries live only in Cursor rules
- task evidence exists only in chat history
- CI cannot independently verify the completion state claimed by an agent

## 3. Allowed Tool Differences

Different tools may execute differently:

- Codex may use skills and sandbox approval
- Claude Code may use Todo and Skill tools
- Cursor may use rules and composer
- Copilot may use issue/PR instructions
- OpenHands may use repository instructions and runtime scripts
- opencode or another agent may use its own planning, patching, and command execution model
- humans may execute from task packets and commands

But they must share:

- task packet
- verification plan
- evidence format
- review findings format
- human gate rules

## 4. Relationship To Agent Tools

Harness Engineering is not a replacement for Codex, Claude Code, Cursor, opencode, or any future agent. It is the repository-level control system those tools operate within.

Agents decide how to plan, edit, run commands, and summarize. Harness decides what must be known before work starts, what evidence proves completion, which changes require human judgment, and how failures ratchet into better guides, templates, sensors, or gates.
