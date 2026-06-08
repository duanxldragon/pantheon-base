# Agentic Repo Shell

Chinese version: [README.zh.md](./README.zh.md)

This directory is the copyable repo shell for a new project.

Use it together with:

- `agentic-method-kit/`

## Composition

- `agentic-method-kit/`: portable method source of truth
- `agentic-repo-shell/`: repo-local shell and execution layer
- `sample-overlays/pantheon/`: optional example overlay for project-specific inheritance governance, not part of the portable core

## What This Starter Contains

- `.agents/`
- `.github/`
- `.harness/` skeleton only
- `docs/harness/`
- `scripts/harness/`
- `openspec/` skeleton only
- shell version metadata

It intentionally does not carry historical task packets, evidence, or review artifacts from this workspace.

## Environment Requirements

Required:

- `git`
- `node` 20+

Recommended:

- a repository-local `AGENTS.md` or equivalent entry file
- an OpenSpec workflow for non-trivial work

Optional:

- local `.codex/skills/`
- browser QA tooling

## Versioning

Current shell version:

- `1.0.0`

Version metadata:

- `SHELL_VERSION.json`

## New Project Bootstrap

1. Copy `agentic-method-kit/` into the new repo root.
2. Copy the contents of `agentic-repo-shell/` into the new repo root.
3. Optionally apply a project overlay, using `sample-overlays/pantheon/` only as an example to adapt.
4. Add your project-specific `AGENTS.md` or `CLAUDE.md`.
5. Create the first OpenSpec change or first task packet before non-trivial implementation.

If you are bootstrapping from this workspace directly, you can also use:

```powershell
pwsh ./scripts/bootstrap-agentic-repo.ps1 -TargetPath <new-repo>
pwsh ./scripts/bootstrap-agentic-repo.ps1 -TargetPath <new-repo> -OverlayPath sample-overlays/pantheon
```

Notes:

- `-Force` allows overlay into an existing target directory; it does not delete existing files first

## Recommended Reading Order

For Chinese-first onboarding, read:

1. [README.zh.md](./README.zh.md)
2. [scripts/harness/README.zh.md](./scripts/harness/README.zh.md)
3. [.agents/README.md](./.agents/README.md)
4. [docs/harness/HARNESS_CORE_MODEL.md](./docs/harness/HARNESS_CORE_MODEL.md)
5. [docs/harness/HARNESS_COVERAGE_MODEL.md](./docs/harness/HARNESS_COVERAGE_MODEL.md)
6. [docs/harness/HARNESS_TEMPLATE_TAXONOMY.md](./docs/harness/HARNESS_TEMPLATE_TAXONOMY.md)
7. [docs/harness/TOOL_ADAPTER_MATRIX.md](./docs/harness/TOOL_ADAPTER_MATRIX.md)
8. [docs/harness/failure-registry.md](./docs/harness/failure-registry.md)
9. [docs/harness/tasks/README.md](./docs/harness/tasks/README.md)
10. [openspec/README.md](./openspec/README.md)

## How To Use After Bootstrap

1. put your project-specific contracts, designs, and acceptances in the repo
2. keep `agentic-method-kit/` as the method source of truth
3. use `docs/harness/` as the repo-local contract layer
4. store runtime evidence under `.harness/`
5. keep `docs/harness/failure-registry.md` updated when repeated failures appear
6. run `scripts/harness/*` locally and in CI
7. run `scripts/harness/check-method-health.mjs --strict` after method upgrades

## Document Governance Gate

The repo shell also carries a portable machine-readable document governance gate:

- `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md`
- `scripts/harness/check-doc-frontmatter.mjs`

Use it when the repository adopts governed docs such as:

- `docs/contracts/*`
- `docs/designs/*`
- `docs/acceptances/*`
- retained specs under `docs/superpowers/specs/*`
- retained history under `docs/archive/*`

Recommended checks:

```powershell
node scripts/harness/check-doc-frontmatter.mjs
node scripts/harness/check-doc-frontmatter.mjs --report-legacy
```

The gate verifies frontmatter presence, required metadata, contract linkage, contract body vs frontmatter relation drift, and the rule that `docs/README.md` main-entry links should point only to `Active` docs.

## Optional Overlays

The default shell is generic.

Use `sample-overlays/pantheon/` as an example only when the repository needs to design similar project-specific controls:

- upstream/downstream inheritance governance
- drift checks
- project-specific PR and CI review gates
- project-specific architecture or contract checks

## Recommended Result

After bootstrap, the new business repository root should contain at least:

```text
.agents/
.github/
.harness/
agentic-method-kit/
docs/harness/
openspec/
scripts/harness/
```

## Optional Layers

This starter does not include local `.codex/skills/`.

That is intentional:

- the method must remain tool-agnostic
- Codex can still operate via `.agents/` plus repo contracts
- add local Codex skills only when a business repo needs stable repo-specific helper workflows

## Skills Guidance

Preinstalling skills is not required.

Recommended interpretation:

- `agentic-method-kit/` and repo contracts are mandatory
- `.agents/` is the default cross-tool adapter layer
- local skills are optional accelerators

If you do add skills, keep them out of the critical path:

- they may improve speed
- they must not become the only place where the method is defined
