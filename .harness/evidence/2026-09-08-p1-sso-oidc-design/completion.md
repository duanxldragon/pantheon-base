# P1-2 SSO/OIDC Design - Completion Evidence

**Task ID**: 2026-09-08-p1-sso-oidc-design  
**Status**: ✅ DESIGN PHASE COMPLETED  
**Completed At**: 2026-09-08  
**Effort**: 3 hours (design phase only)

---

## Completion Summary

Successfully completed the **design phase** of SSO/OIDC integration for Pantheon Base. The comprehensive design document defines architecture, security model, user provisioning strategy, and implementation roadmap.

**Note**: This task is **design-first**. Implementation (Phase 2, ~9 hours) is deferred for future execution after design approval.

---

## Deliverables

### 1. Design Document

**File**: `docs/designs/SSO_OIDC_DESIGN.md`

**Content**: 600+ lines covering:
- Architecture overview with flow diagrams
- Component design (Provider, Service, Handler)
- Database schema changes
- Security model (CSRF, replay protection, token validation)
- User provisioning rules with decision tree
- Configuration examples (Auth0, Okta, Azure AD, Keycloak)
- Testing strategy
- Rollout plan (MVP → Enhanced → Advanced)
- Risk assessment and mitigation

### 2. Task Specification

**File**: `.harness/tasks/2026-09-08-p1-sso-oidc-design/task.md`

**Content**: Complete task packet including:
- Goal and scope definition
- Implementation plan (6 phases, 12 hours)
- Database migration SQL
- Code structure and examples
- Security checklist
- Testing requirements
- Success criteria

---

## Design Highlights

### Architecture

**Authentication Flow**: Authorization Code Flow (OAuth 2.0 / OIDC)

```
User → Pantheon → OIDC Provider → Pantheon → Session Created
     (1) Login    (2) Authorize   (4) Callback   (6) Dashboard
                  (3) Auth Code   (5) Tokens
```

**Key Components**:
1. **OIDCProvider**: Wrapper around `coreos/go-oidc` library
2. **OIDCService**: Business logic (provisioning, session creation)
3. **OIDCHandler**: HTTP endpoints (`/oidc/login`, `/oidc/callback`)
4. **State/Nonce Storage**: Redis with 5-minute TTL

### Security Features

**CSRF Protection**:
- Random state parameter (32 bytes)
- Stored in Redis with TTL
- Validated on callback
- Single-use

**Replay Protection**:
- Random nonce parameter (32 bytes)
- Embedded in ID token
- Verified on token validation

**ID Token Validation**:
- ✅ Signature verification (JWK)
- ✅ Issuer validation
- ✅ Audience validation
- ✅ Expiry check
- ✅ Nonce validation

**Auto-Provision Safeguards**:
- Domain whitelist (`PANTHEON_OIDC_ALLOWED_DOMAINS`)
- Email verification check (`email_verified` claim)
- Optional admin approval (status: `pending_approval`)

### User Provisioning Strategy

**Just-In-Time (JIT) Provisioning**:

```
OIDC Login
    │
    ├─> User exists (by oidc_subject)?
    │   ├─> YES: Sync profile → Create session
    │   └─> NO: Auto-provision enabled?
    │       ├─> YES: Check domain → Create user → Assign role → Session
    │       └─> NO: Error "User not found"
```

**Profile Sync** (on every login):
- Email
- Display name
- Last sync timestamp

**NOT synced** (manual management):
- Roles
- Permissions
- Department
- Status

### Database Schema

**New Fields**:
```sql
ALTER TABLE users 
ADD COLUMN oidc_subject VARCHAR(255) UNIQUE,
ADD COLUMN oidc_provider VARCHAR(100),
ADD COLUMN oidc_last_sync DATETIME,
ADD COLUMN auth_type VARCHAR(20) DEFAULT 'local';
```

**Indexes**:
- `idx_users_oidc_subject` (for lookup by OIDC sub)
- `idx_users_auth_type` (for filtering)

### Configuration

**Environment Variables**:
```bash
PANTHEON_OIDC_ENABLED=true
PANTHEON_OIDC_PROVIDER_URL=https://accounts.example.com
PANTHEON_OIDC_CLIENT_ID=pantheon-client-id
PANTHEON_OIDC_CLIENT_SECRET=super-secret
PANTHEON_OIDC_REDIRECT_URL=https://pantheon.example.com/api/v1/auth/oidc/callback
PANTHEON_OIDC_SCOPES=openid,profile,email
PANTHEON_OIDC_AUTO_PROVISION=true
PANTHEON_OIDC_ALLOWED_DOMAINS=example.com,partner.com
```

**Supported Providers**:
- ✅ Auth0
- ✅ Okta
- ✅ Azure AD (Microsoft Entra ID)
- ✅ Google Workspace
- ✅ Keycloak
- ✅ Any OIDC-compliant provider

---

## Implementation Roadmap

### Phase 1: Design (✅ COMPLETED - 3 hours)
- [x] Architecture design
- [x] Component specification
- [x] Security model
- [x] Configuration structure
- [x] Testing strategy

### Phase 2: Implementation (⏳ PENDING - 9 hours)

**Database Migration** (1 hour):
- Create migration SQL
- Add OIDC fields to User model
- Test migration

**OIDC Module** (4 hours):
- Implement `oidc/provider.go`
- Implement `oidc/service.go`
- Implement `oidc/handler.go`
- Implement `oidc/config.go`

**Integration** (2 hours):
- Register routes in `auth/module.go`
- Add frontend "Login with SSO" button
- Configure environment variables

**Testing** (1 hour):
- Unit tests
- Integration tests
- Manual testing with mock provider

**Documentation** (1 hour):
- Setup guide
- Configuration examples
- Troubleshooting

---

## Design Decisions

### 1. Authorization Code Flow (Not Implicit Flow)

**Chosen**: Authorization Code Flow

**Reason**:
- More secure (tokens not exposed in URL)
- Supports refresh tokens
- Industry best practice
- Required by most enterprise IdPs

### 2. JIT Provisioning (Not Pre-Provisioning)

**Chosen**: Just-In-Time provisioning

**Reason**:
- Simpler initial implementation
- No user sync scheduled job needed
- Users created on first login
- Can add pre-provisioning later

**Safeguard**: Domain whitelist or admin approval

### 3. Single Provider (Not Multi-Provider)

**Chosen**: Single OIDC provider (MVP)

**Reason**:
- Simpler configuration
- Most enterprises have one IdP
- Multi-provider adds complexity
- Can be added in Phase 2

### 4. Manual Role Assignment (Not Claim Mapping)

**Chosen**: Manual role assignment in Pantheon

**Reason**:
- Simpler initial implementation
- No claim transformation logic needed
- Roles/permissions are Pantheon-specific
- Claim mapping can be added later

**Future**: Map IdP groups to Pantheon roles

### 5. Local Logout Only (Not SLO)

**Chosen**: Local session logout only

**Reason**:
- Simpler implementation
- Single Logout (SLO) is complex
- Not all providers support SLO well
- Can be added in Phase 2

### 6. Redis for State Storage (Not Database)

**Chosen**: Redis with TTL

**Reason**:
- Fast lookup
- Automatic expiry (5 minutes)
- No manual cleanup needed
- Scales better than DB

---

## Security Assessment

### Threats Mitigated

| Threat | Mitigation |
|--------|------------|
| **CSRF** | State parameter validated |
| **Replay attacks** | Nonce in ID token verified |
| **Token forgery** | Signature verification (JWK) |
| **Token injection** | Issuer, audience, expiry validated |
| **Auto-provision abuse** | Domain whitelist + email verification |
| **Man-in-the-middle** | HTTPS required for redirect URL |
| **Session hijacking** | Existing session security maintained |

### Residual Risks

| Risk | Severity | Mitigation Plan |
|------|----------|-----------------|
| IdP compromise | High | Monitor IdP security advisories |
| Phishing via fake IdP | Medium | User education |
| Role escalation | Low | Manual role assignment only |
| Provider downtime | Low | Local auth still available |

---

## Configuration Examples

### Auth0 Setup

```bash
# Pantheon Configuration
PANTHEON_OIDC_ENABLED=true
PANTHEON_OIDC_PROVIDER_URL=https://example.auth0.com
PANTHEON_OIDC_CLIENT_ID=your-auth0-client-id
PANTHEON_OIDC_CLIENT_SECRET=your-auth0-client-secret
PANTHEON_OIDC_REDIRECT_URL=https://pantheon.example.com/api/v1/auth/oidc/callback
PANTHEON_OIDC_SCOPES=openid,profile,email
PANTHEON_OIDC_AUTO_PROVISION=true
PANTHEON_OIDC_ALLOWED_DOMAINS=example.com
```

**Auth0 Application Settings**:
- Application Type: Regular Web Application
- Allowed Callback URLs: `https://pantheon.example.com/api/v1/auth/oidc/callback`
- Allowed Logout URLs: `https://pantheon.example.com`
- Grant Types: Authorization Code

### Azure AD Setup

```bash
# Pantheon Configuration
PANTHEON_OIDC_ENABLED=true
PANTHEON_OIDC_PROVIDER_URL=https://login.microsoftonline.com/{tenant-id}/v2.0
PANTHEON_OIDC_CLIENT_ID=your-application-id
PANTHEON_OIDC_CLIENT_SECRET=your-client-secret
PANTHEON_OIDC_REDIRECT_URL=https://pantheon.example.com/api/v1/auth/oidc/callback
PANTHEON_OIDC_SCOPES=openid,profile,email
```

**Azure AD App Registration**:
- Platform: Web
- Redirect URI: `https://pantheon.example.com/api/v1/auth/oidc/callback`
- ID tokens: Enabled

---

## Testing Plan

### Unit Tests (2 hours)

**Provider Tests**:
- [ ] Provider initialization with valid config
- [ ] Provider initialization with invalid config
- [ ] AuthCodeURL generation
- [ ] Token exchange (mocked)
- [ ] ID token verification (mocked JWK)

**Service Tests**:
- [ ] State/nonce generation
- [ ] State validation (valid, invalid, expired)
- [ ] User provisioning (new user)
- [ ] User provisioning (existing user)
- [ ] User provisioning (disallowed domain)
- [ ] Profile sync

**Handler Tests**:
- [ ] Login initiation returns redirect
- [ ] Callback with valid code
- [ ] Callback with invalid state
- [ ] Callback with expired state

### Integration Tests (1 hour)

- [ ] Full flow with mock IdP (httptest)
- [ ] Database integration (user created)
- [ ] Session integration (session created)

### Manual Testing (1 hour)

**With Real IdP** (Auth0 or Okta free tier):
- [ ] New user login (auto-provision)
- [ ] Existing user login (profile sync)
- [ ] Invalid state rejected
- [ ] Disallowed domain rejected
- [ ] Session works correctly
- [ ] Logout works

---

## Dependencies

### Go Packages

**Add to `go.mod`**:
```go
require (
    github.com/coreos/go-oidc/v3 v3.9.0
    golang.org/x/oauth2 v0.15.0
)
```

### External Services

- **Redis**: Required for state/nonce storage
- **OIDC Provider**: Required (Auth0, Okta, Azure AD, etc.)

---

## Future Enhancements (P2/P3)

### P2 - Enhanced Features
- Multiple OIDC provider support
- Group/role mapping from IdP claims
- Custom claim parsing and transformation
- Admin UI for provider configuration
- Provider-specific user listing

### P3 - Advanced Features
- Single Logout (SLO)
- SAML 2.0 support
- Advanced claim transformation rules
- Conditional access policies
- Just-In-Time group sync

---

## Design Approval Checklist

- [x] Architecture documented
- [x] Security model defined
- [x] User provisioning strategy clear
- [x] Configuration structure defined
- [x] Database schema changes specified
- [x] Testing strategy outlined
- [x] Implementation roadmap created
- [x] Risk assessment completed

---

## Success Criteria - Design Phase

- [x] Comprehensive design document (600+ lines)
- [x] Architecture diagrams (text-based)
- [x] Flow diagrams (authentication flow)
- [x] Component specifications (code snippets)
- [x] Security model documented
- [x] Configuration examples (4 providers)
- [x] Testing strategy defined
- [x] Implementation roadmap (6 phases)

---

## Next Steps

### Immediate
1. **Review design document** with team
2. **Approve architecture** and approach
3. **Prioritize implementation** (9 hours remaining)

### Implementation Phase (When Approved)
1. Database migration (1 hour)
2. OIDC module (4 hours)
3. Integration (2 hours)
4. Testing (1 hour)
5. Documentation (1 hour)

### Before Production
1. Test with real OIDC provider
2. Configure domain whitelist
3. Set up monitoring for OIDC failures
4. Document troubleshooting procedures
5. Train support team

---

## Estimated Timeline

**Design Phase**: ✅ 3 hours (completed)  
**Implementation Phase**: ⏳ 9 hours (pending approval)  
**Total**: 12 hours

**Implementation can be split**:
- Session 1: Database + Module (5 hours)
- Session 2: Integration + Testing (4 hours)

---

## Related Tasks

- **Blocks**: P2-3 Login Risk Control (device fingerprinting with SSO)
- **Related**: P1-1 Test Coverage (need tests for OIDC module)
- **Enables**: Enterprise identity source integration

---

**Completion Status**: ✅ Design phase complete  
**Documentation**: ✅ 600+ line design document  
**Implementation**: ⏳ Pending approval (9 hours estimated)  
**Production Ready**: Design approved, implementation needed
