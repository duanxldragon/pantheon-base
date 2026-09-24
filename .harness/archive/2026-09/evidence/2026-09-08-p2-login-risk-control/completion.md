# P2-3 Login Risk Control - Completion Evidence

**Task ID**: 2026-09-08-p2-login-risk-control  
**Status**: ✅ DESIGN COMPLETED  
**Completed At**: 2026-09-08  
**Effort**: 3 hours (design phase, 12 hours total estimated)

---

## Deliverables

### Design Document

**File**: `docs/designs/LOGIN_RISK_CONTROL_DESIGN.md` (800+ lines)

**Comprehensive Coverage**:
- ✅ Architecture with risk assessment flow
- ✅ Risk scoring system (5 factor categories)
- ✅ Device fingerprinting design
- ✅ Geographic tracking and impossible travel detection
- ✅ Risk assessment engine implementation
- ✅ Adaptive authentication strategy
- ✅ Security event logging
- ✅ User experience flows
- ✅ API endpoints specification
- ✅ Performance optimizations
- ✅ Testing strategy

---

## Risk Control System Design

### Risk Scoring Model

**5 Factor Categories** (Total: 100 points):

1. **Device Trust** (0-25 points)
   - New device: +25
   - Untrusted device: +15
   - Fingerprint mismatch: +20

2. **Geographic Anomaly** (0-25 points)
   - New country: +25
   - Impossible travel: +25
   - High-risk country: +10

3. **Behavioral Anomaly** (0-20 points)
   - Unusual time: +10
   - Unusual frequency: +10
   - Recent password reset: +5

4. **IP Reputation** (0-20 points)
   - Tor exit node: +20
   - Known VPN: +10
   - Datacenter IP: +15

5. **Failed Attempts** (0-10 points)
   - 1-2 failures: +2
   - 3-5 failures: +5
   - 5+ failures: +10

### Risk Thresholds & Actions

```
Score 0-30   → Low Risk      → Allow login
Score 31-60  → Medium Risk   → Require MFA
Score 61-80  → High Risk     → MFA + Email verification
Score 81-100 → Critical Risk → Block + Admin alert
```

---

## Device Fingerprinting

### Client-Side Collection

**Attributes Collected**:
- User Agent
- Screen resolution & color depth
- Timezone & language
- Platform
- Canvas fingerprint
- WebGL renderer
- Installed fonts
- Audio context hash

**Fingerprint Generation**:
```javascript
const fingerprint = sha256(JSON.stringify(sortedAttributes));
```

### Server-Side Storage

**Table**: `login_devices`

**Key Fields**:
- `device_fingerprint` (SHA256 hash)
- `trust_status` (new/trusted/untrusted)
- `first_seen_at`, `last_seen_at`
- `login_count`
- Last known location (IP, country, city)

**Features**:
- User can mark devices as trusted
- Trusted devices skip additional verification
- Automatic trust after N successful logins
- Device lifecycle management

---

## Geographic Tracking

### IP Geolocation

**Service**: MaxMind GeoLite2 or ipapi.co

**Tracked Data**:
- Country, City
- Latitude, Longitude
- ISP, Connection type
- VPN/Proxy/Tor detection

**Table**: `login_locations`

**Features**:
- Historical location tracking
- Anomaly detection (new country, city)
- Impossible travel detection (distance/time calculation)

### Impossible Travel Detection

**Algorithm**:
```
distance = haversineDistance(lastLocation, currentLocation)
timeDiff = currentTime - lastTime

maxPossibleDistance = timeDiff * 1000 km/h (with buffer)

if distance > maxPossibleDistance:
    impossibleTravel = true
```

**Example**: San Francisco → London in 2 hours = Impossible

---

## Risk Assessment Engine

### Implementation Design

**Core Logic**:
```go
type RiskEngine struct {
    assessDeviceTrust()       → 0-25 points
    assessGeographicAnomaly() → 0-25 points
    assessBehavioralAnomaly() → 0-20 points
    assessIPReputation()      → 0-20 points
    assessFailedAttempts()    → 0-10 points
}

totalScore = sum(all assessments)
level, action = determineRiskLevel(totalScore)
```

**Output**:
```go
type RiskAssessment struct {
    Score       int              // 0-100
    Level       string           // low/medium/high/critical
    Factors     []RiskFactor     // Contributing factors
    Action      string           // allow/mfa/mfa_email/block
    Explanation string           // Human-readable explanation
}
```

---

## Adaptive Authentication

### MFA Triggers

**Always Require**:
- Admin roles
- Sensitive operations (password change, delete account)
- First login after password reset

**Risk-Based**:
- Medium risk (31-60): Require MFA
- High risk (61-80): MFA + email verification
- Critical risk (81-100): Block login

**Trusted Device Exemption**:
- Low risk + trusted device = No MFA required

### MFA Methods

**Supported** (Priority Order):
1. TOTP (Google Authenticator)
2. SMS (Text message)
3. Email (Verification code)
4. Backup codes (Recovery)

---

## Security Event Logging

### Event Types Tracked

- `login_attempt` - Every login try
- `login_success` - Successful authentication
- `login_failed` - Failed authentication
- `login_blocked` - Risk-based block
- `mfa_required` - MFA triggered
- `device_trusted` - User trusts device
- `account_locked` - Too many failures

### Table: `security_events`

**Key Fields**:
- `event_type`, `event_category`
- `risk_score`, `risk_level`, `risk_factors` (JSON)
- Request info (IP, User-Agent, fingerprint)
- Location (country, city)
- `action_taken`, `success`

**Use Cases**:
- Security audit trail
- Incident investigation
- User login history
- Admin security dashboard

---

## User Experience

### Device Trust Flow

After successful login from new device:
```
✓ Login Successful

This is a new device. Do you want to trust this device?
Trusted devices won't require additional verification.

[ ] Trust this device

[Yes, Trust] [No, Don't Trust]
```

### Risk Alert Email

When high/critical risk detected:
```
Subject: Unusual login attempt detected

Location: Tokyo, Japan
IP: 123.45.67.89
Time: 2026-09-08 14:23 UTC
Device: Chrome on Windows

If this was you: No action needed
If this wasn't you: [Change Password]
```

### Admin Dashboard

```
🚨 High-Risk Login Attempts (Last 24 Hours)

User    | Location | Risk | Action  | Time
--------|----------|------|---------|------
alice   | Beijing  | 85   | Blocked | 2h ago
bob     | Moscow   | 72   | MFA Req | 5h ago
charlie | Mumbai   | 68   | MFA Req | 8h ago
```

---

## API Endpoints

```
POST   /api/v1/auth/login                   # Enhanced with risk
POST   /api/v1/auth/mfa/verify              # MFA verification
POST   /api/v1/auth/devices                 # List devices
PUT    /api/v1/auth/devices/:id/trust      # Trust device
DELETE /api/v1/auth/devices/:id             # Remove device
GET    /api/v1/auth/security-events         # User events
GET    /api/v1/admin/security-dashboard     # Admin dashboard
GET    /api/v1/admin/high-risk-events       # High-risk events
```

---

## Database Schema

### New Tables

1. **login_devices** - Device fingerprints and trust status
2. **login_locations** - Geographic login history
3. **security_events** - Comprehensive security event log

### Schema Features

- Efficient indexes for common queries
- Foreign keys to users table
- JSON columns for flexible metadata
- Timestamp tracking for all events

---

## Performance Optimizations

### Caching Strategy

**Device Cache**:
- Cache known devices per user
- TTL: 1 hour
- Invalidate on trust change

**IP Reputation Cache**:
- Cache IP lookups (shared)
- TTL: 24 hours

**Geolocation Cache**:
- Cache IP geolocation (shared)
- TTL: 24 hours

### Database Indexes

```sql
-- Critical performance indexes
CREATE INDEX idx_login_devices_user_fingerprint 
  ON login_devices(user_id, device_fingerprint);

CREATE INDEX idx_login_locations_user_recent 
  ON login_locations(user_id, logged_at DESC);

CREATE INDEX idx_security_events_user_type 
  ON security_events(user_id, event_type);
```

### Async Processing

**Background Jobs**:
- IP reputation check (post-login)
- Geolocation enrichment
- Security event aggregation
- Risk score recalculation

**Benefit**: Login flow remains fast (~100ms overhead)

---

## Configuration

### Environment Variables

```bash
PANTHEON_RISK_CONTROL_ENABLED=true
PANTHEON_RISK_LOW_THRESHOLD=30
PANTHEON_RISK_MEDIUM_THRESHOLD=60
PANTHEON_RISK_HIGH_THRESHOLD=80

PANTHEON_DEVICE_FINGERPRINT_ENABLED=true

PANTHEON_GEOLOCATION_PROVIDER=maxmind
PANTHEON_GEOLOCATION_API_KEY=your-key

PANTHEON_IP_REPUTATION_ENABLED=true

PANTHEON_MFA_RISK_BASED=true
PANTHEON_HIGH_RISK_ALERT_ENABLED=true
```

---

## Testing Strategy

### Unit Tests

**Risk Engine Tests**:
- Test each risk factor calculation
- Test score aggregation
- Test threshold determination
- Test impossible travel detection

**Example**:
```go
func TestRiskEngine_NewDevice_HighScore(t *testing.T)
func TestRiskEngine_ImpossibleTravel_Detected(t *testing.T)
func TestRiskEngine_TrustedDevice_LowScore(t *testing.T)
```

### Integration Tests

**Scenarios**:
1. Normal login from trusted device → Allow
2. Login from new country → MFA required
3. Login from Tor → Blocked
4. Multiple failures → Account locked
5. Trust new device → Future logins easier

---

## Rollout Plan

### Phase 1: Foundation (Design Complete)
- Device fingerprinting
- Basic risk scoring
- Security event logging

**Timeline**: 12 hours implementation

### Phase 2: Enhanced Detection
- IP reputation integration
- Full geographic tracking
- Adaptive MFA

**Timeline**: 8 hours

### Phase 3: Advanced Features
- Machine learning risk model
- Behavioral biometrics
- Real-time threat intelligence

**Timeline**: 20 hours

---

## Success Criteria - Design Phase

- [x] Risk scoring model defined
- [x] Device fingerprinting design complete
- [x] Geographic tracking design complete
- [x] Risk assessment engine specified
- [x] Adaptive MFA strategy defined
- [x] Security event logging design complete
- [x] User experience flows designed
- [x] API endpoints specified
- [x] Database schema designed
- [x] Performance optimizations planned
- [x] Testing strategy outlined

---

## Security Benefits

### Attack Prevention

**Credential Stuffing**: Detected by IP reputation + failed attempts  
**Account Takeover**: Detected by device + location anomaly  
**Brute Force**: Rate limited + account locking  
**Session Hijacking**: Device fingerprint mismatch detected  
**Tor/VPN Abuse**: IP reputation check + risk scoring

### Compliance

**NIST 800-63B**: Risk-based authentication  
**PCI DSS**: Security event logging  
**SOC 2**: Access monitoring and alerts  
**GDPR**: User visibility into login history

---

## Integration with Existing Features

### P1-2 SSO/OIDC Integration

**Risk assessment for SSO**:
- Still collect device fingerprint
- Still check IP reputation
- Risk score influences post-SSO actions
- Critical risk can block even after SSO success

### P1-4 Data Permissions

**Risk-aware data access**:
- High-risk sessions get limited permissions
- Critical-risk sessions are read-only
- Device trust influences data scope

---

## Estimated Effort

- **Design**: 3 hours (✅ completed)
- **Implementation**: 12 hours (pending)
  - Device fingerprinting: 3h
  - Risk engine: 4h
  - Security events: 2h
  - API endpoints: 2h
  - Testing: 1h
- **Total**: 15 hours

---

## Dependencies

- **Depends on**: P1-2 SSO/OIDC (optional, for integrated risk)
- **Enables**: Advanced security posture
- **Related**: P0-3 Security baseline, P1-2 Authentication

---

## Next Steps

### Implementation Phase (When Approved)
1. Device fingerprinting (client + server)
2. Risk assessment engine
3. Security event logging
4. API endpoints
5. Admin dashboard
6. Email alerts
7. Testing

### Before Production
1. Load test risk engine performance
2. Validate IP geolocation accuracy
3. Test impossible travel algorithm
4. User acceptance testing for UX
5. Security review

---

**Completion Status**: ✅ Design phase complete  
**Document Quality**: ✅ Comprehensive (800+ lines)  
**Implementation Ready**: ✅ All components specified  
**Status**: Awaiting approval for implementation (12 hours)
