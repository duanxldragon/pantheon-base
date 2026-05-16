# Language Session And Cross-Page Selection Doc Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the approved language-session and cross-page selection rules into Pantheon Base contracts, design docs, and acceptance docs without changing runtime code yet.

**Architecture:** Treat the approved spec as the new truth source, then update the platform, auth, config, iam, database, and acceptance documents so they all express the same runtime language priority and batch-selection contract. Keep scope limited to documentation and contract text; do not mix in code changes or unrelated doc cleanup.

**Tech Stack:** Markdown docs, git, ripgrep, Pantheon Base contract and design system

---

### Task 1: Update Platform Contract And Frontend Design Truth Sources

**Files:**
- Modify: `docs/contracts/PLATFORM_CONTRACT.md`
- Modify: `docs/designs/FRONTEND.md`
- Modify: `docs/designs/FRONTEND_UI_SPEC.md`
- Reference: `docs/superpowers/specs/2026-05-16-language-session-and-cross-page-selection-design.md`

- [ ] **Step 1: Add the platform contract clauses for language priority and cross-page selection**

Insert text that makes these rules explicit:

```md
### 7.x Platform Session Language Contract

- Runtime language resolution order is `login-session override > user preference > system default`.
- The login page language selector creates a platform session-level language override.
- Session-level language override is cleared on logout and must not leak to the next login subject.

### 7.x Platform Table Selection Contract

- Cross-page selection belongs to platform interaction behavior, not to a single current page.
- Pagination alone must not clear the selection set.
- Search, filter, sort, and reset actions must clear the selection set because they change query context.
- Batch actions operate on the full selection set, not only on visible rows.
```

- [ ] **Step 2: Update `FRONTEND.md` so the shell language chain matches the approved spec**

Replace the contradictory language passages with text equivalent to:

```md
- Platform public settings still provide `i18n.default_language` as the system fallback.
- Runtime language resolution order is `current login choice > user preference > system default`.
- Login page language switching is a session-level shell override and must persist into the post-login shell for the same session.
- In-app language switching defaults to current-session-only behavior and does not automatically persist `preference_json.language`.
- User language preference only applies when the current session has no explicit language override.
```

- [ ] **Step 3: Update `FRONTEND_UI_SPEC.md` for shell preference semantics and table batch interaction**

Add or revise wording so the document states:

```md
- Shell preference resolution distinguishes:
  - session override
  - persisted user preference
  - system fallback
- Login page language choice is a session override, not an automatic persisted preference write.
- Batch-selection bars must show full selection count across pages within the same query context.
- Current-page checkbox state is derived from `fullSelection ∩ visibleRows`.
- Query-context changes clear selection; pagination changes do not.
```

- [ ] **Step 4: Verify all three documents now reference the same language order**

Run:

```bash
rg -n "login-session override|user preference|system default|cross-page|query context" docs/contracts/PLATFORM_CONTRACT.md docs/designs/FRONTEND.md docs/designs/FRONTEND_UI_SPEC.md
```

Expected: all three files contain matching language-priority and selection-context wording.

- [ ] **Step 5: Commit**

```bash
git add docs/contracts/PLATFORM_CONTRACT.md docs/designs/FRONTEND.md docs/designs/FRONTEND_UI_SPEC.md
git commit -m "docs: align platform language and batch selection rules"
```

### Task 2: Update Auth, Config, IAM, And Database Contracts

**Files:**
- Modify: `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- Modify: `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- Modify: `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- Modify: `docs/designs/AUTH_MODULE_DESIGN.md`
- Modify: `docs/designs/DATABASE.md`
- Reference: `docs/superpowers/specs/2026-05-16-language-session-and-cross-page-selection-design.md`

- [ ] **Step 1: Update the auth contract and design so login-page language stays a platform session concern**

Add text equivalent to:

```md
- `/login` may expose language selection, but that selection is a platform session override.
- `system/auth` must not reinterpret login-page language choice as an automatic write to long-term user preference.
- Auth returns the current user preference when available, but runtime language precedence remains owned by the platform shell.
```

- [ ] **Step 2: Update the config contract so `i18n.default_language` is only a fallback**

Add or revise wording equivalent to:

```md
- `i18n.default_language` is the platform fallback language.
- It applies only when the current session has no explicit login/session language override and the current user has no stored language preference.
- `system/config` defines the default value source, but does not own runtime override precedence.
```

- [ ] **Step 3: Update the IAM contract for `preference_json.language` and batch actions**

Add text equivalent to:

```md
- `system_user.preference_json.language` represents long-term user preference, not the mandatory final language for every session.
- Batch-governance pages in `system/iam` must preserve selection across pages within the same query context.
- Search, filter, sort, and reset actions must clear the current selection set before further batch actions.
```

- [ ] **Step 4: Update the auth design and database design to remove the old absolute-preference wording**

Revise the old wording so it becomes:

```md
- Persisted user preference participates only when there is no explicit session override.
- `system_user.preference_json` remains the storage for long-term shell preference.
- Runtime language precedence first checks the current session override, then persisted preference, then `system/config` fallback.
```

- [ ] **Step 5: Verify there are no remaining contradictory claims**

Run:

```bash
rg -n "优先使用 `preference_json`|显式保存的壳层选择|default_language|language" docs/contracts/SYSTEM_AUTH_CONTRACT.md docs/contracts/SYSTEM_CONFIG_CONTRACT.md docs/contracts/SYSTEM_IAM_CONTRACT.md docs/designs/AUTH_MODULE_DESIGN.md docs/designs/DATABASE.md
```

Expected: no file claims that persisted preference always overrides current-session login choice.

- [ ] **Step 6: Commit**

```bash
git add docs/contracts/SYSTEM_AUTH_CONTRACT.md docs/contracts/SYSTEM_CONFIG_CONTRACT.md docs/contracts/SYSTEM_IAM_CONTRACT.md docs/designs/AUTH_MODULE_DESIGN.md docs/designs/DATABASE.md
git commit -m "docs: align auth config and iam language semantics"
```

### Task 3: Update Acceptance And Final Consistency Check

**Files:**
- Modify: `docs/acceptances/ACCEPTANCE_CHECKLIST.md`
- Optional Modify: `docs/acceptances/PLATFORM_SHELL_DUAL_MODE_ACCEPTANCE_TEMPLATE.md`
- Reference: `docs/superpowers/specs/2026-05-16-language-session-and-cross-page-selection-design.md`

- [ ] **Step 1: Add acceptance checks for login/session language behavior**

Insert checks equivalent to:

```md
- Login page language switch persists into the same login session after entering the system.
- Existing user preference must not override the explicit language selected on the current login page.
- In-app language switching defaults to current-session-only behavior.
- Logout clears session language override so the next login subject is not polluted by the previous session language.
```

- [ ] **Step 2: Add acceptance checks for cross-page batch selection**

Insert checks equivalent to:

```md
- Page 1 selection remains after navigating to page 2 within the same query context.
- Batch action bars display full selection count across pages.
- Search, filter, sort, and reset clear the selection set before a new batch action can be applied.
```

- [ ] **Step 3: Run a final consistency grep across all touched docs**

Run:

```bash
rg -n "本次登录选择|用户偏好|系统默认|跨页|查询上下文|session override|system default" docs/contracts docs/designs docs/acceptances
```

Expected: the touched contracts, designs, and acceptance docs all use the same language-order and cross-page-selection concepts without contradiction.

- [ ] **Step 4: Review the spec line-by-line against the touched docs**

Checklist:

```text
1. Platform docs express the final precedence.
2. Auth docs do not claim ownership of runtime precedence.
3. Config docs only describe fallback semantics.
4. IAM docs describe long-term preference and cross-page selection semantics.
5. Acceptance docs cover both behaviors.
```

Expected: no gap remains between the approved spec and the synchronized docs.

- [ ] **Step 5: Commit**

```bash
git add docs/acceptances/ACCEPTANCE_CHECKLIST.md docs/acceptances/PLATFORM_SHELL_DUAL_MODE_ACCEPTANCE_TEMPLATE.md
git commit -m "docs: add acceptance rules for language session and batch selection"
```
