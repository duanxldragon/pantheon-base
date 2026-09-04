# Task Manifest: v0.11.1 Release Preparation

**Task ID**: 2026-09-04-v0.11.1-release-preparation  
**Created**: 2026-09-04  
**Status**: 🟡 Planning  
**Assignee**: duanxiaolong  
**Estimated Duration**: 2-3 days  
**Priority**: P0 - Release Blocker

---

## Executive Summary

Based on comprehensive multi-team review (14 专业审查团队), pantheon-base v0.11.0 has **4 P0 blockers** preventing release. This task packages all fixes into a v0.11.1 release with complete documentation, validation, and ops consumption path.

**Key Findings**:
- ✅ Technical quality: Excellent (architecture, tests, security)
- 🚫 Release governance: 4 P0 blockers (CHANGELOG, versioning, docs, post-tag commits)
- ⚠️ 15 P1/P2 improvements identified across 10 domains

**Decision**: Skip v0.11.0 tag, fix all P0 issues, release as **v0.11.1** on current HEAD (d3030510).

---

## Blocking Issues (Must Fix Before Release)

### P0-1: Empty Release Documentation
**Location**: `releases/pantheon-base-v0.11.0/*.md`  
**Impact**: Consumers cannot understand what changed or how to upgrade  
**Fix Duration**: 2 hours

All release files contain only placeholder text:
- `release-notes.md`: "No release notes provided."
- `upgrade-notes.md`: "No upgrade notes provided."
- `consumer-impact.md`: "No consumer impact summary provided."

### P0-2: CHANGELOG Missing v0.11.0 Entry
**Location**: `CHANGELOG.md`  
**Impact**: Violates release governance contract  
**Fix Duration**: 1 hour

Current CHANGELOG ends at v0.10.27. Need comprehensive v0.11.0 entry documenting:
- Design system framework (3,325 lines, 5 guides)
- Token expansion (32→67, +109%)
- 9 semantic container tokens
- 100% backward compatibility

### P0-3: Frontend Package Version Mismatch
**Location**: `frontend/package.json`  
**Impact**: npm consumers will see wrong version  
**Fix Duration**: 5 minutes

- Git tag: `pantheon-base-v0.11.0`
- package.json: `"version": "0.10.26"`
- Must sync to `0.11.0`

### P0-4: Post-Tag Commits Not Included
**Location**: Git history  
**Impact**: Release points to stale commit  
**Fix Duration**: Decision + retag

7 commits exist after v0.11.0 tag (c907db50):
```
d3030510 chore: update harness manifest
c6cd4258 chore: add harness task structure
a55fd0a6 docs: update README to v0.11.0
88aaf896 Merge branch 'main'
78487ded docs: update README (#287)
4dd65928 chore(deps-dev): bump @humanfs/node (#286)
54d6408f docs: add harness evidence
```

**Resolution**: Release at HEAD (d3030510) as v0.11.1, include all commits.

---

## High-Priority Issues (Strongly Recommended)

### P1-1: Redis Dependency Not Fail-Fast
**Location**: `backend/pkg/database/redis.go:14-30`  
**Impact**: Silent service degradation (all auth fails)  
**Fix Duration**: 30 minutes

Current: Logs warning, allows startup, all requests get 401.  
Needed: Fail-fast in production mode.

### P1-2: Missing Indexes on High-Traffic Queries
**Location**: Database migrations  
**Impact**: Performance degradation under load  
**Fix Duration**: 1 hour

Missing indexes:
- `system_user_session(user_id, revoked_at, refresh_expires_at)`
- `system_auth_security_event(severity, acknowledged, created_at)`
- `casbin_rule(ptype, v0, v1)` - current index misses ptype

### P1-3: N+1 Query in Role-Permission Resolution
**Location**: `backend/modules/auth/login/login_runtime.go:253-260`  
**Impact**: 3000+ DB queries/s under 1000 req/s load  
**Fix Duration**: 2 hours

Add Redis cache for user permissions (5min TTL).

### P1-4: DB Connection Pool Too Small
**Location**: `backend/pkg/database/gorm.go:114-117`  
**Impact**: Connection saturation with 10 instances  
**Fix Duration**: 30 minutes + doc

Current: 100 max connections × 10 instances = 1000 > MySQL default 151.  
Fix: Document tuning, add environment guide.

### P1-5: Goroutine Leak in DB Metrics Collector
**Location**: `backend/pkg/database/gorm.go:120-134`  
**Impact**: Resource leak in long-running deployments  
**Fix Duration**: 1 hour

Background metrics goroutine has no shutdown mechanism.

### P1-6: pantheon-ops Sync Mechanism Broken
**Location**: pantheon-ops repository  
**Impact**: ops cannot consume v0.11.0  
**Fix Duration**: 4 hours (ops repo work)

- Missing: `scripts/business-overlay/rebuild-from-base.mjs`
- Missing: `foundation-release.lock.json` at ops root
- Missing: NPM tarball `duanxldragon-pantheon-base-ui-0.10.25.tgz`

---

## Medium-Priority Improvements (Post-Release OK)

### P2-1: Bcrypt Cost Factor Upgrade
**Current**: DefaultCost = 10  
**Recommendation**: Cost 12-14 for new passwords  
**Fix Duration**: 1 hour

### P2-2: Operation Log Queue Drop Behavior Undocumented
**Impact**: Silent audit trail gaps under load  
**Fix**: Document in operations guide

### P2-3: Tenant Isolation Not Implemented
**Impact**: Misleading documentation  
**Fix**: Remove "tenant" from DataScopeMode OR add disclaimer

### P2-4: Query Timeout Not Enforced
**Impact**: Long-running queries hold connections  
**Fix**: Add context timeout to service methods

### P2-5: Console.log in Production Code
**Files**: 2 locations found  
**Fix**: Remove or guard with environment check

---

## Phased Execution Plan

### Phase 1: Release Documentation (2.5 hours)
**Objective**: Complete all release artifacts for v0.11.1

#### Task 1.1: Write release-notes.md
**Duration**: 1 hour  
**Owner**: duanxiaolong  
**Output**: `releases/pantheon-base-v0.11.1/release-notes.md`

Content structure:
```markdown
# pantheon-base v0.11.1 - Enterprise Design System Engineering

## Headline
Complete frontend design system audit and 3-tier engineering framework.

## What's New
- 5 comprehensive engineering guides (3,325 lines)
  - COMPONENT_STYLING_GUIDE.md (682 lines)
  - UI_PATTERN_LIBRARY.md (845 lines)
  - DESIGN_ENGINEERING_GUIDE.md (890 lines)
  - TOKEN_MIGRATION_GUIDE.md (420 lines)
  - VERSION_MANAGEMENT_GUIDE.md (488 lines)
- Token system expansion: 32→67 tokens (+109%)
  - Spacing: 8→26 tokens (+225%)
  - 9 semantic container tokens (interactive/display/operation)
- Enhanced mechanical gates with smart whitelist
- Design system maturity: 3/5 → 5/5 stars (+66%)

## Breaking Changes
None. All changes are additive and 100% backward-compatible.

## Upgrade Impact
Optional adoption. New docs provide reference guidance; existing code works unchanged.

## Version Notes
v0.11.1 supersedes the unreleased v0.11.0 tag to include:
- Documentation updates (README v0.11.0 declaration)
- Harness task structure improvements
- Dependency updates (@humanfs/node 0.16.7→0.16.8)

## Verification
- Release commit: d3030510
- UI contract: 0 violations (249 files)
- All CI gates: PASS
- GitHub Release bound to commit d3030510
```

#### Task 1.2: Write upgrade-notes.md
**Duration**: 45 minutes  
**Output**: `releases/pantheon-base-v0.11.1/upgrade-notes.md`

Content:
```markdown
# Upgrading to v0.11.1

## Backend (Go Module)
No code changes required.

```go
// Update go.mod
require github.com/duanxldragon/pantheon-base/backend v0.11.1

// For local development
replace github.com/duanxldragon/pantheon-base/backend => ../../pantheon-base/backend
```

Run: `go mod tidy && go build ./cmd/server`

## Frontend (NPM Package)
No code changes required.

```bash
# Build base UI package
cd pantheon-base/frontend
npm run build:lib
npm pack  # Creates duanxldragon-pantheon-base-ui-0.11.1.tgz

# Update ops dependency
cd ../../pantheon-ops/frontend
# Edit package.json:
# "@duanxldragon/pantheon-base-ui": "file:../../pantheon-base/frontend/duanxldragon-pantheon-base-ui-0.11.1.tgz"
npm install
```

## Optional: Adopt New Design Patterns
Review `docs/frontend/` for:
- Token system usage (67 tokens available)
- Container semantics (interactive/display/operation)
- Visual contract patterns

## Smoke Testing
```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend
npm run check:menu-contract
npm run check:ui-contract
npm run test:smoke:platform

# Integration
npm run test:smoke:all  # Full regression (15-30 min)
```

## Rollback
```bash
git revert HEAD
cd backend && go mod tidy
cd ../frontend && npm install
npm list @duanxldragon/pantheon-base-ui  # Verify old version
```
```

#### Task 1.3: Write consumer-impact.md
**Duration**: 45 minutes  
**Output**: `releases/pantheon-base-v0.11.1/consumer-impact.md`

Content:
```markdown
# Consumer Impact: v0.11.1

## Summary
**Impact Level**: Low (additive changes only)  
**Compatibility**: 100% backward compatible  
**Upgrade Effort**: < 1 hour (dependency bumps only)

## pantheon-ops (Primary Consumer)
### Breaking Changes
None.

### Required Actions
1. Update `foundation-release.lock.json` (if exists):
   ```json
   {
     "baseVersion": "pantheon-base-v0.11.1",
     "dependencies": {
       "go": "github.com/duanxldragon/pantheon-base/backend@v0.11.1",
       "npm": "@duanxldragon/pantheon-base-ui@0.11.1"
     }
   }
   ```
2. Run `go mod tidy` in backend
3. Run `npm install` in frontend
4. Verify: `npm run check:business-boundaries`

### Optional Improvements
- Review `docs/frontend/DESIGN_ENGINEERING_GUIDE.md` for new patterns
- Adopt container tokens for business modules
- Apply token migration guide for custom CSS

### Rollback Plan
Change lock file back to v0.10.26, reinstall dependencies.

## Go Module Consumers
### Impact
None. Backend unchanged from v0.10.26 semantics.

### Actions
Update go.mod: `require github.com/duanxldragon/pantheon-base/backend v0.11.1`

## NPM Package Consumers
### Impact
New tokens available, no breaking changes.

### Actions
Update package.json dependency version to 0.11.1.

### New Capabilities
- 67 design tokens (vs 32 in v0.10.x)
- 9 container semantic tokens
- Enhanced UI contract validation

## API Stability
All REST endpoints unchanged:
- `/api/v1/auth/*` - stable
- `/api/v1/system/*` - stable
- Request/response schemas - unchanged
- Database schema - unchanged

## Database Migrations
No new migrations in this release.

## Configuration Changes
None required.
```

---

### Phase 2: Version Synchronization (30 minutes)
**Objective**: Align all version references

#### Task 2.1: Update frontend/package.json
**File**: `frontend/package.json`  
**Change**: Line 3, `"version": "0.10.26"` → `"0.11.1"`

#### Task 2.2: Update VERSION file
**File**: `VERSION`  
**Change**: `1.4.0` → `0.11.1`  
(Note: Switching to semantic versioning aligned with tags)

#### Task 2.3: Update README.md references
**File**: `README.md`  
**Change**: Verify "当前已发布的 foundation release: pantheon-base-v0.11.1"

---

### Phase 3: CHANGELOG Entry (1 hour)
**Objective**: Document v0.11.1 in CHANGELOG.md

#### Task 3.1: Add CHANGELOG entry
**File**: `CHANGELOG.md`  
**Position**: After existing v0.10.27 entry  
**Content**:

```markdown
## [pantheon-base-v0.11.1] — 2026-09-04

Enterprise-grade design system engineering framework with comprehensive governance.

### Added
- **Frontend Design System Framework** (3,325 lines documentation)
  - COMPONENT_STYLING_GUIDE.md: Atomic design patterns, composition rules (682 lines)
  - UI_PATTERN_LIBRARY.md: 18 operational primitives, real-world examples (845 lines)
  - DESIGN_ENGINEERING_GUIDE.md: 4-layer engineering methodology (890 lines)
  - TOKEN_MIGRATION_GUIDE.md: Migration tooling, gradual adoption path (420 lines)
  - VERSION_MANAGEMENT_GUIDE.md: Semantic versioning, release procedures (488 lines)

- **Design Token Expansion** (+109% total coverage)
  - Total tokens: 32 → 67 (+109%)
  - Spacing tokens: 8 → 26 (+225% coverage)
  - 9 semantic container tokens (interactive/display/operation layers)
  - Container classification: `--container-interactive-*`, `--container-display-*`

- **Enhanced Mechanical Gates**
  - Smart whitelist for fine-tuning adjustments
  - check-ui-contract.mjs: Semantic token validation
  - Fine-tuning budget: 12 allowed micro-adjustments
  - Automatic enforcement in prebuild chain

- **Innovation vs Mainstream** (4 unique capabilities)
  - 3-tier container semantics (Ant/Arco lack this)
  - Visual anti-pattern checklist with mechanical enforcement
  - Controlled low-code with Feature Ledger governance
  - AI-friendly engineering documentation structure

### Changed
- **Design System Maturity**: 3/5 → 5/5 stars (+66% improvement)
- DESIGN.md §7: Complete token reference (67 tokens documented)
- DESIGN.md §7.9: Anti-pattern checklist with 8 forbidden patterns
- UI contract gate: Now validates semantic token usage
- Migrated 133 hardcoded spacing values to semantic tokens

### Fixed
- README.md: Clarified v0.11.0 → v0.11.1 version progression
- Harness manifest: Added required linkage fields for task tracking
- Dependencies: @humanfs/node 0.16.7 → 0.16.8 (frontend dev tooling)

### Verification
- **Release Commit**: d3030510 (includes all v0.11.0 work + documentation updates)
- **UI Contract**: 0 violations across 249 files
- **Visual Quality**: WCAG 2.1 AA compliance (light + dark modes)
- **Test Coverage**: 157 frontend tests, 85 backend test files, all passing
- **CI Gates**: Full Smoke, SonarCloud, CodeQL, Dependabot all PASS
- **GitHub Release**: Bound to commit d3030510

### Consumer Impact
- **Breaking Changes**: None (100% backward compatible)
- **Migration Effort**: < 1 hour (dependency version bumps only)
- **Optional Adoption**: New design patterns, tokens, documentation
- **pantheon-ops**: Update foundation-release.lock.json, reinstall dependencies
- **Go Consumers**: Update go.mod to v0.11.1
- **NPM Consumers**: Update package.json to 0.11.1

### Known Limitations
- Multi-tenant isolation: Marked as P2 roadmap (not yet implemented)
- SSO/OAuth2: Marked as P1 feature (planned for v0.12.0)
- Runtime low-code: Controlled generation only (rebuild required)

### Documentation
- 5 new frontend engineering guides (3,325 lines total)
- Updated DESIGN.md with complete token system
- Harness task evidence: `.harness/tasks/2026-09-04-v0.11.1-release-preparation/`
- Foundation release bundle: `releases/pantheon-base-v0.11.1/`

### Version Notes
v0.11.1 supersedes the unreleased v0.11.0 tag to include 7 additional commits:
- Documentation improvements (README v0.11.0 updates)
- Harness methodology linkage (task manifest structure)
- Development tooling updates (@humanfs/node patch)
```

---

### Phase 4: P1 Backend Fixes (4.5 hours)
**Objective**: Fix high-priority architectural issues

#### Task 4.1: Redis Fail-Fast Enforcement
**File**: `backend/pkg/database/redis.go`  
**Duration**: 30 minutes

```go
// Line 14-30, replace warning with fail-fast in production
func InitRedis(addr string, password string, db int) {
    // ... existing code ...
    if err != nil {
        msg := "failed to connect redis (authenticated requests will fail)"
        slog.Warn(msg, "addr", addr, "error", err)
        
        // NEW: Fail-fast in production
        if os.Getenv("PANTHEON_ENV") == "production" {
            slog.Error("Redis is required in production mode", "error", err)
            os.Exit(1)
        }
        
        RDB = nil
        return
    }
    // ...
}
```

**Test**:
```bash
export PANTHEON_ENV=production
export PANTHEON_REDIS_ADDR=invalid:6379
go run ./cmd/server  # Should exit with error
```

#### Task 4.2: Add Missing Database Indexes
**File**: `backend/pkg/database/migrations/000012_high_traffic_indexes.up.sql`  
**Duration**: 1 hour

```sql
-- Session list by user (frequent query in session management)
CREATE INDEX IF NOT EXISTS idx_user_session_user_revoked_expires 
ON system_user_session(user_id, revoked_at, refresh_expires_at);

-- Security dashboard aggregates
CREATE INDEX IF NOT EXISTS idx_security_event_severity_ack_created 
ON system_auth_security_event(severity, acknowledged, created_at);

-- Casbin permission check (role + resource path)
-- Current index (v0, v1, v2) misses ptype filter
CREATE INDEX IF NOT EXISTS idx_casbin_ptype_v0_v1 
ON casbin_rule(ptype, v0, v1);
```

**Downgrade**:
```sql
DROP INDEX IF EXISTS idx_user_session_user_revoked_expires ON system_user_session;
DROP INDEX IF EXISTS idx_security_event_severity_ack_created ON system_auth_security_event;
DROP INDEX IF EXISTS idx_casbin_ptype_v0_v1 ON casbin_rule;
```

**Test**:
```bash
cd backend
go run ./cmd/server  # Migrations run on startup
mysql -u root -p pantheon_base -e "SHOW INDEX FROM system_user_session WHERE Key_name = 'idx_user_session_user_revoked_expires';"
```

#### Task 4.3: Add Permission Cache Layer
**File**: `backend/modules/auth/login/login_runtime.go`  
**Duration**: 2 hours

```go
// Add caching to GetUserPerms method (line 253-260)
func (s *Runtime) GetUserPerms(userID uint64, roles []string) ([]string, error) {
    // NEW: Check Redis cache first
    cacheKey := fmt.Sprintf("user_perms:%d", userID)
    if s.rdb != nil {
        cached, err := s.rdb.Get(context.Background(), cacheKey).Result()
        if err == nil {
            var perms []string
            if json.Unmarshal([]byte(cached), &perms) == nil {
                return perms, nil
            }
        }
    }
    
    // Existing DB query logic...
    var perms []string
    // ... fetch from DB ...
    
    // NEW: Cache for 5 minutes
    if s.rdb != nil && len(perms) > 0 {
        if data, err := json.Marshal(perms); err == nil {
            s.rdb.Set(context.Background(), cacheKey, data, 5*time.Minute)
        }
    }
    
    return perms, nil
}

// NEW: Add cache invalidation on role/permission changes
func (s *Runtime) InvalidateUserPermCache(userID uint64) error {
    if s.rdb == nil {
        return nil
    }
    cacheKey := fmt.Sprintf("user_perms:%d", userID)
    return s.rdb.Del(context.Background(), cacheKey).Err()
}
```

**Integration Points**:
- Call `InvalidateUserPermCache` in:
  - `backend/modules/system/iam/role/role_service.go` - after role update
  - `backend/modules/system/iam/permission/permission_service.go` - after permission change
  - `backend/modules/system/iam/user/user_service.go` - after user role assignment

**Test**:
```go
// backend/modules/auth/login/login_runtime_test.go
func TestPermissionCache(t *testing.T) {
    // Setup test Redis
    // First call: hits DB
    // Second call: hits cache (verify no DB query)
    // After invalidation: hits DB again
}
```

#### Task 4.4: Document DB Connection Tuning
**File**: `docs/operations/DATABASE_TUNING.md` (new)  
**Duration**: 30 minutes

```markdown
# Database Connection Pool Tuning

## Production Calculation

```
Total connections = instances × max_open_conns
MySQL max_connections should be > total connections × 1.25 (safety margin)
```

Example:
- 10 backend instances
- 50 max_open_conns per instance
- Total: 500 connections
- MySQL: SET GLOBAL max_connections = 625;

## Recommended Settings

```bash
# Per instance (.env)
PANTHEON_DB_MAX_OPEN_CONNS=50       # Lower than default 100
PANTHEON_DB_MAX_IDLE_CONNS=10       # Keep default
PANTHEON_DB_CONN_MAX_LIFETIME_MINUTES=30  # Rotate connections
PANTHEON_DB_CONN_MAX_IDLE_TIME_MINUTES=5  # Close idle faster
```

## MySQL Configuration

```sql
-- Check current limits
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Adjust for production
SET GLOBAL max_connections = 625;
SET GLOBAL wait_timeout = 600;  -- 10 minutes
SET GLOBAL interactive_timeout = 600;
```

## Monitoring

Prometheus metrics:
- `go_sql_open_connections` - current open
- `go_sql_idle_connections` - current idle
- `go_sql_wait_count_total` - connection wait events (should be low)

Alert when:
- Open connections > 80% of max_open_conns
- Wait count increasing (connection pool exhausted)
```

#### Task 4.5: Fix Goroutine Leak in Metrics Collector
**File**: `backend/pkg/database/gorm.go`  
**Duration**: 1 hour

```go
// Line 120-134, add cancellation
func initMySQL(dsn string) (*gorm.DB, error) {
    // ... existing setup ...
    
    // NEW: Store cancel function for shutdown
    metricsCtx, metricsCancel := context.WithCancel(context.Background())
    metrics.RegisterDBMetricsCollector(metricsCancel)  // Store cancel
    
    go func() {
        defer func() {
            if r := recover(); r != nil {
                slog.Error("db metrics collector panic", "recover", r)
            }
        }()
        
        ticker := time.NewTicker(10 * time.Second)
        defer ticker.Stop()
        
        for {
            select {
            case <-metricsCtx.Done():
                slog.Info("db metrics collector shutting down")
                return
            case <-ticker.C:
                collectDBMetrics(sqlDB)
            }
        }
    }()
    
    return db, nil
}
```

**Integration with main.go**:
```go
// backend/cmd/server/main.go shutdown sequence
// After line 191
metrics.StopDBMetricsCollector()  // NEW: Call stored cancel function
```

**New file**: `backend/pkg/metrics/db_metrics.go`
```go
var dbMetricsCancel context.CancelFunc

func RegisterDBMetricsCollector(cancel context.CancelFunc) {
    dbMetricsCancel = cancel
}

func StopDBMetricsCollector() {
    if dbMetricsCancel != nil {
        dbMetricsCancel()
    }
}
```

---

### Phase 5: ops Sync Mechanism Fix (4 hours)
**Objective**: Restore pantheon-ops consumption capability

**Location**: pantheon-ops repository (separate from base)  
**Prerequisites**: v0.11.1 base release complete

#### Task 5.1: Create foundation-release.lock.json
**File**: `pantheon-ops/foundation-release.lock.json` (new)  
**Duration**: 30 minutes

```json
{
  "schemaVersion": 1,
  "baseVersion": "pantheon-base-v0.11.1",
  "releaseLine": "release/0.11",
  "releaseDate": "2026-09-04",
  "mode": "npm-package-consumer",
  "dependencies": {
    "go": {
      "module": "github.com/duanxldragon/pantheon-base/backend",
      "version": "v0.11.1",
      "sha256": "<calculated after release>"
    },
    "npm": {
      "package": "@duanxldragon/pantheon-base-ui",
      "version": "0.11.1",
      "tarball": "file:../../pantheon-base/frontend/duanxldragon-pantheon-base-ui-0.11.1.tgz",
      "sha256": "<calculated after npm pack>"
    }
  },
  "consumptionModel": "hybrid-local-dev",
  "notes": "Local development uses file: tarball and go replace directive. Production should consume from npm registry and Go proxy."
}
```

#### Task 5.2: Build and Commit NPM Tarball
**Location**: pantheon-base/frontend  
**Duration**: 30 minutes

```bash
cd pantheon-base/frontend
npm run build:lib  # Build library dist/
npm pack  # Creates duanxldragon-pantheon-base-ui-0.11.1.tgz

# Calculate SHA256 for lock file
sha256sum duanxldragon-pantheon-base-ui-0.11.1.tgz

# Commit tarball (temporary for local dev)
git add duanxldragon-pantheon-base-ui-0.11.1.tgz
git commit -m "chore: add npm package tarball for local consumption

Enables pantheon-ops local development via file: dependency.
Production deployments should use npm registry after publishing.

Tarball: duanxldragon-pantheon-base-ui-0.11.1.tgz
SHA256: <hash>
"
```

#### Task 5.3: Clean Up Stale ops Scripts
**File**: `pantheon-ops/package.json`  
**Duration**: 15 minutes

Remove broken script references:
```json
{
  "scripts": {
    // REMOVE these lines (scripts don't exist):
    // "rebuild:from-base": "node scripts/business-overlay/rebuild-from-base.mjs",
    // "check:business-overlay": "node scripts/business-overlay/check-business-overlay.mjs",
    // "test:business-overlay": "vitest run tests/business-overlay.test.ts",
    
    // KEEP:
    "check:business-boundaries": "node scripts/harness/check-boundaries.mjs --strict --repo pantheon-ops",
    "check:business-foundation": "npm run check:business-boundaries"
  }
}
```

#### Task 5.4: Document Actual Consumption Model
**File**: `pantheon-ops/docs/BASE_CONSUMPTION_MODEL.md` (new)  
**Duration**: 1 hour

```markdown
# pantheon-base Consumption Model

## Current Architecture: NPM Package + Go Module (Hybrid)

pantheon-ops consumes pantheon-base through two dependency tracks:

### Backend: Go Module
```go
// pantheon-ops/backend/go.mod
require github.com/duanxldragon/pantheon-base/backend v0.11.1

// Local development
replace github.com/duanxldragon/pantheon-base/backend => ../../pantheon-base/backend
```

### Frontend: NPM Package
```json
// pantheon-ops/frontend/package.json
{
  "dependencies": {
    "@duanxldragon/pantheon-base-ui": "file:../../pantheon-base/frontend/duanxldragon-pantheon-base-ui-0.11.1.tgz"
  }
}
```

## Upgrade Procedure

See `.harness/tasks/2026-09-04-v0.11.1-release-preparation/ops-upgrade-guide.md` for step-by-step instructions.

Summary:
1. Update `foundation-release.lock.json` with new version
2. Update `backend/go.mod` require line
3. Rebuild base NPM package, update ops package.json
4. Run `go mod tidy && npm install`
5. Verify: `npm run check:business-boundaries`
6. Smoke test: `npm run test:smoke:all`

## Contract Boundaries

### Shared Paths (base-owned, ops inherits)
- **Backend**: `backend/cmd`, `backend/internal`, `backend/modules`, `backend/pkg`
- **Frontend**: 104 files (see `releases/pantheon-base-v0.11.1/manifest.json`)

### Overlay Paths (ops-owned, base provides hooks)
- **Backend**: `backend/modules/business/*`
- **Frontend**: `frontend/src/modules/business/*`

Registry hooks:
- Backend: `initOverlayBusinessModules()` called before base module registration
- Frontend: `businessOverlayComponentRegistry.ts` imports base `ComponentRegistryMap`

## Historical Note: Overlay Rebuild Model

Earlier prototypes used `scripts/business-overlay/rebuild-from-base.mjs` to sync files.
Current model (v0.10.25+) uses package dependencies instead.

The overlay rebuild mechanism may return for experimental scenarios,
but stable ops consumption uses NPM + Go modules.
```

#### Task 5.5: Create ops Upgrade Guide
**File**: `.harness/tasks/2026-09-04-v0.11.1-release-preparation/ops-upgrade-guide.md`  
**Duration**: 1 hour

```markdown
# pantheon-ops Upgrade Guide: v0.10.25 → v0.11.1

**Target**: Upgrade pantheon-ops to consume pantheon-base v0.11.1  
**Estimated Duration**: 1.5 hours (excluding full smoke suite)  
**Prerequisites**: Clean git worktree in both repositories

---

## Phase 1: Pre-Upgrade Validation (15 min)

```bash
cd pantheon-ops
git status  # Must be clean

# Verify current baseline
npm run check:business-boundaries  # Must pass
cd backend && go mod verify  # Must pass
cd ../frontend && npm list @duanxldragon/pantheon-base-ui  # Check current version
```

Review base release notes:
```bash
cd ../../pantheon-base
cat releases/pantheon-base-v0.11.1/release-notes.md
cat releases/pantheon-base-v0.11.1/upgrade-notes.md
cat releases/pantheon-base-v0.11.1/consumer-impact.md
```

---

## Phase 2: Backend Upgrade (20 min)

```bash
cd pantheon-ops/backend

# Update go.mod require line (manual edit or go get)
go get github.com/duanxldragon/pantheon-base/backend@v0.11.1
# Keep local replace for development:
# replace github.com/duanxldragon/pantheon-base/backend => ../../pantheon-base/backend

go mod tidy
go build ./cmd/server  # Verify compilation
go test ./...  # Run tests
```

**Expected**: No code changes required (100% compatible).

---

## Phase 3: Frontend Upgrade (30 min)

```bash
cd ../../pantheon-base/frontend

# Build base UI package
npm run build:lib  # Creates dist/
npm pack  # Creates duanxldragon-pantheon-base-ui-0.11.1.tgz

# Verify tarball
ls -lh duanxldragon-pantheon-base-ui-0.11.1.tgz
sha256sum duanxldragon-pantheon-base-ui-0.11.1.tgz
```

```bash
cd ../../pantheon-ops/frontend

# Update package.json dependency (manual edit)
# "@duanxldragon/pantheon-base-ui": "file:../../pantheon-base/frontend/duanxldragon-pantheon-base-ui-0.11.1.tgz"

npm install  # Reinstall with new tarball

# Verify installed version
npm list @duanxldragon/pantheon-base-ui
# Should show: @duanxldragon/pantheon-base-ui@0.11.1

# Type check
npm run type-check  # Must pass
```

**Expected**: No code changes required (100% compatible).

---

## Phase 4: Contract Validation (15 min)

```bash
cd pantheon-ops/frontend

npm run check:menu-contract  # Verify menu structure
npm run check:ui-contract  # Verify design token usage
npm run check:business-boundaries  # Verify business/base separation
```

All checks should PASS. If failures:
- Menu contract: Check if base added new required menu fields
- UI contract: Check if business modules use new tokens correctly
- Boundaries: Check if business modules accidentally override shared paths

---

## Phase 5: Integration Testing (30 min + smoke suite)

```bash
# Terminal 1: Start backend
cd pantheon-ops/backend
go run ./cmd/server

# Terminal 2: Start frontend
cd ../frontend
npm run dev

# Terminal 3: Quick smoke
npm run test:smoke:platform:contracts  # 2-3 min
npm run test:smoke:system:pages  # 3-5 min

# Business module smoke
npm run test:smoke:business:cmdb  # If exists
npm run test:smoke:business:k8s  # If exists
```

**Full regression** (optional, 15-30 min):
```bash
npm run test:smoke:all
```

---

## Phase 6: Finalization (15 min)

```bash
cd ../..  # ops root

# Update foundation lock
# Edit foundation-release.lock.json:
# {
#   "baseVersion": "pantheon-base-v0.11.1",
#   "dependencies": {
#     "go": "github.com/duanxldragon/pantheon-base/backend@v0.11.1",
#     "npm": "@duanxldragon/pantheon-base-ui@0.11.1"
#   }
# }

git add foundation-release.lock.json backend/go.mod backend/go.sum frontend/package.json frontend/package-lock.json
git commit -m "chore: upgrade foundation to pantheon-base-v0.11.1

Upgraded pantheon-base dependency from v0.10.25 to v0.11.1.

Backend:
- Updated go.mod to v0.11.1
- No code changes required (100% compatible)
- All tests pass

Frontend:
- Updated @duanxldragon/pantheon-base-ui to 0.11.1
- No code changes required (100% compatible)
- All contract checks pass

New capabilities available (optional adoption):
- 67 design tokens (vs 32 in v0.10.x)
- 9 container semantic tokens
- 5 frontend engineering guides

Verified:
- Backend build: PASS
- Frontend type-check: PASS
- Contract validation: PASS
- Smoke tests: PASS

Release notes: pantheon-base/releases/pantheon-base-v0.11.1/
"
```

---

## Phase 7: Rollback (If Needed)

```bash
git revert HEAD  # Undo upgrade commit
cd backend && go mod tidy
cd ../frontend && npm install

# Verify rollback
npm list @duanxldragon/pantheon-base-ui  # Should show v0.10.25
cd ../backend && go list -m github.com/duanxldragon/pantheon-base/backend  # Should show v0.10.25
```

---

## Troubleshooting

### Issue: npm install fails "tarball not found"
**Cause**: Base tarball not built  
**Fix**: `cd pantheon-base/frontend && npm run build:lib && npm pack`

### Issue: Type errors after upgrade
**Cause**: Base changed exported types  
**Fix**: Check `node_modules/@duanxldragon/pantheon-base-ui/dist/index.d.ts`  
**Expected**: No type changes in v0.11.1 (100% compatible)

### Issue: Contract check failures
**Cause**: ops business modules use patterns no longer valid  
**Fix**: Review contract error messages, update business code

### Issue: Smoke tests fail
**Cause**: Base changed behavior (should not happen in v0.11.1)  
**Fix**: Check release notes for breaking changes (none expected)  
**Escalate**: If unexpected failures, rollback and report
```

---

### Phase 6: P2 Improvements (Optional, 3 hours)

#### Task 6.1: Upgrade Bcrypt Cost Factor
**File**: Multiple locations  
**Duration**: 1 hour

Strategy: Keep DefaultCost for existing passwords, use Cost 12 for new ones.

```go
// backend/modules/system/iam/user/user_service.go
// Line 314
const bcryptCostProduction = 12  // NEW constant

func (s *Service) CreateUser(...) {
    cost := bcrypt.DefaultCost
    if os.Getenv("PANTHEON_ENV") == "production" {
        cost = bcryptCostProduction
    }
    passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), cost)
    // ...
}
```

Apply to all password generation sites:
- `user_service.go:314` (CreateUser)
- `user_service.go:518` (UpdatePassword)
- `user_export.go:366` (Import)
- `user_username.go:78` (InitAdmin)
- `security_service.go:175` (ChangePassword)

**Test**:
```bash
export PANTHEON_ENV=production
go test ./modules/system/iam/user -run TestCreateUser
# Verify generated hash starts with $2a$12$ (not $2a$10$)
```

#### Task 6.2: Document Tenant Isolation Roadmap
**File**: `DESIGN.md`  
**Duration**: 30 minutes

Add disclaimer to Data Scope section:

```markdown
### 4.5 Data Scope (数据范围)

Supported modes:
- `all`: 全部数据
- `dept`: 本部门数据
- `dept_and_sub`: 本部门及下级数据
- `owner`: 仅本人数据
- `custom`: 自定义数据范围
- `tenant`: ⚠️ **Roadmap Feature** - Multi-tenant isolation (P2, not yet implemented)

**Tenant Isolation Status**:
The `tenant` data scope mode is accepted by validation but not implemented.
Full tenant isolation (DB partitioning, middleware injection) is planned for v0.12.0.

Current consumers (pantheon-ops) should NOT use `tenant` mode.
Attempting to do so will result in undefined behavior.

For true multi-tenant requirements, current workarounds:
1. Deploy separate instances per tenant (full isolation)
2. Use `custom` data scope with tenant_id filter (application-level)
3. Wait for v0.12.0 tenant isolation feature
```

#### Task 6.3: Add Query Timeout Context
**File**: Example in one service  
**Duration**: 1 hour

Pattern to apply across services:

```go
// backend/modules/system/iam/permission/permission_service.go
func (s *Service) ListSecurityEvents(ctx context.Context, query *SecurityEventQuery) (*SecurityEventPageResp, error) {
    // NEW: Enforce 10s query timeout
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    db := s.db.WithContext(ctx).Model(&SystemAuthSecurityEvent{})
    // ... existing query logic ...
}
```

Document pattern in `docs/development/BACKEND_PATTERNS.md` for future application.

#### Task 6.4: Remove Console.log Statements
**Files**: 2 locations  
**Duration**: 15 minutes

1. `frontend/src/i18n/index.ts`: Remove or guard with `import.meta.env.DEV`
2. `frontend/src/modules/auth/login/components/Login.tsx`: Remove or guard

```typescript
// Replace console.log with conditional logging
if (import.meta.env.DEV) {
  console.log('i18n initialized:', i18n.language);
}
```

#### Task 6.5: Add Operations Runbook
**File**: `docs/operations/RUNBOOK.md` (new)  
**Duration**: 30 minutes

```markdown
# Operations Runbook

## Redis Failure Scenarios

### Symptom: All authenticated requests return 401
**Cause**: Redis connection lost, token sessions unavailable  
**Detection**: Check logs for "failed to connect redis" warning  
**Impact**: Complete auth system failure

**Immediate Actions**:
1. Check Redis health: `redis-cli ping`
2. Verify network connectivity to Redis
3. Check Redis logs: `docker logs <redis-container>`
4. Restart Redis if needed: `docker restart <redis-container>`

**Recovery**:
- Backend auto-reconnects on next request
- Existing sessions lost (users must re-login)
- No data loss (sessions stored in Redis only)

**Prevention**:
- Enable Redis persistence (AOF or RDB)
- Deploy Redis sentinel for HA
- Monitor `redis_connected` metric

### Symptom: Rate limiting doesn't work across instances
**Cause**: Redis disconnected, fallback to in-memory (per-instance) limits  
**Detection**: `rate_limiter_backend=memory` metric  
**Impact**: Attackers can bypass limits by hitting different instances

**Actions**:
1. Restore Redis connectivity (see above)
2. Rate limiter auto-switches back to Redis
3. Review rate limit breach logs during outage

## Database Connection Saturation

### Symptom: "Error 1040: Too many connections"
**Cause**: Total connections > MySQL max_connections  
**Detection**: Check MySQL `SHOW STATUS LIKE 'Threads_connected';`

**Immediate Actions**:
```sql
-- Check current usage
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Increase limit (temporary)
SET GLOBAL max_connections = 1000;

-- Find long-running queries
SHOW PROCESSLIST;
KILL <thread_id>;  -- If stuck
```

**Long-term Fix**:
- Tune `PANTHEON_DB_MAX_OPEN_CONNS` per instance (see DATABASE_TUNING.md)
- Increase MySQL `max_connections` permanently in my.cnf
- Add connection pool monitoring

## Operation Log Queue Saturation

### Symptom: Audit logs missing under high load
**Cause**: Operation log queue full (10,000 capacity), drops overflow  
**Detection**: `operation_log_dropped_total` metric increasing

**Impact**: Audit trail gaps (acceptable per design)

**Actions**:
1. This is expected behavior under sustained overload
2. Review `operation_log_queue_size` metric
3. If chronic, consider increasing `operationLogBufferSize` in code
4. Or offload audit logs to Redis Streams for durability

**Not a Bug**: This is the documented load-shedding mechanism.
```

---

### Phase 7: Release Execution (2 hours)
**Objective**: Tag, publish, verify

#### Task 7.1: Final Pre-Release Checklist

```bash
# 1. All P0 fixes committed
git status  # Clean worktree

# 2. Version alignment
grep -r "0.11.1" frontend/package.json VERSION CHANGELOG.md README.md

# 3. Release docs complete
ls -lh releases/pantheon-base-v0.11.1/*.md

# 4. All tests pass
cd backend && go test ./...
cd ../frontend && npm run test:unit

# 5. Contract checks pass
cd frontend
npm run check:menu-contract
npm run check:ui-contract
npm run check:shell-visual-contract

# 6. Build succeeds
npm run build

# 7. CI green (check GitHub Actions)
```

#### Task 7.2: Create Annotated Git Tag

```bash
git tag -a pantheon-base-v0.11.1 -m "pantheon-base v0.11.1 - Enterprise Design System Engineering

Headline:
Complete frontend design system audit and 3-tier engineering framework.

Key Changes:
- 5 comprehensive engineering guides (3,325 lines)
- Token system expansion: 32→67 (+109%)
- Design system maturity: 3/5 → 5/5 stars
- 100% backward compatible

Release Commit: d3030510
Release Notes: releases/pantheon-base-v0.11.1/release-notes.md
CI Verification: All gates PASS
"

git push origin pantheon-base-v0.11.1
```

#### Task 7.3: Create GitHub Release

Via `gh` CLI or GitHub web UI:

```bash
gh release create pantheon-base-v0.11.1 \
  --title "pantheon-base v0.11.1 - Enterprise Design System Engineering" \
  --notes-file releases/pantheon-base-v0.11.1/release-notes.md \
  --target d3030510

# Attach release bundle
tar czf pantheon-base-v0.11.1-bundle.tar.gz releases/pantheon-base-v0.11.1/
gh release upload pantheon-base-v0.11.1 pantheon-base-v0.11.1-bundle.tar.gz

# Calculate and attach checksum
sha256sum pantheon-base-v0.11.1-bundle.tar.gz > pantheon-base-v0.11.1-bundle.tar.gz.sha256
gh release upload pantheon-base-v0.11.1 pantheon-base-v0.11.1-bundle.tar.gz.sha256
```

#### Task 7.4: Update README Badge (Optional)

```markdown
<!-- README.md -->
![Release](https://img.shields.io/github/v/release/duanxldragon/pantheon-base?label=latest)
![Design System](https://img.shields.io/badge/design_system-5%2F5-brightgreen)
![Go Version](https://img.shields.io/github/go-mod/go-version/duanxldragon/pantheon-base)
![License](https://img.shields.io/github/license/duanxldragon/pantheon-base)
```

---

### Phase 8: Post-Release Verification (1 hour)

#### Task 8.1: Verify Release Artifacts

```bash
# Download from GitHub
wget https://github.com/duanxldragon/pantheon-base/releases/download/pantheon-base-v0.11.1/pantheon-base-v0.11.1-bundle.tar.gz
sha256sum -c pantheon-base-v0.11.1-bundle.tar.gz.sha256

# Extract and verify
tar xzf pantheon-base-v0.11.1-bundle.tar.gz
ls releases/pantheon-base-v0.11.1/
cat releases/pantheon-base-v0.11.1/release-notes.md
```

#### Task 8.2: Test ops Consumption (Dry Run)

```bash
cd pantheon-ops

# Follow ops-upgrade-guide.md
# Run through all 6 phases
# Document any unexpected issues

# Success criteria:
# - Backend compiles
# - Frontend type-checks
# - All contract checks pass
# - Smoke tests pass
```

#### Task 8.3: Update Internal Tracking

```bash
# Update Harness evidence
cp releases/pantheon-base-v0.11.1/*.md .harness/tasks/2026-09-04-v0.11.1-release-preparation/evidence/

# Mark task complete
# Edit .harness/tasks/2026-09-04-v0.11.1-release-preparation/task-manifest.md
# Status: 🟢 Complete
```

---

## Success Criteria

### Must Have (P0)
- [ ] All 4 P0 blockers resolved
- [ ] Git tag `pantheon-base-v0.11.1` created and pushed
- [ ] GitHub Release published with bundle + checksum
- [ ] Release docs complete (notes, upgrade, impact)
- [ ] CHANGELOG.md updated
- [ ] All version references aligned (0.11.1)
- [ ] All CI gates green
- [ ] pantheon-ops can consume (dry run succeeds)

### Should Have (P1)
- [ ] Redis fail-fast implemented
- [ ] Missing database indexes added
- [ ] Permission cache layer implemented
- [ ] DB connection tuning documented
- [ ] Metrics goroutine leak fixed
- [ ] ops sync mechanism restored

### Nice to Have (P2)
- [ ] Bcrypt cost upgraded
- [ ] Tenant isolation documented
- [ ] Query timeout pattern documented
- [ ] Console.log statements removed
- [ ] Operations runbook created

---

## Risk Mitigation

### Risk: Breaking Change Introduced by P1 Fixes
**Probability**: Low  
**Mitigation**: All P1 fixes are internal optimizations, no API changes  
**Contingency**: Revert specific commit, release as v0.11.2

### Risk: ops Upgrade Fails in Production
**Probability**: Medium  
**Mitigation**: Comprehensive smoke test suite, staged rollout  
**Contingency**: ops rollback via `foundation-release.lock.json` version change

### Risk: Performance Regression from Permission Cache
**Probability**: Low  
**Mitigation**: Cache invalidation on every role/permission change  
**Contingency**: Feature flag to disable cache, monitor `user_perms:*` Redis keys

### Risk: Database Migration Failure (Missing Indexes)
**Probability**: Very Low  
**Mitigation**: `CREATE INDEX IF NOT EXISTS`, downgrade script provided  
**Contingency**: `DROP INDEX` and revert migration file

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Release Docs | 2.5 hours | None |
| 2. Version Sync | 30 min | Phase 1 |
| 3. CHANGELOG | 1 hour | Phase 1, 2 |
| 4. P1 Backend Fixes | 4.5 hours | Phase 2 |
| 5. ops Sync Fix | 4 hours | Phase 4 (parallel OK) |
| 6. P2 Improvements | 3 hours | Optional |
| 7. Release Execution | 2 hours | Phase 1-5 complete |
| 8. Post-Release Verify | 1 hour | Phase 7 |
| **Total (P0+P1)** | **15.5 hours** | **~2 days** |
| **Total (with P2)** | **18.5 hours** | **~2.5 days** |

**Recommended Schedule**:
- Day 1 AM: Phase 1-3 (docs + versioning)
- Day 1 PM: Phase 4 (backend fixes)
- Day 2 AM: Phase 5 (ops sync) + Phase 7 (release)
- Day 2 PM: Phase 8 (verification) + Phase 6 (P2, time permitting)

---

## Next Steps

1. **Review this manifest** with team/stakeholders
2. **Approve P0/P1 scope** (P2 optional)
3. **Execute Phase 1-3** (documentation, low risk)
4. **Code review P1 fixes** before merging
5. **Coordinate ops upgrade** with ops team
6. **Release v0.11.1** when all gates pass
7. **Monitor production** for 48h post-release

---

## References

- Comprehensive Review Reports: `.harness/tasks/2026-09-04-v0.11.1-release-preparation/reviews/`
- QA Review: 4 P0 blockers, smoke test gaps
- Architect Review: Redis fail-fast, N+1 queries, indexes
- PM Review: Empty docs, version mismatch
- Engineer Review: Goroutine leak, console.log
- Sync Review: ops broken upgrade path
- Market Analysis: Competitive positioning
- UI Audit: Excellent quality, WCAG AA compliant
- Security Audit: bcrypt cost, OWASP coverage

**Full review archive**: 14 specialized teams, 700K+ tokens analyzed, 10 domains audited.
