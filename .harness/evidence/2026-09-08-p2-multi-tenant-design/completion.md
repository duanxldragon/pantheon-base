# P2-2 Multi-Tenant Design - Completion Evidence

**Task ID**: 2026-09-08-p2-multi-tenant-design  
**Status**: ✅ DESIGN COMPLETED  
**Completed At**: 2026-09-08  
**Effort**: 4 hours (design phase, 16 hours total estimated)

---

## Deliverables

### Design Document

**File**: `docs/designs/MULTI_TENANT_DESIGN.md` (1000+ lines)

**Content Coverage**:
- ✅ Architecture overview with 3 deployment models
- ✅ Database schema design (tenant master + tenant_id columns)
- ✅ Tenant identification strategies (subdomain, custom domain, header, JWT)
- ✅ Middleware implementation design
- ✅ Tenant isolation strategies (4 methods)
- ✅ Onboarding flow and initialization
- ✅ Customization system (settings + branding)
- ✅ Performance considerations (caching, indexing)
- ✅ Security validation approach
- ✅ Migration strategy (single → multi-tenant)
- ✅ API endpoints specification
- ✅ Frontend integration design
- ✅ 3-phase rollout plan

---

## Architecture Highlights

### Deployment Models

**Phase 1: Shared Schema (MVP)**
- Single database, single schema
- `tenant_id` column on all tables
- Row-level isolation
- Simplest to implement
- Good for < 1000 tenants

**Phase 2: Separate Schemas**
- Single database, schema per tenant
- Schema-level isolation
- Connection pool per tenant
- Good for 1000-10000 tenants

**Phase 3: Separate Databases**
- Database per tenant
- Physical isolation
- Maximum security
- Good for enterprise/compliance

### Tenant Identification

**Priority Order**:
1. **Custom Domain** - `app.acme.com` → tenant lookup
2. **Subdomain** - `acme.pantheon.io` → tenant: `acme`
3. **Header** - `X-Tenant-ID: acme`
4. **JWT Claim** - `tenant_id` in token

---

## Database Design

### Tenant Master Table

```sql
CREATE TABLE tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    plan_type VARCHAR(50) DEFAULT 'free',
    max_users INT DEFAULT 10,
    expires_at DATETIME NULL,
    logo_url VARCHAR(500),
    primary_color VARCHAR(20),
    custom_domain VARCHAR(255),
    admin_email VARCHAR(255) NOT NULL,
    settings JSON NULL,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME NULL
);
```

### Schema Changes

**All domain tables get**:
- `tenant_id VARCHAR(64)` column
- Foreign key to `tenants(id)`
- Index on `tenant_id`
- Composite unique indexes updated

**Example**:
```sql
ALTER TABLE users 
ADD COLUMN tenant_id VARCHAR(64) NOT NULL,
ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
ADD INDEX idx_users_tenant_id (tenant_id);

-- Update unique constraint
DROP INDEX idx_users_username;
ADD UNIQUE INDEX idx_users_tenant_username (tenant_id, username);
```

---

## Implementation Design

### Tenant Middleware

**Function**: Automatic tenant resolution and context injection

**Flow**:
1. Extract tenant from request (subdomain/domain/header)
2. Load tenant info from DB (with cache)
3. Validate tenant status (active/suspended)
4. Inject `tenant_id` into context
5. Pass to next handler

**Code Structure**:
```go
type TenantMiddleware struct {
    db          *gorm.DB
    tenantCache map[string]*Tenant
}

func (m *TenantMiddleware) Handle() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := m.resolveTenant(c)
        tenant := m.loadTenant(tenantID)
        
        if tenant.Status != "active" {
            c.Abort()
            return
        }
        
        c.Set("tenant_id", tenant.ID)
        c.Next()
    }
}
```

### Repository Pattern

**Automatic tenant filtering**:

```go
func WithTenant(db *gorm.DB, tenantID string) *gorm.DB {
    return db.Where("tenant_id = ?", tenantID)
}

func (r *UserRepository) List(ctx context.Context) ([]*User, error) {
    tenantID := GetTenantID(ctx)
    var users []*User
    err := WithTenant(r.db, tenantID).Find(&users).Error
    return users, err
}
```

---

## Isolation Strategies

### 1. Query-Level (Code-based)

**Approach**: Always include `tenant_id` in WHERE clause

**Pros**: Explicit, full control  
**Cons**: Risk of forgetting filter

### 2. Middleware-Level

**Approach**: Inject tenant_id into context, repositories auto-filter

**Pros**: Centralized, automatic  
**Cons**: Global state considerations

### 3. Database-Level (Views)

**Approach**: Create views with tenant filter

**Pros**: Enforced at DB level  
**Cons**: Performance overhead

### 4. Row-Level Security (RLS)

**Approach**: Database native RLS (PostgreSQL)

**Pros**: Cannot bypass  
**Cons**: MySQL doesn't have native RLS

**Chosen for Phase 1**: Middleware-level (balance of safety and flexibility)

---

## Tenant Onboarding

### Registration Flow

```
1. /register/tenant form
2. Validate input (name, email, plan)
3. Generate tenant ID (tenant-uuid)
4. Create tenant record
5. Create admin user
6. Initialize default data (roles, menus, permissions)
7. Send welcome email
8. Redirect to {slug}.pantheon.io
```

### Data Initialization

**Default Resources**:
- Admin role + User role
- System permissions
- Default menus
- System dictionaries
- Configuration defaults

---

## Customization System

### Tenant Settings

**Supported Settings**:
- Session timeout
- Password policy
- Allowed domains (for SSO)
- Max upload size
- MFA enforcement
- Custom logo/branding
- Primary/secondary colors

**Storage**: JSON in `tenant_settings` table or `tenants.settings` column

### Branding

**Customizable Elements**:
- Logo URL
- Primary color
- Secondary color
- Favicon
- Company name

**Frontend Integration**: CSS variables dynamically updated

---

## Performance Optimizations

### Caching

**Tenant Info Cache**:
- In-memory cache
- TTL: 5 minutes
- Invalidate on update

**Settings Cache**:
- Per-tenant settings cached
- Reload on explicit update

### Indexing

**Critical Indexes**:
```sql
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX idx_users_tenant_username ON users(tenant_id, username);
```

**Composite indexes** for common queries ensure tenant filter is used first.

---

## Security Validation

### Isolation Testing

**Test Suite**:
```go
func TestTenantIsolation_UserList(t *testing.T) {
    tenant1 := createTestTenant("t1")
    tenant2 := createTestTenant("t2")
    
    user1 := createTestUser(tenant1.ID, "user1")
    user2 := createTestUser(tenant2.ID, "user2")
    
    ctx := contextWithTenant(tenant1.ID)
    users := userRepo.List(ctx)
    
    assert.Len(t, users, 1)
    assert.Equal(t, user1.ID, users[0].ID)
}
```

### Penetration Testing Checklist

- [ ] Tamper `tenant_id` in JWT
- [ ] SQL injection with tenant bypass
- [ ] Cross-tenant session hijacking
- [ ] API endpoint validation
- [ ] File upload tenant isolation

---

## Migration Strategy

### Single-Tenant → Multi-Tenant

**Steps**:
1. Add `tenants` table
2. Insert default tenant: `tenant-default`
3. Add `tenant_id` columns (default: `tenant-default`)
4. Migrate existing data to default tenant
5. Update application code (middleware)
6. Feature flag: `MULTI_TENANT_ENABLED=true`
7. Deploy with backward compatibility

**Backward Compatibility**: Single-tenant mode continues to work with `tenant-default`

---

## API Design

### Tenant Management

```
POST   /api/v1/tenants                  # Create (super admin)
GET    /api/v1/tenants                  # List all (super admin)
GET    /api/v1/tenants/:id              # Get details
PUT    /api/v1/tenants/:id              # Update
DELETE /api/v1/tenants/:id              # Soft delete

GET    /api/v1/tenants/current          # Current tenant info
PUT    /api/v1/tenants/current/settings # Update settings
PUT    /api/v1/tenants/current/branding # Update branding
```

### Public Registration

```
POST   /api/v1/register/tenant          # Self-service signup
GET    /api/v1/register/tenant/check-slug  # Slug availability
```

---

## Frontend Integration

### Tenant Context

```typescript
const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  
  useEffect(() => {
    loadTenant();
  }, []);
  
  return { tenant, reloadTenant };
};
```

### Dynamic Branding

```typescript
useEffect(() => {
  if (tenant?.branding) {
    document.documentElement.style.setProperty(
      '--primary-color',
      tenant.branding.primaryColor
    );
  }
}, [tenant]);
```

---

## Rollout Plan

### Phase 1: MVP (Design Complete)
- Shared schema with `tenant_id`
- Subdomain-based identification
- Basic tenant settings
- Manual tenant creation

**Timeline**: 16 hours implementation

### Phase 2: Enhanced
- Custom domain support
- Self-service registration
- Advanced branding
- Tenant analytics

**Timeline**: 20 hours

### Phase 3: Enterprise
- Separate schemas option
- Separate databases option
- Data export/import
- Compliance features

**Timeline**: 40 hours

---

## Success Criteria - Design Phase

- [x] Architecture diagrams created
- [x] Database schema designed
- [x] Tenant identification strategy defined
- [x] Middleware design complete
- [x] Isolation strategies documented
- [x] Onboarding flow designed
- [x] API endpoints specified
- [x] Security considerations documented
- [x] Migration strategy defined
- [x] Performance optimizations planned

---

## Estimated Effort

- **Design**: 4 hours (✅ completed)
- **Implementation**: 16 hours (pending)
  - Database migration: 3h
  - Middleware: 3h
  - Repository updates: 4h
  - API endpoints: 2h
  - Frontend: 2h
  - Testing: 2h
- **Total**: 20 hours

---

## Related Tasks

- **Enables**: Multi-organization deployments
- **Related**: P1-2 SSO/OIDC (tenant-specific SSO configs)
- **Related**: P1-4 Data Permissions (tenant + department isolation)

---

## Next Steps

### Implementation Phase (When Approved)
1. Database migration scripts
2. Tenant middleware implementation
3. Repository pattern updates
4. Tenant management APIs
5. Frontend tenant context
6. Isolation tests
7. Documentation

### Before Production
1. Review security model
2. Load testing with multiple tenants
3. Cache performance validation
4. Index performance validation
5. Migration dry-run

---

**Completion Status**: ✅ Design phase complete  
**Document Quality**: ✅ Comprehensive (1000+ lines)  
**Implementation Ready**: ✅ All components specified  
**Status**: Awaiting approval for implementation (16 hours)
