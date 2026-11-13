# O4 prerequisite re-review3 — independent CODE/spec/security handoff

**REQUEST CHANGES. Files: 4 delta files reviewed; 69 source/context paths frozen. Issues: CRITICAL 0 / HIGH 0 / MEDIUM 1 / LOW 0.**

Both review2 MEDIUM findings are closed by the actual repairs. A further, independently reproduced producer integrity defect still prevents this CODE lane from approving the prerequisite source for paired candidate creation and Ops backend adoption. Consumer rejection remains fail-closed; no privilege escalation, accepted corrupt candidate or production data loss was reproduced.

## Finding

### [MEDIUM] Final seal checks file shape but does not verify the saved descriptor/archive bytes

**File:** [build-candidate-artifact.mjs:139](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:139). Related return: [line142](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:142).

The final `assertStageContents()` verifies the stage/ancestor directory identities, permitted names, regular-file type and link count. It does not compare either saved file with the bytes/digests the producer intends to seal. The descriptor is never read back; the archive is verified at line134, before the subsequent source scan and final preflight. A completed mutation of a known regular file during this interval passes the new preflight. Rename succeeds and the producer returns the original descriptor digest and success, although the saved descriptor or archive no longer matches its pin.

**Fresh evidence from the actual exported producer**, using current Base HEAD only as read-only provenance, one existing required-export source file and OS-temporary output:

- Immediately after the real descriptor write, a one-shot hook appended one newline using the saved original writer. The producer returned; `sourceStable=true`, returned pin versus saved bytes **false**, actual `readCandidateDescriptor` failed with **Candidate descriptor digest mismatch**.
- After the earlier archive verification, a one-shot hook on the final output-existence check appended one byte to the stage archive. The producer returned; returned archive digest versus saved bytes **false**, actual `verifyCandidateArchive` failed with **Candidate archive digest/size mismatch**.

These mutations were completed **before** the final preflight, with the original stage and ancestor instances intact. They are not a race after the last verification or a request for atomic filesystem locking. The source inventory itself stayed stable; that flag cannot establish output integrity. Both disposable outputs were removed after verified temporary-path checks. No repository source, lock, commit, credentials or product adoption was changed. Exact probe results are in the linked receipt.

**Fix:** after the source-stability scan and shape checks, re-read both saved artifacts with bounded regular-file/path checks and compare against their original expected bytes/digests immediately before rename. Reuse the existing descriptor/archive validation helpers where sufficient; retain the independently expected pin rather than recomputing it from changed output. Keep instance/ancestor checks, explicit failure and safe cleanup. Add regressions that mutate each known stage file before final preflight and require refusal/no success output. The existing directory-replacement tests do not cover this byte mutation.

## Spec compliance and root-cause guard

Parent: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`. Approved scope: revision4 `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`, SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`.

L2 boundary: Base platform contracts/middleware/producer and system/auth/IAM/config read adapters; Ops candidate resolver/thin assembly entry. Stage1 reconstructed A/E and F1 from the actual review2 CODE handoff, repair handoffs, revision4 and current sources before any quality approval. F1 requires exact validated packaged bytes, externally pinned descriptor integrity, source stability and an honest staging receipt. The output integrity finding fails that current producer contract. Ops business adoption, generated runtime, full tenant acceptance and formal publication are subsequent gates, not alleged current defects.

The Base/Ops AGENTS and installed `D:/cache/npm-global/node_modules/oh-my-codex/skills/code-review/SKILL.md` were read. This is the independent CODE leaf; the explicit no-delegation instruction overrides the skill's coordinator routing. ARCH retains its verdict; this report is neither an implementer self-approval nor a combined two-lane approval.

**Review2 producer directory-deletion MEDIUM: closed.** Current producer line12 uses actual bigint dev/ino; lines98–123 guard stage and every ancestor. Unknown names/directories, unsupported entries and observed replacements refuse. Cleanup lines143–158 uses two-file preflight/rechecks, unlink/rmdir and retained primary cause, with no recursive deletion. Current tests lines113,168,212,241,264 assert original/replacement preservation, actual differing IDs, preflight-before-unlink, unavailable identity and replacement after one owned unlink.

**Review2 lost assembly cause MEDIUM: closed.** Actual Ops [rebuild-from-candidate.mjs:258](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs:258) passes `{cause:error}`. Unchanged resolver line804 wraps that primary cause with cleanup refusal. CLI line331 prints it. Test lines236,903,928,957 require the original replacement/mutation/drift/migration causes; line1072 exercises the real CLI and requires both error messages plus retained stage/no receipt. Safe refusal no longer masks the primary failure. This root-cause repair introduces no silent defaults or alternate acceptance path.

## Unchanged prerequisite coverage

All 65 non-delta inventory paths match review2 exactly. Load-bearing current functions were inspected again: live Redis token/PTTL and both blacklists; SQL active-session ownership/idle/user state; current global and tenant bindings; originating claim validation before override; frozen provenance/checkpoint reauthorization; persisted Casbin global-first grants; DataScope from only granting namespaces; strict mode failures.

Production main retains registration → provider seal → route validation → policy seal. Protected logging/audit selection precedes body capture and denial; audit stores typed metadata, not raw query/body/provider error. Safe telemetry precedes body/CSRF/rate/auth denial and creates a new root with cleared baggage, registered route/action, constant error events and empty status text. Review2's real SDK/OTLP HIGH closure and 46-file gopls receipts remain valid for identical bytes; they were not rerun or promoted to full downstream runtime acceptance. No new business→system Service/Repository coupling or authorization cache/legacy-chain rewrite appears in this delta.

For ARCH: directory enrollment and check→unlink/rename remain separate syscalls. Assembler-created unknown directories are retained on failure; partial cleanup cannot promise rollback. These documented limitations are unchanged; the new finding instead concerns output mutation completed before preflight.

## Verification, stability and stop

The root synthesis `resume-o4-final-tooling-root-handoff.md` and its receipt are present and match fresh source hashes. Base author suite **29/29**, zero skips, and root actual Ops suite **64/64**, zero skips, are retained named-file evidence, **not independently rerun here**. Actual assertions were inspected. Fresh `node --check` passed on all four delta files. Native pattern search plus source inspection covered cleanup/catch/cause/default/CLI output; no secret, injection or XSS defect was found in this bounded delta.

`lsp_diagnostics` and `ast_grep_search` were not exposed; AST-grep executable was unavailable. Node syntax checks are not JS type-safety evidence. This diagnostic gap is explicit and no type-safe approval is issued. CodeGraph status/context was used without syncing; the index had 27 added/27 modified pending files, so new/modified load-bearing bodies were read directly.

Before/after SHA256 are identical for all **69** paths. The complete exact inventory is [resume-o4-prerequisite-review3-CODE-source-receipt.json](resume-o4-prerequisite-review3-CODE-source-receipt.json); it preserves review2 hashes and fresh before/after hashes. Four delta identities:

| Source                                                                   | Before = after SHA256                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `../pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs` | `4590052710de1c1d283400cf7ef9784cb2095722154a265523360e55e578e32b` |
| `../pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs`    | `cbcf32ed8246736eb78469eabffa9d80145c67bfaf96d4a9928d660cabc74e32` |
| `scripts/foundation-release/build-candidate-artifact.mjs`                | `9ba91562d0854701cc1eacc58e854fcc122af096721c3ec83fe914a171932352` |
| `scripts/foundation-release/candidate-artifact.test.mjs`                 | `1c5869e4c0f4670ccacf89333e9010607a0aca1c14cccf0eedb5926c2cea8a8f` |

Unchanged Ops resolver: `da8a8eeeb0a9f52514b157353475a75d43675711f264731cd8564398d7610161`. Official Ops lock: `95de1a87270e15c0d4c672418a5df906818a88652f8a3e6c480f1484ee9fa70c`. Boundary hashes cannot exclude a concurrent edit/revert between observations.

**Stop:** source coverage and the remaining actionable finding are grounded. Return this minimal producer repair to its owner, then rerun independent CODE/ARCH prerequisite review on stable repaired bytes. Paired runtime, Ops backend adoption, generator runtime, tenant/privacy acceptance, official consumption/publication and P0 completion are not approved by this report.

## Machine Readable

```json
{
  "taskId": "2026-11-07-ops-formal-queue-foundation-gaps",
  "tier": "L2",
  "role": "independent-code-reviewer",
  "verdict": "REQUEST CHANGES",
  "issues": {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 1,
    "LOW": 0
  },
  "review2ProducerDirectoryMedium": "closed",
  "review2OpsCauseMedium": "closed",
  "priorTelemetryHigh": "closed-identical-source",
  "remainingFinding": "saved-candidate-output-integrity-before-seal",
  "sourceStable": true,
  "sourcePaths": 69,
  "deltaPaths": 4,
  "lspDiagnostics": "unavailable",
  "syntaxChecks": 4,
  "architectureVerdict": "reserved-for-ARCH",
  "prerequisiteSourceApproved": false,
  "finalP0Approved": false,
  "publicationApproved": false,
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md",
    "plan": ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md",
    "report": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-handoff.md",
    "sourceReceipt": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-source-receipt.json"
  }
}
```
