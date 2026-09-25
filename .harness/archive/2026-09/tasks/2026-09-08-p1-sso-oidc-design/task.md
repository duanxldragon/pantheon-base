# Task Packet: P1-2 SSO/OIDC Design & Implementation

## Goal

Design and implement Single Sign-On (SSO) and OpenID Connect (OIDC) integration to enable enterprise identity source integration.

## Priority

**P1 - High** (Enterprise identity integration)

## Source

Cross-Review Report: Enterprise authentication requirement
TASK_MASTER_PLAN.md: P1-2 task specification

## Dependencies

- **Blocked by**: None (can start immediately)
- **Enables**: Enterprise AD/LDAP integration, P2-3 Login Risk Control

## Current State

**Finding**: No SSO/OIDC code exists in `backend/modules/auth/`.

```bash
$ find backend/modules/auth -name "*.go" | grep -E "(sso|oidc|oauth)"
# No results
```

**Current auth structure**:
```
backend/modules/auth/
├── login/          # Username/password authentication
├── mfa/            # Multi-factor authentication
├── security/       # Security events, password policies
├── session/        # Session management
└── module.go       # Module initialization
```

## Scope

### In

**Phase 1: Design & Architecture** (6 hours)
- OIDC/OAuth2 flow design
- Provider configuration structure
- User provisioning strategy
- Session integration design
- Security considerations documentation

**Phase 2: Implementation** (6 hours)
- OIDC provider integration (using `coreos/go-oidc`)
- OAuth2 authorization code flow
- Token exchange and validation
- User auto-provisioning
- Session creation from OIDC tokens
- API endpoints for SSO login

### Out

- SAML 2.0 support (OIDC only for now)
- Multiple provider support (single provider MVP)
- Group/role mapping from IdP (manual role assignment)
- Custom claim parsing (standard claims only)
- Admin UI for provider configuration (env var config)

## Assumptions

- **Identity Provider**: Generic OIDC-compliant IdP (Auth0, Okta, Azure AD, Keycloak, etc.)
- **Flow**: Authorization Code Flow (most secure for web apps)
- **User Provisioning**: Just-In-Time (JIT) provisioning on first login
- **Session**: After OIDC auth, create normal Pantheon session
- **Logout**: Local logout only (no Single Logout / SLO)

## Design

### Architecture Overview

```
┌─────────┐                 ┌──────────┐                 ┌─────────┐
│ Browser │────(1)──────────>│ Pantheon │────(2)──────────>│  OIDC   │
│         │<───(3)───────────│  Backend │<───(4)───────────│Provider │
│         │                  │          │                  │         │
│         │────(5)──────────>│          │                  │         │
│         │<───(6)───────────│          │                  │         │
└─────────┘                 └──────────┘                 └─────────┘

Flow:
1. User clicks "Login with SSO"
2. Backend redirects to OIDC provider authorize endpoint
3. Provider returns auth code
4. Backend exchanges code for tokens
5. User profile fetched from UserInfo endpoint
6. Session created, user provisioned if new
```

### OIDC Configuration

**Environment Variables**:
```bash
# OIDC Provider
PANTHEON_OIDC_ENABLED=true
PANTHEON_OIDC_PROVIDER_URL=https://accounts.example.com
PANTHEON_OIDC_CLIENT_ID=pantheon-client-id
PANTHEON_OIDC_CLIENT_SECRET=pantheon-client-secret
PANTHEON_OIDC_REDIRECT_URL=https://pantheon.example.com/api/v1/auth/oidc/callback

# Optional
PANTHEON_OIDC_SCOPES=openid,profile,email
PANTHEON_OIDC_AUTO_PROVISION=true
```

### User Provisioning Strategy

**JIT Provisioning**:
1. User authenticates via OIDC
2. Backend receives OIDC claims (sub, email, name, etc.)
3. Check if user exists by OIDC sub or email
4. If new: Create user account (inactive by default)
5. If exists: Update profile from claims
6. Create Pantheon session
7. Return session cookies

**User Model Extension**:
```go
type User struct {
    // ... existing fields
    OIDCSubject    *string `gorm:"uniqueIndex;column:oidc_subject" json:"oidc_subject,omitempty"`
    OIDCProvider   *string `gorm:"column:oidc_provider" json:"oidc_provider,omitempty"`
    OIDCLastSync   *time.Time `gorm:"column:oidc_last_sync" json:"oidc_last_sync,omitempty"`
    AuthType       string  `gorm:"default:'local'" json:"auth_type"` // 'local' or 'oidc'
}
```

### API Endpoints

**New Routes** (`/api/v1/auth/oidc/`):
```go
GET  /auth/oidc/login      // Initiate OIDC login (redirect to provider)
GET  /auth/oidc/callback   // OIDC callback handler
POST /auth/oidc/logout     // Logout (local session only)
GET  /auth/oidc/config     // OIDC configuration info (for frontend)
```

### Security Considerations

1. **State Parameter**: CSRF protection via random state token
2. **Nonce**: Replay attack prevention
3. **PKCE**: Optional for public clients (not needed for confidential)
4. **Token Validation**: 
   - Signature verification (JWK)
   - Issuer validation
   - Audience validation
   - Expiry check
5. **Session Security**: Same as existing session mechanism
6. **Auto-Provision Safeguard**: Require admin approval or specific domain whitelist

## Implementation Plan

### Phase 1: Design Documents (2 hours)

**File**: `docs/designs/SSO_OIDC_DESIGN.md`

Contents:
- Architecture overview
- Flow diagrams
- Security model
- Configuration guide
- User provisioning rules
- Testing strategy

### Phase 2: Database Migration (1 hour)

**File**: `backend/pkg/database/migrations/YYYYMMDDHHMMSS_add_oidc_fields.sql`

```sql
ALTER TABLE users 
ADD COLUMN oidc_subject VARCHAR(255) UNIQUE,
ADD COLUMN oidc_provider VARCHAR(100),
ADD COLUMN oidc_last_sync DATETIME,
ADD COLUMN auth_type VARCHAR(20) DEFAULT 'local';

CREATE INDEX idx_users_oidc_subject ON users(oidc_subject);
```

### Phase 3: OIDC Module Implementation (4 hours)

**Directory Structure**:
```
backend/modules/auth/oidc/
├── config.go          # OIDC configuration
├── provider.go        # OIDC provider wrapper
├── handler.go         # HTTP handlers
├── service.go         # Business logic
├── models.go          # Request/response DTOs
└── provider_test.go   # Unit tests
```

**Key Components**:

**1. Config** (`config.go`):
```go
type OIDCConfig struct {
    Enabled      bool
    ProviderURL  string
    ClientID     string
    ClientSecret string
    RedirectURL  string
    Scopes       []string
    AutoProvision bool
}

func LoadOIDCConfig() (*OIDCConfig, error)
```

**2. Provider** (`provider.go`):
```go
type OIDCProvider struct {
    verifier *oidc.IDTokenVerifier
    config   oauth2.Config
    provider *oidc.Provider
}

func NewOIDCProvider(cfg *OIDCConfig) (*OIDCProvider, error)
func (p *OIDCProvider) AuthCodeURL(state, nonce string) string
func (p *OIDCProvider) Exchange(ctx context.Context, code string) (*oauth2.Token, error)
func (p *OIDCProvider) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error)
func (p *OIDCProvider) UserInfo(ctx context.Context, token *oauth2.Token) (*OIDCUserInfo, error)
```

**3. Service** (`service.go`):
```go
type OIDCService struct {
    db       *gorm.DB
    provider *OIDCProvider
    userRepo *user.Repository
}

func (s *OIDCService) InitiateLogin(c *gin.Context) (authURL string, state string, nonce string)
func (s *OIDCService) HandleCallback(code, state, nonce string) (*models.User, error)
func (s *OIDCService) ProvisionUser(claims *OIDCUserInfo) (*models.User, error)
func (s *OIDCService) SyncUser(user *models.User, claims *OIDCUserInfo) error
```

**4. Handler** (`handler.go`):
```go
func InitiateOIDCLogin(c *gin.Context)
func HandleOIDCCallback(c *gin.Context)
func GetOIDCConfig(c *gin.Context)
```

### Phase 4: Integration (2 hours)

**Update** `backend/modules/auth/module.go`:
```go
func InitAuthModule(api *gin.RouterGroup, db *gorm.DB) {
    // ... existing routes
    
    // OIDC routes
    if oidcEnabled() {
        oidcGroup := api.Group("/oidc")
        oidc.RegisterOIDCRoutes(oidcGroup, db)
    }
}
```

**Update frontend** `src/modules/system/auth/Login.tsx`:
```tsx
// Add "Login with SSO" button
{oidcEnabled && (
  <Button onClick={handleSSOLogin}>
    Login with SSO
  </Button>
)}
```

### Phase 5: Testing (1 hour)

**Unit Tests**:
- OIDC provider initialization
- Token validation
- User provisioning logic
- State/nonce validation

**Integration Tests**:
- Mock OIDC provider (using httptest)
- Full login flow test
- Callback handling

**Manual Testing Checklist**:
- [ ] Login with OIDC (new user)
- [ ] Login with OIDC (existing user)
- [ ] Profile sync on subsequent logins
- [ ] Invalid state parameter rejected
- [ ] Expired token rejected
- [ ] Session created correctly

### Phase 6: Documentation (2 hours)

**Files**:
1. `docs/designs/SSO_OIDC_DESIGN.md` - Architecture and design
2. `docs/OIDC_SETUP_GUIDE.md` - Admin setup instructions
3. `CHANGELOG.md` - Release notes

**Documentation includes**:
- OIDC configuration guide
- Provider setup (Auth0, Okta, Azure AD examples)
- User provisioning behavior
- Security best practices
- Troubleshooting

## Dependencies

**Go Packages** (add to `go.mod`):
```go
require (
    github.com/coreos/go-oidc/v3 v3.9.0
    golang.org/x/oauth2 v0.15.0
)
```

## Success Criteria

### Phase 1: Design
- [ ] Architecture diagram created
- [ ] Flow documented
- [ ] Security model defined
- [ ] Configuration structure defined

### Phase 2: Implementation
- [ ] OIDC module implemented
- [ ] Database schema updated
- [ ] API endpoints created
- [ ] User provisioning working

### Phase 3: Integration
- [ ] Module registered in auth
- [ ] Frontend login button added
- [ ] Configuration loaded from env

### Phase 4: Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing complete

### Phase 5: Documentation
- [ ] Design document complete
- [ ] Setup guide written
- [ ] CHANGELOG updated

## Security Checklist

- [ ] State parameter for CSRF protection
- [ ] Nonce for replay protection
- [ ] ID token signature verification
- [ ] Issuer validation
- [ ] Audience validation
- [ ] Token expiry validation
- [ ] HTTPS required for redirect URL
- [ ] Client secret stored securely (not in code)
- [ ] Auto-provision requires approval or domain whitelist
- [ ] Session security maintained

## Rollout Plan

### MVP (P1)
- Single OIDC provider
- JIT user provisioning
- Basic profile sync
- Manual role assignment

### Future Enhancements (P2)
- Multiple provider support
- Group/role mapping from IdP
- Custom claim parsing
- Admin UI for provider config
- Single Logout (SLO)
- SAML 2.0 support

## Estimated Effort

- Design & architecture: 2 hours
- Database migration: 1 hour
- OIDC module implementation: 4 hours
- Integration: 2 hours
- Testing: 1 hour
- Documentation: 2 hours
- **Total: 12 hours**

## Evidence Required

- Design document (SSO_OIDC_DESIGN.md)
- Implementation code (auth/oidc/ directory)
- Database migration
- Unit tests passing
- Setup guide (OIDC_SETUP_GUIDE.md)
- Manual testing screenshots

## Completion Checklist

- [ ] Design document written
- [ ] Database schema updated
- [ ] OIDC provider wrapper implemented
- [ ] Service layer implemented
- [ ] API handlers implemented
- [ ] Routes registered
- [ ] Frontend integration
- [ ] Unit tests written and passing
- [ ] Integration tests written
- [ ] Manual testing complete
- [ ] Setup guide written
- [ ] CHANGELOG updated
- [ ] Configuration validated

## Linkage

- **Task ID**: 2026-09-08-p1-sso-oidc-design
- **Depends on**: None
- **Blocks**: P2-3 Login Risk Control (device fingerprinting with SSO)
- **Related**: P0-3 (Security baseline), P1-1 (Test coverage for SSO)
- **Evidence Directory**: `.harness/evidence/2026-09-08-p1-sso-oidc-design/`
- **Priority**: P1 (High - Enterprise requirement)

## Notes

This is a **design-first task**. Implementation should follow the design document approval.

**Design phase** (2-3 hours) should be completed first, reviewed, and approved before starting implementation.

**Implementation phase** (9-10 hours) can be split into multiple sessions if needed.
