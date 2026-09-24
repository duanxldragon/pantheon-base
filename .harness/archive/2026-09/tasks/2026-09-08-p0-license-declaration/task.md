# Task Packet: P0 License Declaration

## Goal

Add explicit open source license declaration to meet enterprise legal compliance requirements and unblock enterprise adoption.

## Priority

**P0 - Critical** (Blocking enterprise adoption)

## Source

Cross-Review Report: Section IX (Conclusion) - "License缺失是企业法务审计红线"

## Primary Layer

repository-governance

## Dependency Layers

- legal-compliance
- documentation

## Harness Profile

- Template: legal-compliance
- Coverage Dimensions:
  - legal-compliance
  - enterprise-readiness
  - documentation
- Quality Profile: governance
- Portable Failure Class: legal-risk
- Owner Layer: repository-root
- Ratchet Decision: compliance-gate
- Delivery Governance: P0 blocker for enterprise adoption
- GitHub Signal: required before any enterprise deployment

## Scope

### In

- LICENSE file in repository root
- License badge in README.md
- License field in package.json (frontend)
- License notice in key source files (optional)
- Task packet, evidence, and completion verification

### Out

- Third-party dependency license audit (separate task)
- CLA (Contributor License Agreement) setup
- License compatibility analysis
- Historical commit retroactive licensing

## Assumptions and Open Questions

- Recommended license: **MIT** or **Apache-2.0**
  - MIT: Simpler, more permissive, widely accepted
  - Apache-2.0: Patent protection, enterprise-friendly
- Decision maker: Project owner (duanxldragon)
- No existing license file conflicts
- All current code is original or properly attributed

## Minimum Viable Approach

1. Create LICENSE file with chosen license text (MIT recommended)
2. Add license badge to README.md header
3. Update package.json with license field
4. Commit and verify in GitHub UI

## Success Criteria

- LICENSE file exists at repository root
- License clearly displayed in GitHub repository header
- README.md contains license badge
- package.json has correct license field
- No conflicting license declarations

## Contract Anchors

- Cross-Review Report Section IX (Legal Compliance)
- GitHub community standards checklist
- Enterprise procurement legal requirements

## Expected Files

### Create

- LICENSE (new file at repo root)
- .harness/tasks/2026-09-08-p0-license-declaration/task.md
- .harness/tasks/2026-09-08-p0-license-declaration/manifest.json
- .harness/evidence/2026-09-08-p0-license-declaration/completion.md

### Modify

- README.md (add license badge)
- README.en.md (add license badge)
- frontend/package.json (add license field)

### Do Not Touch

- Source code files (no header changes required in MVP)
- Third-party dependencies
- Build artifacts

## Structural Scope

- Affected Subgraph: repository-root → documentation → GitHub UI
- Boundary Crossings: Legal compliance → Enterprise procurement
- Risk Nodes: None (pure documentation change)
- Graph Focus: No code behavior changes

## Implementation Notes

**Recommended License: MIT**

```
MIT License

Copyright (c) 2026 duanxldragon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**README.md Badge**:
```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

**package.json**:
```json
{
  "license": "MIT"
}
```

## Verification Plan

- [ ] LICENSE file exists and is valid
- [ ] GitHub repository shows license in header
- [ ] README.md displays license badge
- [ ] package.json has license field
- [ ] No license conflicts detected

## Evidence Required

- Screenshot of GitHub repository header showing license
- Confirmation of license choice from project owner
- Completion checklist

## Human Gates

- Project owner approval of license choice
- Legal review (if required by organization)

## Completion Checklist

- [ ] License type chosen (MIT or Apache-2.0)
- [ ] LICENSE file created
- [ ] README.md updated with badge
- [ ] package.json updated
- [ ] GitHub UI verified
- [ ] Evidence documented
- [ ] Task marked complete

## Estimated Effort

- Implementation: 15 minutes
- Review: 5 minutes
- **Total: 20 minutes**

## Linkage

- Task ID: 2026-09-08-p0-license-declaration
- Parent Report: PANTHEON_BASE_CROSS_REVIEW_REPORT.md
- Related Tasks: 
  - 2026-09-08-p0-security-gates-enforcement (parallel P0)
  - 2026-09-08-p0-csp-hsts-implementation (parallel P0)
- Evidence Directory: `.harness/evidence/2026-09-08-p0-license-declaration/`
- Priority: P0 (Critical)
- Blocking: Enterprise adoption, legal compliance
