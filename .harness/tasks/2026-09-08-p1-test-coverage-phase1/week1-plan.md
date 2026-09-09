# P1-1 Test Coverage Phase 1 - Week 1 Execution Plan

**Task ID**: 2026-09-08-p1-test-coverage-phase1  
**Status**: 🔄 Week 1 - Test Infrastructure Setup  
**Started At**: 2026-09-08  
**Week 1 Effort**: 4 hours

---

## Week 1 Goals: Test Infrastructure & Analysis

### Objectives
1. Set up test infrastructure and fixtures
2. Complete detailed coverage analysis
3. Create test utilities and helpers
4. Document testing patterns

---

## Phase 1.1: Coverage Analysis Deep Dive (1 hour)

### Generate Detailed Coverage Report

```bash
cd backend

# Generate coverage for all packages
go test -coverprofile=coverage.out ./...

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# Generate function-level report
go tool cover -func=coverage.out > coverage-functions.txt
```

### Identify Zero-Coverage Functions

```bash
# Find all 0% coverage functions
go tool cover -func=coverage.out | grep "0.0%" > zero-coverage-functions.txt

# Count by module
grep "modules/auth" zero-coverage-functions.txt | wc -l
grep "modules/system/iam" zero-coverage-functions.txt | wc -l
grep "modules/system/audit" zero-coverage-functions.txt | wc -l
```

---

## Phase 1.2: Test Fixture Infrastructure (2 hours)

### Directory Structure

```
backend/pkg/testutil/
├── fixtures/
│   ├── users.go          # User test data
│   ├── roles.go          # Role test data
│   ├── departments.go    # Department test data
│   └── permissions.go    # Permission test data
├── mocks/
│   ├── db.go            # Database mocks
│   ├── redis.go         # Redis mocks
│   └── casbin.go        # Casbin mocks
├── helpers/
│   ├── assert.go        # Custom assertions
│   ├── auth.go          # Auth test helpers
│   └── http.go          # HTTP test helpers
└── testutil.go          # Main utilities
```

### Implementation Files

**1. Test Database Helper** (`pkg/testutil/db.go`):

```go
package testutil

import (
    "testing"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// SetupTestDB creates an in-memory SQLite database for testing
func SetupTestDB(t *testing.T) *gorm.DB {
    t.Helper()
    
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    if err != nil {
        t.Fatalf("failed to open test database: %v", err)
    }
    
    // Auto-migrate all models
    if err := AutoMigrateTestModels(db); err != nil {
        t.Fatalf("failed to migrate test database: %v", err)
    }
    
    return db
}

// AutoMigrateTestModels migrates all models for testing
func AutoMigrateTestModels(db *gorm.DB) error {
    return db.AutoMigrate(
        // Add all models here
        &models.User{},
        &models.Role{},
        &models.Department{},
        &models.Permission{},
        // ... more models
    )
}

// CleanupTestDB closes the database connection
func CleanupTestDB(t *testing.T, db *gorm.DB) {
    t.Helper()
    
    sqlDB, err := db.DB()
    if err != nil {
        t.Logf("failed to get sql.DB: %v", err)
        return
    }
    
    if err := sqlDB.Close(); err != nil {
        t.Logf("failed to close database: %v", err)
    }
}
```

**2. User Fixtures** (`pkg/testutil/fixtures/users.go`):

```go
package fixtures

import (
    "github.com/duanxldragon/pantheon-base/backend/modules/system/iam/user/models"
    "gorm.io/gorm"
)

// CreateTestUser creates a test user with default values
func CreateTestUser(db *gorm.DB, username string) (*models.User, error) {
    user := &models.User{
        Username: username,
        Email:    username + "@test.com",
        Password: "$2a$10$...", // Pre-hashed password for "test123"
        Nickname: "Test " + username,
        Status:   "active",
    }
    
    if err := db.Create(user).Error; err != nil {
        return nil, err
    }
    
    return user, nil
}

// CreateAdminUser creates an admin user
func CreateAdminUser(db *gorm.DB) (*models.User, error) {
    return CreateTestUser(db, "admin")
}

// CreateUserWithRole creates a user with specific role
func CreateUserWithRole(db *gorm.DB, username string, roleKey string) (*models.User, error) {
    user, err := CreateTestUser(db, username)
    if err != nil {
        return nil, err
    }
    
    // Assign role
    role := &models.Role{Key: roleKey}
    if err := db.FirstOrCreate(role, models.Role{Key: roleKey}).Error; err != nil {
        return nil, err
    }
    
    // Create user-role association
    if err := db.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", user.ID, role.ID).Error; err != nil {
        return nil, err
    }
    
    return user, nil
}
```

**3. HTTP Test Helper** (`pkg/testutil/helpers/http.go`):

```go
package helpers

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
)

// HTTPTestContext creates a test Gin context
func HTTPTestContext(t *testing.T, method, path string, body interface{}) (*gin.Context, *httptest.ResponseRecorder) {
    t.Helper()
    
    gin.SetMode(gin.TestMode)
    
    var bodyReader io.Reader
    if body != nil {
        jsonBody, err := json.Marshal(body)
        if err != nil {
            t.Fatalf("failed to marshal body: %v", err)
        }
        bodyReader = bytes.NewReader(jsonBody)
    }
    
    req := httptest.NewRequest(method, path, bodyReader)
    req.Header.Set("Content-Type", "application/json")
    
    recorder := httptest.NewRecorder()
    ctx, _ := gin.CreateTestContext(recorder)
    ctx.Request = req
    
    return ctx, recorder
}

// AssertJSONResponse checks JSON response
func AssertJSONResponse(t *testing.T, recorder *httptest.ResponseRecorder, expectedStatus int, expectedBody map[string]interface{}) {
    t.Helper()
    
    if recorder.Code != expectedStatus {
        t.Errorf("expected status %d, got %d", expectedStatus, recorder.Code)
    }
    
    if expectedBody != nil {
        var actual map[string]interface{}
        if err := json.Unmarshal(recorder.Body.Bytes(), &actual); err != nil {
            t.Fatalf("failed to unmarshal response: %v", err)
        }
        
        // Compare key fields
        for key, expectedValue := range expectedBody {
            if actualValue, ok := actual[key]; !ok || actualValue != expectedValue {
                t.Errorf("expected %s=%v, got %v", key, expectedValue, actualValue)
            }
        }
    }
}
```

**4. Auth Helper** (`pkg/testutil/helpers/auth.go`):

```go
package helpers

import (
    "context"
    "testing"
    
    "github.com/gin-gonic/gin"
)

// SetAuthContext sets authentication context for testing
func SetAuthContext(ctx *gin.Context, userID uint64, username string, roleKeys []string) {
    ctx.Set("user_id", userID)
    ctx.Set("username", username)
    ctx.Set("role_keys", roleKeys)
}

// CreateAuthenticatedContext creates a context with auth info
func CreateAuthenticatedContext(t *testing.T, userID uint64) *gin.Context {
    t.Helper()
    
    ctx, _ := HTTPTestContext(t, "GET", "/", nil)
    SetAuthContext(ctx, userID, "testuser", []string{"user"})
    
    return ctx
}
```

---

## Phase 1.3: Testing Patterns Documentation (1 hour)

### Document: `backend/docs/TESTING_GUIDE.md`

```markdown
# Testing Guide for Pantheon Base

## Test Structure

### Unit Tests

File naming: `*_test.go` in the same package

Example:
```go
package user

import (
    "testing"
    "github.com/duanxldragon/pantheon-base/backend/pkg/testutil"
)

func TestUserService_Create(t *testing.T) {
    // Setup
    db := testutil.SetupTestDB(t)
    defer testutil.CleanupTestDB(t, db)
    
    service := NewUserService(db)
    
    // Test
    user, err := service.Create(context.Background(), &CreateUserRequest{
        Username: "testuser",
        Email: "test@example.com",
    })
    
    // Assert
    if err != nil {
        t.Fatalf("expected no error, got %v", err)
    }
    if user.Username != "testuser" {
        t.Errorf("expected username=testuser, got %s", user.Username)
    }
}
```

### Table-Driven Tests

```go
func TestValidatePassword(t *testing.T) {
    tests := []struct {
        name     string
        password string
        wantErr  bool
    }{
        {"valid password", "Test123!", false},
        {"too short", "Test1!", true},
        {"no uppercase", "test123!", true},
        {"no number", "TestTest!", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidatePassword(tt.password)
            if (err != nil) != tt.wantErr {
                t.Errorf("expected error=%v, got %v", tt.wantErr, err)
            }
        })
    }
}
```

### Fixtures

Use `testutil/fixtures` package:

```go
import "github.com/duanxldragon/pantheon-base/backend/pkg/testutil/fixtures"

func TestUserList(t *testing.T) {
    db := testutil.SetupTestDB(t)
    defer testutil.CleanupTestDB(t, db)
    
    // Create test data
    user1, _ := fixtures.CreateTestUser(db, "user1")
    user2, _ := fixtures.CreateTestUser(db, "user2")
    
    // Test listing
    service := NewUserService(db)
    users, err := service.List(context.Background(), 1, 10)
    
    // Assertions
    assert.NoError(t, err)
    assert.Len(t, users, 2)
}
```

## Running Tests

### All tests
```bash
go test ./...
```

### Specific package
```bash
go test ./modules/auth/login
```

### With coverage
```bash
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Verbose
```bash
go test -v ./...
```

## Best Practices

1. **One assertion per test** (when possible)
2. **Use table-driven tests** for multiple scenarios
3. **Clean up resources** with `defer`
4. **Use test helpers** from `testutil` package
5. **Mock external dependencies** (DB, Redis, HTTP)
6. **Test error cases** not just happy path
7. **Name tests clearly**: `TestFunction_Scenario_ExpectedResult`

## Coverage Goals

- **Auth module**: 60%+
- **IAM module**: 50%+
- **Audit module**: 50%+
- **Overall**: 30%+
```

---

## Deliverables - Week 1

### Files to Create

1. `backend/pkg/testutil/db.go` - Database test utilities
2. `backend/pkg/testutil/fixtures/users.go` - User fixtures
3. `backend/pkg/testutil/fixtures/roles.go` - Role fixtures
4. `backend/pkg/testutil/helpers/http.go` - HTTP test helpers
5. `backend/pkg/testutil/helpers/auth.go` - Auth test helpers
6. `backend/docs/TESTING_GUIDE.md` - Testing documentation

### Reports to Generate

1. `coverage-full-report.html` - HTML coverage visualization
2. `coverage-functions.txt` - Function-level coverage
3. `zero-coverage-functions.txt` - Functions with 0% coverage
4. `coverage-by-module.md` - Coverage breakdown by module

---

## Success Criteria - Week 1

- [ ] Test database helper implemented
- [ ] User/Role fixtures created
- [ ] HTTP/Auth test helpers created
- [ ] Testing guide documented
- [ ] Coverage reports generated
- [ ] Zero-coverage functions identified
- [ ] Test patterns documented

---

## Timeline

**Day 1** (2 hours):
- Coverage analysis deep dive
- Generate all reports
- Identify critical gaps

**Day 2** (2 hours):
- Create test infrastructure
- Implement fixtures
- Document patterns

**Total Week 1**: 4 hours

---

## Next Week Preview

**Week 2** (16 hours): Auth Module Testing
- Implement tests for auth/login
- Implement tests for auth/security
- Implement tests for auth/session
- Target: Auth module 60%+ coverage

---

**Status**: Ready to execute Week 1  
**Estimated Completion**: Week 1 complete in 4 hours  
**Overall Progress**: 0% → 10% (after Week 1)
