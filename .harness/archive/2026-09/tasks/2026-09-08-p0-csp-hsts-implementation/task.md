# Task Packet: P0 CSP/HSTS Implementation

## Goal

Implement Content-Security-Policy and Strict-Transport-Security headers to eliminate XSS, clickjacking, and man-in-the-middle attack surfaces.

## Priority

**P0 - Critical** (Security vulnerability)

## Source

Cross-Review Report: Section 2.3 (Security Implementation) - "CSP/HSTS未实现，存在XSS、点击劫持、中间人攻击面"

SECURITY.md explicitly acknowledges: "Content-Security-Policy与Strict-Transport-Security仍属后续收口项"

## Primary Layer

backend/middleware

## Dependency Layers

- gin-middleware
- security-headers
- frontend-assets

## Harness Profile

- Template: security-hardening
- Coverage Dimensions:
  - security
  - xss-protection
  - transport-security
- Quality Profile: security-critical
- Portable Failure Class: security-vulnerability
- Owner Layer: backend/internal/middleware
- Ratchet Decision: security-baseline
- Delivery Governance: P0 blocker for production deployment
- GitHub Signal: required before any external deployment

## Scope

### In

- CSP header middleware implementation
- HSTS header middleware configuration
- CSP policy definition (strict but compatible with Arco Design)
- Nonce generation for inline scripts (if needed)
- HSTS max-age and preload configuration
- Middleware unit tests
- Task packet, evidence, and security validation

### Out

- CSP violation reporting endpoint (P1 follow-up)
- Subresource Integrity (SRI) for CDN assets
- Certificate pinning
- HPKP (deprecated, not recommended)

## Assumptions and Open Questions

- Backend uses Gin framework: `github.com/gin-gonic/gin`
- Frontend served from same origin (no complex CSP cross-origin needs)
- Arco Design components may use inline styles (need CSP `style-src 'unsafe-inline'` or nonce)
- HTTPS required in production (HSTS only effective over HTTPS)
- No existing CSP/HSTS headers conflict

**Open Questions**:
1. Does frontend use inline scripts? → Need CSP nonce strategy
2. Are there external script/style CDNs? → Need CSP allowlist
3. Is HTTPS enforced in production? → HSTS prerequisite

## Minimum Viable Approach

1. Add security headers middleware to Gin router
2. Implement CSP with permissive-but-safe defaults
3. Implement HSTS with 1-year max-age
4. Test with browser dev tools (no CSP violations in console)
5. Add unit tests for header presence
6. Update SECURITY.md to remove "后续收口项" note

## Success Criteria

- CSP header present in all HTTP responses
- HSTS header present in all HTTPS responses
- No CSP violations in browser console for standard user flows
- Login page, dashboard, system management pages work correctly
- Unit tests validate header presence and values
- SECURITY.md updated to reflect implementation
- Browser security audit (e.g., securityheaders.com) shows A+ rating

## Contract Anchors

- Cross-Review Report Section 2.3 (Security Implementation)
- `SECURITY.md` (section on security headers)
- `backend/cmd/server/main.go` (middleware registration)
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`

## Expected Files

### Create

- backend/internal/middleware/security_headers.go
- backend/internal/middleware/security_headers_test.go
- .harness/tasks/2026-09-08-p0-csp-hsts-implementation/task.md
- .harness/tasks/2026-09-08-p0-csp-hsts-implementation/manifest.json
- .harness/evidence/2026-09-08-p0-csp-hsts-implementation/security-headers-test.md
- .harness/evidence/2026-09-08-p0-csp-hsts-implementation/browser-validation.png

### Modify

- backend/cmd/server/main.go (register middleware)
- SECURITY.md (remove "后续收口项" note)
- docs/designs/QUALITY_AND_SECURITY_STRATEGY.md (update security baseline)

### Do Not Touch

- Frontend source code (unless CSP violations require fixes)
- Existing authentication/authorization middleware
- Database layer

## Structural Scope

- Affected Subgraph: HTTP Response → Security Headers → Browser Security Model
- Boundary Crossings: Backend Middleware → HTTP Response → Browser
- Risk Nodes: Overly strict CSP may break frontend functionality
- Graph Focus: Response headers only, no request processing changes

## Implementation Notes

**Recommended CSP Policy** (start permissive, tighten over time):
```go
csp := "default-src 'self'; " +
       "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +  // Arco may need unsafe-inline
       "style-src 'self' 'unsafe-inline'; " +                  // Arco uses inline styles
       "img-src 'self' data: https:; " +                        // Allow data URIs and HTTPS images
       "font-src 'self' data:; " +                              // Web fonts
       "connect-src 'self'; " +                                 // API calls
       "frame-ancestors 'none'; " +                             // Clickjacking protection
       "base-uri 'self'; " +
       "form-action 'self'"
```

**Recommended HSTS Policy**:
```go
hsts := "max-age=31536000; includeSubDomains"  // 1 year, include subdomains
// Add "preload" after testing: "max-age=31536000; includeSubDomains; preload"
```

**Middleware Implementation** (`backend/internal/middleware/security_headers.go`):
```go
package middleware

import (
	"github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Content-Security-Policy
		c.Header("Content-Security-Policy", 
			"default-src 'self'; "+
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; "+
			"style-src 'self' 'unsafe-inline'; "+
			"img-src 'self' data: https:; "+
			"font-src 'self' data:; "+
			"connect-src 'self'; "+
			"frame-ancestors 'none'; "+
			"base-uri 'self'; "+
			"form-action 'self'")
		
		// Strict-Transport-Security (only if HTTPS)
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		
		// Additional security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		c.Next()
	}
}
```

**Registration** (`backend/cmd/server/main.go`):
```go
import "your-module/backend/internal/middleware"

// After CORS middleware, before routes
r.Use(middleware.SecurityHeaders())
```

## Verification Plan

### Backend Tests
```bash
cd backend
go test ./internal/middleware/security_headers_test.go -v
go test ./... # Ensure no regressions
```

### Manual Browser Testing
1. Start backend: `go run ./cmd/server`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser DevTools → Console
4. Navigate through:
   - Login page
   - Dashboard
   - System user management
   - Role management
   - Any page with tables/forms
5. Check for CSP violations in console
6. Verify headers in Network tab:
   - `Content-Security-Policy` present
   - `Strict-Transport-Security` present (if HTTPS)
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`

### Security Header Audit
- Visit https://securityheaders.com (if public URL available)
- Or use browser extension: "Security Headers" by Mateusz Kocielski

## Evidence Required

- Unit test output showing headers present
- Browser DevTools screenshot showing:
  - No CSP violations in Console
  - Security headers in Network → Response Headers
- securityheaders.com rating (or equivalent audit)
- Updated SECURITY.md diff

## Human Gates

- Backend test: `go test ./...` passes
- Frontend smoke test: all standard flows work without CSP errors
- Security team review of CSP policy
- SECURITY.md update approved

## Completion Checklist

- [ ] Middleware implemented
- [ ] Unit tests written and passing
- [ ] Middleware registered in main.go
- [ ] Backend tests pass
- [ ] Frontend tested for CSP violations
- [ ] All standard user flows work
- [ ] SECURITY.md updated
- [ ] QUALITY_AND_SECURITY_STRATEGY.md updated
- [ ] Evidence captured
- [ ] Security headers validated in browser

## Known Risks

- **Risk**: CSP `'unsafe-inline'` reduces protection level
  - **Mitigation**: This is Phase 1. P1 task will implement nonce-based CSP
  - **Acceptable**: Better than no CSP; incremental hardening approach

- **Risk**: Arco Design may have CSP violations
  - **Mitigation**: Test thoroughly; adjust policy if needed
  - **Fallback**: Use CSP report-only mode initially if too many violations

## Estimated Effort

- Implementation: 1 hour
- Testing: 1 hour
- Documentation: 30 minutes
- **Total: 2.5 hours**

## Linkage

- Task ID: 2026-09-08-p0-csp-hsts-implementation
- Parent Report: PANTHEON_BASE_CROSS_REVIEW_REPORT.md (Section 2.3)
- Related Tasks:
  - 2026-09-08-p0-license-declaration (parallel P0)
  - 2026-09-08-p0-security-gates-enforcement (parallel P0)
  - 2026-09-08-p1-csp-nonce-hardening (follow-up P1)
- Evidence Directory: `.harness/evidence/2026-09-08-p0-csp-hsts-implementation/`
- Priority: P0 (Critical)
- Blocking: Production deployment, security compliance
