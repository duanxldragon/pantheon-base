# O4 exact-byte seal integrity — Scoped Base Generator handoff

The review3 saved-output integrity defect is repaired in the two owned producer/test files. Fresh final verification is **37/37 passed, zero skips**, after a RED run against the original exported producer using the **same final test bytes**. This is implementation evidence for root's independent bounded CODE/ARCH rerun, not reviewer approval.

## Task, boundary and evidence

- Platform tooling / foundation candidate producer; **L2**, Scoped Base Generator.
- Parent task packet: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`.
- Parent revision4 plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`; plan SHA256 from review3: `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`.
- Finding input: [review3 CODE handoff](resume-o4-prerequisite-review3-CODE-handoff.md). Only this handoff and the actual two owned files plus read-only `candidate-descriptor.mjs` were read for source context. The frozen 69-file review was not repeated.
- Implementer view: minimally enforce original exact saved bytes at the existing final seal window. Reviewer view: independently check bounded reads, original pin independence, pathname/fd identity, directory ownership and unchanged safe cleanup.
- Minimum evidence: original 29-test baseline, six new actual-producer cases, same-test-byte RED/GREEN, two syntax checks, scoped/captured-baseline diff checks, and exact current hashes.
- Human/review gate: root reruns independent bounded CODE and ARCH after these bytes stabilize. No self-approval, release/publication approval or downstream adoption claim is issued here.
- Timestamp: `2026-11-10T02:03:34.129Z`; Node `v24.14.0`, Windows x64.

## Smallest implementation

`scripts/foundation-release/build-candidate-artifact.mjs:96` captures the descriptor digest from the original in-memory descriptor bytes before any saved-output read. The original archive digest stays in the originally constructed descriptor. The returned descriptor digest is this independent expectation.

At line126, a producer-local paired stage read checks both the saved descriptor and archive. After source-stability scanning, output-existence checks and the existing directory/shape preflight, line170 calls it immediately before the final stage check and rename:

1. Recheck all enrolled stage/ancestor directory instances. Each known saved path must be a regular non-symbolic file, have one link, a positive real inode, and the exact original expected size.
2. Open read-only with `O_NOFOLLOW` where exposed; compare bigint fd/path dev, ino, size, nanosecond modification/change times, mode and link count before reading.
3. Allocate only the original expected length and read at most the remaining expected bytes using an explicit file offset. A zero-length read before completion refuses. Expected lengths already passed the original descriptor/archive limits.
4. Compare the entire saved buffer with the original expected buffer and its independent original pin. Never derive acceptance pins from modified saved output.
5. Keep both fds open until both reads complete, then recheck both fd and named-path stamps and stage/ancestor identities. Close fds before the unchanged final directory check and rename.

The read is local to this producer and two saved artifacts; no exported utility, general framework or atomic namespace-lock claim was added. Source capture, existing stage assertions, the entire cleanup/cause/CLI tail, and all original tests are byte-identical. The test file change is an append after its original 24,281-byte UTF-8 prefix (24,280 characters).

## Actual-producer regressions

New tests begin at `candidate-artifact.test.mjs:400` and `:458`; both call the real exported `buildCandidateArtifact`. One-shot hooks invoke the original fs operation, so mutations affect actual saved files rather than an isolated helper.

| Case                                  | Exact attack point                                                                                             | GREEN refusal                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Descriptor newline                    | Immediately after its real `writeFileSync` returns                                                             | Exact-size mismatch                 |
| Archive append                        | Final output-existence check, after its real early archive read/validation and source scan                     | Exact-size mismatch                 |
| Descriptor same-size byte replacement | Same final preflight window                                                                                    | Saved bytes/digest mismatch         |
| Archive same-size byte replacement    | After early validation in the final preflight window                                                           | Saved bytes/digest mismatch         |
| Descriptor rename/recreate            | After a real final fd read; original renamed outside stage, byte-identical regular file recreated at same name | After-read file/path stamp mismatch |
| Archive rename/recreate               | Same real final fd-read window                                                                                 | After-read file/path stamp mismatch |

All six GREEN cases require refusal/no successful return and no output directory. Source inventory bytes plus file/directory stamps remain unchanged. The stage and parent dev/ino instances remain unchanged during the injected mutation (directory timestamps naturally change for rename/recreate). Owned-file cleanup leaves no stage; each renamed original file survives outside it until disposable fixture teardown.

## RED/GREEN and checks

- Baseline: `node --test scripts/foundation-release/candidate-artifact.test.mjs` → **29 passed / 29, exit 0**, zero skips. [Raw baseline](resume-o4-seal-integrity-baseline-tests.log).
- RED: `node --test --test-reporter=tap scripts/foundation-release/candidate-artifact.test.mjs` with the captured original owned producer → **29 passed / 37, 8 failed, exit 1**, zero skips. Six failed new leaf cases plus their two failed containers account for eight. Four saved-byte cases actually returned success on corrupt output; the two read-consistency cases failed their explicit assertion that a real final fd read occurred, because the original producer had no such read. [Raw RED](resume-o4-seal-integrity-red-tests.log).
- RED was rerun after the new one-shot read hook stabilized, retaining the final test hash `17301133892fe649d7fdd2ec25ed7e0a570c45b47f7a0842ed896b0723dd9b11`. The wrapper checked owned producer bytes before restoration, restored the repair in `finally`, and verified the repaired hash. No runtime loader or alternate producer was used.
- Final GREEN: the same normal named-file command and final tests → **37 passed / 37, exit 0**, zero skipped/cancelled/todo. [Raw final GREEN](resume-o4-seal-integrity-green-tests.log).
- `node --check scripts/foundation-release/build-candidate-artifact.mjs` and `node --check scripts/foundation-release/candidate-artifact.test.mjs` → **exit 0**, no output.
- `git diff --check -- scripts/foundation-release/build-candidate-artifact.mjs scripts/foundation-release/candidate-artifact.test.mjs` → **exit 0**. Since both owned files were already untracked, each was also compared against the captured original bytes using `git diff --no-index --check`: no stdout/stderr whitespace diagnostics; exit1 reflects differing files. The actual [two-file delta](resume-o4-seal-integrity-source-delta.patch) is retained; ephemeral baseline diff files were unlinked and their temporary directories removed without recursion.
- No LSP diagnostic tool was exposed. These are fresh JavaScript syntax and behavior checks, not JS type-safety evidence. No backend/frontend build was required for this two-`.mjs` repair or run outside the permitted scope.

## Exact source hashes

| Source                               | Captured original SHA256                                           | Final SHA256                                                       |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `build-candidate-artifact.mjs`       | `9ba91562d0854701cc1eacc58e854fcc122af096721c3ec83fe914a171932352` | `646e622f2eef3ae30d29aed50272d3f4665dd54d04c2fcb1ffb41777e554d6e3` |
| `candidate-artifact.test.mjs`        | `1c5869e4c0f4670ccacf89333e9010607a0aca1c14cccf0eedb5926c2cea8a8f` | `17301133892fe649d7fdd2ec25ed7e0a570c45b47f7a0842ed896b0723dd9b11` |
| Read-only `candidate-descriptor.mjs` | `a9b242e4b6d787344f16357b6c7397ab4a7ffda633e21556138e240ccece71a6` | `a9b242e4b6d787344f16357b6c7397ab4a7ffda633e21556138e240ccece71a6` |

All three hashes were stable across the final GREEN verification. The [machine receipt](resume-o4-seal-integrity-receipt.json) records commands, source-byte preservation checks, current sizes, runtime and the six cases. Boundary hashes cannot exclude an intervening concurrent edit/revert.

## Limits and stop

`O_NOFOLLOW` is not exposed on this Windows runtime; the existing fallback plus bigint lstat/fstat and after-read path/directory checks ran successfully. Execution evidence is Windows only. Verification and rename remain separate syscalls; an adversarial mutation after the last observed check is not prevented by an atomic lock. Existing non-recursive cleanup and primary-cause handling remain unchanged, including retention/refusal rules and the lack of rollback after an already completed unlink.

Only the two owned source files and new `resume-o4-seal-integrity-*` Base evidence were written. Existing edits were preserved. No repository commit, lock/ledger, product source, credentials, remote, release, model or configuration changes were made.

**Stop:** scoped repair is implemented and verified on current stabilized bytes. Return to root for the independent bounded CODE/ARCH rerun; downstream paired runtime, Ops adoption and formal release remain separate work.
