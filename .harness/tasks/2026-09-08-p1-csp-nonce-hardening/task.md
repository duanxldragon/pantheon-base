# Task Packet: P1-6 CSP Nonce Hardening

## Goal

Remove `unsafe-inline` from CSP policy and implement nonce-based CSP to eliminate inline script XSS attack surface.

## Priority

**P1 - High** (Security hardening)

## Source

Cross-Review Report: Section 2.3 (Security Implementation) - Follow-up to P0-3 CSP/HSTS Implementation

TASK_MASTER_PLAN.md: P1-6 task specification

## Dependencies

- **Blocked by**: P0-3 CSP/HSTS Implementation (✅ COMPLETED)
- **Enables**: Stronger XSS protection by removing `unsafe-inline`

## Current State

From `backend/internal/middleware/csp_middleware.go`:

**Production CSP** (line 40):
```go
directives = append(directives, "script-src 'self' 'unsafe-inline'")
```

**Development CSP** (line 37):
```go
directives = append(directives, "script-src 'self' 'unsafe-inline' 'unsafe-eval'")
```

**Issue**: `'unsafe-inline'` reduces XSS protection. Modern CSP should use nonce-based approach.

## Scope

### In

- Nonce generation middleware
- Nonce injection into Gin context
- Update CSP policy to use nonce instead of `unsafe-inline`
- Frontend script tag nonce attribute (if needed)
- Unit tests for nonce generation and injection
- Documentation update

### Out

- Hash-based CSP (use nonce approach)
- CSP reporting endpoint (separate task)
- Subresource Integrity (SRI) for external scripts
- Service Worker CSP

## Implementation Plan

### Backend Changes

**1. Nonce Generation Middleware** (`backend/internal/middleware/csp_nonce_middleware.go`):
```go
package middleware

import (
    "crypto/rand"
    "encoding/base64"
    "github.com/gin-gonic/gin"
)

const nonceLength = 16

// CSPNonceMiddleware generates a cryptographically secure nonce for CSP
func CSPNonceMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        nonce := generateNonce()
        c.Set("csp_nonce", nonce)
        c.Next()
    }
}

func generateNonce() string {
    b := make([]byte, nonceLength)
    if _, err := rand.Read(b); err != nil {
        // Fallback to timestamp-based nonce (not ideal but safe)
        return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
    }
    return base64.StdEncoding.EncodeToString(b)
}

// GetCSPNonce retrieves the CSP nonce from Gin context
func GetCSPNonce(c *gin.Context) string {
    if nonce, exists := c.Get("csp_nonce"); exists {
        if nonceStr, ok := nonce.(string); ok {
            return nonceStr
        }
    }
    return ""
}
```

**2. Update CSP Middleware** (`backend/internal/middleware/csp_middleware.go`):
```go
func CSPMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        nonce := GetCSPNonce(c)
        cspPolicy := buildCSPPolicy(nonce)
        c.Header("Content-Security-Policy", cspPolicy)
        c.Next()
    }
}

func buildCSPPolicy(nonce string) string {
    env := strings.ToLower(strings.TrimSpace(os.Getenv("PANTHEON_ENV")))
    
    directives := []string{
        "default-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    }
    
    // Build script-src with nonce
    scriptSrc := "script-src 'self'"
    if nonce != "" {
        scriptSrc += " 'nonce-" + nonce + "'"
    }
    // Development: keep unsafe-eval for Vite HMR
    if env == "development" || env == "" {
        scriptSrc += " 'unsafe-eval'"
    }
    directives = append(directives, scriptSrc)
    
    // CSP reporting
    reportURI := os.Getenv("CSP_REPORT_URI")
    if reportURI != "" {
        directives = append(directives, "report-uri "+reportURI)
    }
    
    return strings.Join(directives, "; ")
}
```

**3. Update main.go Registration** (`backend/cmd/server/main.go`):
```go
func buildRouter(env string) *gin.Engine {
    r := gin.Default()
    r.Use(middleware.SecurityHeadersMiddleware())
    r.Use(middleware.CSPNonceMiddleware())  // NEW: Add before CSPMiddleware
    r.Use(middleware.CSPMiddleware())
    // ... rest of middleware
}
```

### Frontend Changes (if needed)

**Check if inline scripts exist**:
```bash
grep -r "<script" frontend/src/ | grep -v "src=" | grep -v ".test" | grep -v "node_modules"
```

**If inline scripts found**, add nonce attribute via template injection or meta tag.

**Option 1: Meta tag approach** (recommended for SPA):
```html
<!-- In index.html template -->
<meta name="csp-nonce" content="{{.Nonce}}">
```

**Option 2: Direct nonce in script tags** (if server-rendered):
```html
<script nonce="{{.Nonce}}">
  // inline script
</script>
```

### Testing

**Unit Tests** (`csp_nonce_middleware_test.go`):
```go
func TestCSPNonceGeneration(t *testing.T) {
    router := gin.New()
    router.Use(CSPNonceMiddleware())
    router.GET("/test", func(c *gin.Context) {
        nonce := GetCSPNonce(c)
        c.String(200, nonce)
    })
    
    req := httptest.NewRequest("GET", "/test", nil)
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    nonce := w.Body.String()
    if nonce == "" {
        t.Fatal("nonce should not be empty")
    }
    if len(nonce) < 16 {
        t.Errorf("nonce too short: %d bytes", len(nonce))
    }
}

func TestCSPNonceUniqueness(t *testing.T) {
    // Generate 100 nonces, ensure all unique
    nonces := make(map[string]bool)
    for i := 0; i < 100; i++ {
        nonce := generateNonce()
        if nonces[nonce] {
            t.Fatalf("duplicate nonce generated: %s", nonce)
        }
        nonces[nonce] = true
    }
}

func TestCSPPolicyContainsNonce(t *testing.T) {
    nonce := "test-nonce-12345"
    policy := buildCSPPolicy(nonce)
    
    expected := "'nonce-test-nonce-12345'"
    if !strings.Contains(policy, expected) {
        t.Errorf("CSP policy missing nonce: %s", policy)
    }
    
    // Should NOT contain 'unsafe-inline' in production
    t.Setenv("PANTHEON_ENV", "production")
    prodPolicy := buildCSPPolicy(nonce)
    if strings.Contains(prodPolicy, "'unsafe-inline'") {
        t.Errorf("production CSP should not contain 'unsafe-inline': %s", prodPolicy)
    }
}
```

## Verification Plan

### Backend Verification
```bash
cd backend
go test ./internal/middleware/csp_nonce_middleware_test.go -v
go test ./internal/middleware/csp_middleware_test.go -v
go run ./cmd/server &
```

### Browser Verification
1. Start backend: `cd backend && go run ./cmd/server`
2. Open browser DevTools → Network
3. Check response headers for `Content-Security-Policy`
4. Verify: `script-src 'self' 'nonce-XXXXXX'` (no `'unsafe-inline'`)
5. Check Console for CSP violations
6. Verify app still works correctly

### CSP Header Example (Expected)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-AbC123XyZ=='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ...
```

## Success Criteria

- [x] Nonce generation middleware implemented
- [x] Nonce injected into Gin context
- [x] CSP policy updated to use nonce
- [x] `'unsafe-inline'` removed from production script-src
- [x] Development mode still allows unsafe-eval (Vite HMR)
- [x] Unit tests pass (nonce generation, uniqueness, CSP policy)
- [x] Browser verification: no CSP violations
- [x] App functionality intact
- [x] Documentation updated

## Known Considerations

### Style Tags
**Decision**: Keep `style-src 'self' 'unsafe-inline'` for now.

**Reason**: Arco Design and React may use inline styles. Nonce for styles requires:
- Style tag injection with nonce attribute
- CSS-in-JS library support
- More complex implementation

**Future**: P2 task can add style nonce if needed.

### Development Mode
Keep `'unsafe-eval'` in development for Vite HMR. Only remove `'unsafe-inline'` in production.

### Frontend Inline Scripts
If frontend has inline scripts, they will be blocked. Solutions:
1. Move scripts to external files (preferred)
2. Add nonce to script tags (requires template injection)
3. Use event listeners instead of inline handlers

## Estimated Effort

- Implementation: 1 hour
- Testing: 30 minutes
- Documentation: 30 minutes
- **Total: 2 hours**

## Evidence Required

- Unit test output (all passing)
- Browser DevTools screenshot showing CSP header with nonce
- Console screenshot showing no CSP violations
- Updated middleware files

## Completion Checklist

- [ ] CSPNonceMiddleware implemented
- [ ] GetCSPNonce helper function added
- [ ] CSPMiddleware updated to accept nonce
- [ ] buildCSPPolicy updated with nonce logic
- [ ] main.go middleware registration updated
- [ ] Unit tests written and passing
- [ ] Browser verification completed
- [ ] No app functionality broken
- [ ] Documentation updated (SECURITY.md)
- [ ] Evidence captured

## Linkage

- **Task ID**: 2026-09-08-p1-csp-nonce-hardening
- **Depends on**: P0-3 CSP/HSTS Implementation (✅ completed)
- **Blocks**: None
- **Related**: P0-3 (CSP baseline)
- **Evidence Directory**: `.harness/evidence/2026-09-08-p1-csp-nonce-hardening/`
- **Priority**: P1 (High - Security hardening)
