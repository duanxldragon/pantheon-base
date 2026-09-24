# Task Packet: P0 Security Gates Enforcement

## Goal

Make Security Gates (CodeQL, Secret Scan, Dependabot) required checks for PR merge to eliminate security vulnerability window period.

## Priority

**P0 - Critical** (Security risk)

## Source

Cross-Review Report: Section 2.3 (Security Implementation) - "CodeQL高危项在PR阶段仅report-only，真正阻断在push/定期扫描阶段，存在窗口期风险"

## Primary Layer

ci-workflow

## Dependency Layers

- github-workflow
- security-policy
- branch-protection

## Harness Profile

- Template: security-governance
- Coverage Dimensions:
  - security
  - ci-quality
  - governance
- Quality Profile: security-critical
- Portable Failure Class: security-gate
- Owner Layer: ci-workflow
- Ratchet Decision: security-hardening
- Delivery Governance: P0 blocker for production deployment
- GitHub Signal: required before merge

## Scope

### In

- GitHub Branch Protection Rules update
- Security Gates workflow enforcement
- CodeQL required check configuration
- Secret Scan required check configuration
- Dependabot alert integration
- Task packet, evidence, and verification

### Out

- CodeQL custom rules (use defaults)
- Secret Scan custom patterns
- Dependency vulnerability auto-fix
- Historical security debt remediation

## Assumptions and Open Questions

- GitHub Actions workflows already exist:
  - `.github/workflows/security.yml` (or equivalent)
  - CodeQL workflow
  - Secret Scan workflow
- Branch protection rules applied to `main` branch
- Team has permissions to modify branch protection
- No breaking changes to existing CI workflows

## Minimum Viable Approach

1. Review current `.github/workflows/` security workflows
2. Identify workflow job names for required checks
3. Update GitHub Branch Protection Rules via UI or API
4. Add Security Gates to required status checks
5. Verify with test PR

## Success Criteria

- CodeQL analysis is required check for PR merge
- Secret Scan is required check for PR merge
- Dependabot alerts block merge if high/critical severity
- PRs with security issues cannot merge
- Documentation updated with new policy
- At least one test PR validates enforcement

## Contract Anchors

- Cross-Review Report Section 2.3 (Security Implementation)
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `.github/workflows/security.yml` (or CodeQL workflow)
- GitHub Branch Protection documentation

## Expected Files

### Create

- .harness/tasks/2026-09-08-p0-security-gates-enforcement/task.md
- .harness/tasks/2026-09-08-p0-security-gates-enforcement/manifest.json
- .harness/evidence/2026-09-08-p0-security-gates-enforcement/verification.md
- .harness/evidence/2026-09-08-p0-security-gates-enforcement/branch-protection-config.json

### Modify

- docs/designs/QUALITY_AND_SECURITY_STRATEGY.md (update to reflect enforcement)
- GitHub Branch Protection Rules (via UI/API, no file change)

### Do Not Touch

- Existing security workflow logic
- CodeQL configuration files (unless fixing bugs)
- Backend/frontend source code

## Structural Scope

- Affected Subgraph: GitHub Branch Protection → CI Workflows → Security Gates
- Boundary Crossings: GitHub API → Branch Protection Rules
- Risk Nodes: Over-strict rules may block legitimate PRs
- Graph Focus: Enforcement mechanism, not detection logic

## Implementation Notes

**Current State Analysis Required**:
1. List all security-related GitHub Actions workflows
2. Identify job names that should be required
3. Check current branch protection rules

**Branch Protection Rules to Update**:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Quality Gates",
      "Security Gates",
      "CodeQL",
      "Secret Scanning",
      "Dependency Review"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_conversation_resolution": true
}
```

**Documentation Updates**:
- Update QUALITY_AND_SECURITY_STRATEGY.md to remove "report-only" language
- Add section on security gate failure resolution process
- Document emergency bypass procedure (if any)

## Verification Plan

- [ ] List current security workflows: `gh api repos/:owner/:repo/actions/workflows`
- [ ] Check current branch protection: `gh api repos/:owner/:repo/branches/main/protection`
- [ ] Update branch protection rules
- [ ] Create test PR with intentional security issue (commented out)
- [ ] Verify PR is blocked by security gate
- [ ] Remove security issue, verify PR can merge
- [ ] Document configuration in evidence

## Evidence Required

- Current branch protection rules (before)
- Updated branch protection rules (after)
- Screenshot/log of test PR being blocked
- Screenshot/log of test PR succeeding after fix
- Updated QUALITY_AND_SECURITY_STRATEGY.md diff

## Human Gates

- Repository admin approval for branch protection changes
- Security team review of enforcement policy
- Test PR validation by maintainer

## Completion Checklist

- [ ] Current security workflows identified
- [ ] Branch protection rules updated
- [ ] CodeQL as required check
- [ ] Secret Scan as required check
- [ ] Dependabot integrated
- [ ] Test PR validated blocking behavior
- [ ] Documentation updated
- [ ] Evidence captured
- [ ] Security team notified of change

## Estimated Effort

- Analysis: 30 minutes
- Configuration: 30 minutes
- Testing: 30 minutes
- Documentation: 15 minutes
- **Total: 1.75 hours**

## Linkage

- Task ID: 2026-09-08-p0-security-gates-enforcement
- Parent Report: PANTHEON_BASE_CROSS_REVIEW_REPORT.md (Section 2.3)
- Related Tasks:
  - 2026-09-08-p0-license-declaration (parallel P0)
  - 2026-09-08-p0-csp-hsts-implementation (parallel P0)
  - 2026-09-08-p1-test-coverage-phase1 (follows this)
- Evidence Directory: `.harness/evidence/2026-09-08-p0-security-gates-enforcement/`
- Priority: P0 (Critical)
- Blocking: Production deployment, security compliance
