# Release naming normalization

The53 existing GitHub releases now use consistent presentation. Current Foundation releases are titled `Pantheon Base vX.Y.Z`; the3 releases `backend/v0.13.1`, `base-v0.9.0`, `base-v0.8.11` are explicitly titled `Legacy <original tag>` and retain their original bodies under a naming note. No remote v1.0 tag was found in the current55-tag inventory; no old-to-new version mapping was invented. Latest is stable `pantheon-base-v0.18.8`. All tags, assets, draft/prerelease flags and publication dates were preserved and independently re-read.

The local publisher now validates canonical identities, emits `Pantheon Base vX.Y.Z`, and sends `--prerelease --latest=false` for alpha/beta/rc. Real and dry-run command creation share the same argument builder. Version guide and CN/EN models/indexes document Legacy identity, immutable assets and standard official consumption. **These producer/doc changes remain local and uncommitted; no new release was published.**

Validation: focused publisher11/11; native serialized foundation suite124PASS/3Windows symlink SKIP/0FAIL;474 document frontmatter and task-template checks pass. The earlier parallel runner7startup EPERM failures remain separately recorded. Serialized stdout is an honest transcript summary excerpt, not a claimed full raw log. Independent scope review is COMMENT with no source finding. Formal verdict is blocked because the reviewer requires lsp_diagnostics on modified code and the tool is unavailable; producer-code approval remains open and the task stays in-progress. Remote metadata normalization is complete.

Ops installation remains a separate blocked task: latest18.8 candidate rebuilt from verified assets, but the specific tenant test file still denies normal writing. User escalation authorization cannot enable a tool session configured with approval_policy=never; no ACL change or elevated process was used.

[Task](../../../docs/harness/tasks/2026-11-14-release-naming-normalization.task.md) · [Commands](./commands.json) · [Review](./review.md)
