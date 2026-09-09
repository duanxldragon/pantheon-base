# Task Packet: P1-5 Performance Baseline Testing

## Goal

Establish performance baseline metrics for Pantheon Base to enable capacity planning, performance regression detection, and optimization prioritization.

## Priority

**P1 - High** (Capacity planning and performance governance)

## Source

Cross-Review Report: Performance and scalability requirements
TASK_MASTER_PLAN.md: P1-5 task specification

## Dependencies

- **Blocked by**: None (can start immediately)
- **Enables**: Capacity planning, performance monitoring, optimization decisions
- **Related**: P1-3 K8s Manifests (resource sizing validation)

## Current State

**Finding**: No performance testing infrastructure exists.

```bash
$ find . -name "*benchmark*" -o -name "*perf*" -o -name "*load*"
# No results
```

**Current testing**: Only functional tests exist (unit, integration, E2E).

---

## Scope

### In

**Performance Test Infrastructure**:
- Load testing scripts (k6)
- Backend Go benchmarks
- Baseline metrics collection
- Performance test documentation
- CI integration recommendations

**Metrics to Measure**:
- API throughput (requests/sec)
- API latency (p50, p95, p99)
- Database query performance
- Memory usage under load
- CPU usage under load
- Error rate under load
- Session handling capacity

### Out

- Frontend performance testing (separate task)
- Database optimization (separate task)
- Caching strategy implementation (separate task)
- Production monitoring setup (separate task)
- Long-running soak tests (baseline only)

---

## Approach

### 1. Load Testing with k6

**Tool**: [k6](https://k6.io/) - Modern load testing tool

**Why k6**:
- JavaScript-based (easy to write)
- Excellent CLI output
- Built-in metrics
- Can run locally or in CI
- Open source

### 2. Go Benchmarks

**Tool**: Go's built-in `testing` package

**Why**:
- Standard Go tooling
- Precise micro-benchmarks
- Memory allocation tracking
- Easy to run in CI

### 3. Baseline Scenarios

**Focus on critical paths**:
- User login
- Dashboard load (with menu/permissions)
- CRUD operations (create, list, update, delete)
- Permission checking
- Session validation

---

## Implementation Plan

### Phase 1: k6 Load Testing (4 hours)

**Directory Structure**:
```
tests/performance/
├── k6/
│   ├── scenarios/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── user-crud.js
│   │   └── permission-check.js
│   ├── utils/
│   │   ├── config.js
│   │   └── helpers.js
│   ├── run-baseline.sh
│   └── README.md
└── results/
    └── .gitkeep
```

**Test Scenarios**:

**1. Login Test** (`scenarios/login.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 50 },   // Sustained
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    username: 'admin',
    password: 'admin123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post('http://localhost:8080/api/v1/auth/login', payload, params);

  check(res, {
    'login successful': (r) => r.status === 200,
    'has session token': (r) => r.json('data.sessionToken') !== undefined,
  });

  sleep(1);
}
```

**2. Dashboard Load Test** (`scenarios/dashboard.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login } from '../utils/helpers.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = login();

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Get current user info
  let res = http.get('http://localhost:8080/api/v1/auth/me', params);
  check(res, { 'me endpoint ok': (r) => r.status === 200 });

  // Get menu tree
  res = http.get('http://localhost:8080/api/v1/system/menus/tree', params);
  check(res, { 'menu tree ok': (r) => r.status === 200 });

  // Get user permissions
  res = http.get('http://localhost:8080/api/v1/system/permissions/me', params);
  check(res, { 'permissions ok': (r) => r.status === 200 });

  sleep(2);
}
```

**3. CRUD Test** (`scenarios/user-crud.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login } from '../utils/helpers.js';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  vus: 10,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const token = login();
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // List users
  let res = http.get('http://localhost:8080/api/v1/system/users?page=1&pageSize=20', params);
  check(res, { 'list users ok': (r) => r.status === 200 });

  // Create user
  const payload = JSON.stringify({
    username: `testuser_${randomString(8)}`,
    email: `test_${randomString(8)}@example.com`,
    password: 'Test123!',
    nickname: 'Test User',
  });

  res = http.post('http://localhost:8080/api/v1/system/users', payload, params);
  const userId = res.json('data.id');
  check(res, { 'create user ok': (r) => r.status === 200 && userId !== undefined });

  if (userId) {
    // Get user detail
    res = http.get(`http://localhost:8080/api/v1/system/users/${userId}`, params);
    check(res, { 'get user ok': (r) => r.status === 200 });

    // Update user
    const updatePayload = JSON.stringify({
      nickname: 'Updated User',
    });
    res = http.put(`http://localhost:8080/api/v1/system/users/${userId}`, updatePayload, params);
    check(res, { 'update user ok': (r) => r.status === 200 });

    // Delete user
    res = http.del(`http://localhost:8080/api/v1/system/users/${userId}`, null, params);
    check(res, { 'delete user ok': (r) => r.status === 200 });
  }

  sleep(1);
}
```

**Helper Functions** (`utils/helpers.js`):
```javascript
import http from 'k6/http';

export function login() {
  const payload = JSON.stringify({
    username: 'admin',
    password: 'admin123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post('http://localhost:8080/api/v1/auth/login', payload, params);
  return res.json('data.sessionToken');
}

export function createTestUser(token) {
  const payload = JSON.stringify({
    username: `perf_test_${Date.now()}`,
    email: `perf_${Date.now()}@example.com`,
    password: 'Test123!',
    nickname: 'Perf Test User',
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:8080/api/v1/system/users', payload, params);
  return res.json('data.id');
}
```

**Run Script** (`run-baseline.sh`):
```bash
#!/bin/bash

# Pantheon Base Performance Baseline Tests
# Run all k6 scenarios and collect results

set -e

BACKEND_URL=${BACKEND_URL:-http://localhost:8080}
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$RESULTS_DIR"

echo "🚀 Starting Pantheon Base Performance Baseline Tests"
echo "Backend URL: $BACKEND_URL"
echo "Results: $RESULTS_DIR"
echo ""

# Check if backend is running
if ! curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "❌ Backend is not running at $BACKEND_URL"
    exit 1
fi

echo "✅ Backend is healthy"
echo ""

# Run each scenario
echo "📊 Running Login Scenario..."
k6 run --out json="$RESULTS_DIR/login.json" scenarios/login.js

echo ""
echo "📊 Running Dashboard Scenario..."
k6 run --out json="$RESULTS_DIR/dashboard.json" scenarios/dashboard.js

echo ""
echo "📊 Running User CRUD Scenario..."
k6 run --out json="$RESULTS_DIR/user-crud.json" scenarios/user-crud.js

echo ""
echo "✅ All scenarios completed"
echo "📁 Results saved to: $RESULTS_DIR"

# Generate summary
echo ""
echo "📈 Performance Summary:"
echo "----------------------"
k6 inspect "$RESULTS_DIR/login.json" | grep -E "(http_req_duration|http_req_failed)"
k6 inspect "$RESULTS_DIR/dashboard.json" | grep -E "(http_req_duration|http_req_failed)"
k6 inspect "$RESULTS_DIR/user-crud.json" | grep -E "(http_req_duration|http_req_failed)"
```

### Phase 2: Go Benchmarks (2 hours)

**Directory**: `backend/modules/*/`

**Example Benchmarks**:

**1. Auth Module** (`backend/modules/auth/login/login_benchmark_test.go`):
```go
package login

import (
    "testing"
)

func BenchmarkValidatePassword(b *testing.B) {
    password := "Test123!"
    hash := "$2a$10$..." // Pre-computed bcrypt hash

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = validatePassword(password, hash)
    }
}

func BenchmarkGenerateSessionToken(b *testing.B) {
    user := &models.User{ID: 1, Username: "testuser"}

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = generateSessionToken(user)
    }
}

func BenchmarkCheckPermission(b *testing.B) {
    // Setup
    user := &models.User{ID: 1}
    resource := "user"
    action := "read"

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = checkPermission(user, resource, action)
    }
}
```

**2. IAM Module** (`backend/modules/system/iam/user/repository_benchmark_test.go`):
```go
package user

import (
    "context"
    "testing"
)

func BenchmarkFindByID(b *testing.B) {
    // Setup: Create test DB and user
    db := setupTestDB(b)
    repo := NewRepository(db)
    user := createTestUser(db)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = repo.FindByID(context.Background(), user.ID)
    }
}

func BenchmarkListWithPagination(b *testing.B) {
    db := setupTestDB(b)
    repo := NewRepository(db)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = repo.List(context.Background(), 1, 20)
    }
}
```

**Run Benchmarks**:
```bash
# Run all benchmarks
go test -bench=. -benchmem ./...

# Run specific package
go test -bench=. -benchmem ./backend/modules/auth/login

# Save results
go test -bench=. -benchmem ./... > benchmark-baseline.txt
```

### Phase 3: Baseline Metrics Collection (1 hour)

**Document**: `tests/performance/BASELINE_METRICS.md`

```markdown
# Pantheon Base Performance Baseline

**Test Date**: 2026-09-08
**Version**: v0.11.2
**Environment**: Local development (MacBook Pro M1, 16GB RAM)

## API Performance

| Scenario | RPS | p50 | p95 | p99 | Error Rate |
|----------|-----|-----|-----|-----|------------|
| Login | 50 | 120ms | 250ms | 350ms | 0.1% |
| Dashboard Load | 100 | 450ms | 800ms | 1200ms | 0.2% |
| User CRUD | 10 | 180ms | 400ms | 600ms | 0.5% |

## Resource Usage

| Scenario | CPU (avg) | Memory (avg) | Memory (peak) |
|----------|-----------|--------------|---------------|
| Idle | 2% | 150MB | 150MB |
| Login (50 RPS) | 25% | 250MB | 300MB |
| Dashboard (100 RPS) | 45% | 350MB | 450MB |

## Database Queries

| Operation | Avg Time | p95 | Queries/Request |
|-----------|----------|-----|-----------------|
| User login | 15ms | 30ms | 3 |
| Dashboard load | 50ms | 100ms | 8 |
| User CRUD | 20ms | 45ms | 2-4 |

## Bottlenecks Identified

1. **Dashboard load** - Multiple sequential queries (N+1)
2. **Permission checking** - Casbin policy load on every request
3. **Session validation** - Redis round-trip on every request

## Capacity Estimates

**Single Instance** (250m CPU, 512Mi memory):
- Sustained: 30-50 RPS
- Peak: 100 RPS (short duration)
- Concurrent users: 200-300

**3-Pod Deployment** (K8s baseline):
- Sustained: 100-150 RPS
- Peak: 300 RPS
- Concurrent users: 600-900

**10-Pod Deployment** (K8s max with HPA):
- Sustained: 300-500 RPS
- Peak: 1000 RPS
- Concurrent users: 2000-3000
```

### Phase 4: Documentation (1 hour)

**Files**:
1. `tests/performance/README.md` - How to run tests
2. `tests/performance/BASELINE_METRICS.md` - Baseline results
3. `docs/PERFORMANCE_GUIDE.md` - Performance best practices

---

## Success Criteria

### Infrastructure
- [ ] k6 load testing scripts created
- [ ] Go benchmarks implemented
- [ ] Test runner script working
- [ ] Results directory structure

### Metrics
- [ ] API latency baseline (p50, p95, p99)
- [ ] Throughput baseline (RPS)
- [ ] Resource usage baseline (CPU, memory)
- [ ] Error rate baseline

### Documentation
- [ ] Test execution guide
- [ ] Baseline metrics documented
- [ ] Bottlenecks identified
- [ ] Capacity estimates provided

---

## Deliverables

1. **k6 Test Suite**: 3+ scenarios covering critical paths
2. **Go Benchmarks**: Key operations benchmarked
3. **Baseline Report**: Metrics documented
4. **Capacity Plan**: Resource requirements estimated
5. **CI Integration Guide**: How to run in CI

---

## Estimated Effort

- k6 load testing setup: 4 hours
- Go benchmarks: 2 hours
- Baseline collection: 1 hour
- Documentation: 1 hour
- **Total: 8 hours**

---

## Evidence Required

- k6 test scripts (3+ scenarios)
- Go benchmark files (2+ packages)
- Baseline metrics document
- Test execution output
- Capacity planning estimates

---

## Linkage

- **Task ID**: 2026-09-08-p1-performance-baseline
- **Depends on**: None
- **Related**: P1-3 K8s Manifests (validates resource sizing)
- **Enables**: Performance optimization prioritization
- **Evidence Directory**: `.harness/evidence/2026-09-08-p1-performance-baseline/`
- **Priority**: P1 (High)
