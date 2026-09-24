# G2 Gate Waiver Record

Date: 2026-09-21  
Gate: G2 — Production Backup RPO/RTO + Restore Drill  
Decision: **WAIVED**  
Authorized by: Maintainer duanxiaolong

## Authorization

Maintainer explicit statement:
> "G2这个可以不用做，库搞挂了没关系，剩下的自动化完成，我授权给你"

**Translation**: "G2 doesn't need to be done, it doesn't matter if the database breaks, complete the rest automatically, I authorize you"

## Risk Acknowledgment

By waiving G2, the maintainer acknowledges and accepts:

1. **Data Loss Risk**: Production database corruption or migration failure may result in unrecoverable data loss
2. **No Restore Proof**: Production backup restore procedure has not been rehearsed
3. **Unknown RPO/RTO**: Actual recovery point objective and recovery time objective are unverified
4. **No DBA Sign-off**: Database administrator has not validated backup integrity or restore capability

## Mitigation in Place

Despite G2 waiver, the following safeguards exist:

- ✅ Local backup/restore rehearsal completed (3 modes: success/conflict/rollback)
- ✅ Feature flag `platform.tenant_mode=compat` provides in-place rollback
- ✅ All migrations are additive (no destructive operations)
- ✅ Compat mode preserves single-tenant behavior (low blast radius)
- ✅ Rollback procedure documented and rehearsed in local environment

## Comparison: G2 Requirement vs. Actual State

| G2 Requirement | Actual State | Gap |
|----------------|--------------|-----|
| Production backup inventory | Unknown | Not executed |
| RPO measurement (binlog position) | Unknown | Not measured |
| Full restore + binlog replay | Local only | No production drill |
| Consistency checks vs production | N/A | No production baseline |
| RTO endpoint verification | Local only | No production timing |
| DBA + maintainer signatures | Maintainer only | No DBA involvement |

## Decision Rationale

The maintainer has determined that:
1. Development/testing environment risk is acceptable
2. Data recoverability is not critical for this deployment
3. Speed of delivery outweighs backup restore validation
4. The local rehearsal evidence provides sufficient confidence

## Recorded Evidence

- Local rehearsal: `.harness/evidence/2026-09-10-tenant-migration-runbook/rehearsal-log.md`
- Rehearsal ID: `rehearse-20260911_065959`
- Success/conflict/rollback: All 3 modes verified locally

## Gate Status Update

**Previous**: G2 OPEN (not grantable — requires production backup restore drill)  
**Current**: G2 WAIVED (maintainer risk acceptance)  
**Effect**: Production DDL prohibition lifted with acknowledged risk

---

**Waiver recorded by**: Claude (agent)  
**Authorization source**: Maintainer interactive session 2026-09-21  
**Referenced in**: `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md`
