package tenant

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

var (
	ErrQuotaExceeded = errors.New("tenant quota exceeded")
)

// TenantQuota represents quota limits for a tenant
type TenantQuota struct {
	MaxUsers       int `json:"max_users"`
	MaxRoles       int `json:"max_roles"`
	MaxDepts       int `json:"max_depts"`
	MaxAPIKeys     int `json:"max_api_keys"`
	MaxStorageMB   int `json:"max_storage_mb"`
}

// GetDefaultQuota returns default quota based on plan
func GetDefaultQuota(plan string) TenantQuota {
	switch plan {
	case "free":
		return TenantQuota{
			MaxUsers:     5,
			MaxRoles:     3,
			MaxDepts:     5,
			MaxAPIKeys:   2,
			MaxStorageMB: 100,
		}
	case "basic":
		return TenantQuota{
			MaxUsers:     20,
			MaxRoles:     10,
			MaxDepts:     20,
			MaxAPIKeys:   10,
			MaxStorageMB: 1000,
		}
	case "professional":
		return TenantQuota{
			MaxUsers:     100,
			MaxRoles:     50,
			MaxDepts:     100,
			MaxAPIKeys:   50,
			MaxStorageMB: 10000,
		}
	case "enterprise":
		return TenantQuota{
			MaxUsers:     -1, // Unlimited
			MaxRoles:     -1,
			MaxDepts:     -1,
			MaxAPIKeys:   -1,
			MaxStorageMB: -1,
		}
	default:
		return GetDefaultQuota("free")
	}
}

// QuotaEnforcer handles tenant quota enforcement
type QuotaEnforcer struct {
	db *gorm.DB
}

// NewQuotaEnforcer creates a new quota enforcer instance
func NewQuotaEnforcer(db *gorm.DB) *QuotaEnforcer {
	return &QuotaEnforcer{db: db}
}

// CheckUserQuota verifies if tenant can add more users
func (e *QuotaEnforcer) CheckUserQuota(tenantID uint64) error {
	var tenant Tenant
	if err := e.db.First(&tenant, tenantID).Error; err != nil {
		return fmt.Errorf("get tenant: %w", err)
	}

	quota := GetDefaultQuota(tenant.Plan)
	if quota.MaxUsers < 0 {
		return nil // Unlimited
	}

	var count int64
	if err := e.db.Model(&TenantMembership{}).
		Where("tenant_id = ? AND status = ?", tenantID, "active").
		Count(&count).Error; err != nil {
		return fmt.Errorf("count users: %w", err)
	}

	if int(count) >= quota.MaxUsers {
		return fmt.Errorf("%w: max users (%d) reached", ErrQuotaExceeded, quota.MaxUsers)
	}

	return nil
}

// CheckRoleQuota verifies if tenant can create more roles
func (e *QuotaEnforcer) CheckRoleQuota(tenantID uint64) error {
	var tenant Tenant
	if err := e.db.First(&tenant, tenantID).Error; err != nil {
		return fmt.Errorf("get tenant: %w", err)
	}

	quota := GetDefaultQuota(tenant.Plan)
	if quota.MaxRoles < 0 {
		return nil // Unlimited
	}

	var count int64
	if err := e.db.Table("system_role").
		Where("tenant_id = ?", tenantID).
		Count(&count).Error; err != nil {
		return fmt.Errorf("count roles: %w", err)
	}

	if int(count) >= quota.MaxRoles {
		return fmt.Errorf("%w: max roles (%d) reached", ErrQuotaExceeded, quota.MaxRoles)
	}

	return nil
}

// GetTenantUsage returns current resource usage for a tenant
func (e *QuotaEnforcer) GetTenantUsage(tenantID uint64) (map[string]int64, error) {
	usage := make(map[string]int64)

	// Count users
	var userCount int64
	e.db.Model(&TenantMembership{}).
		Where("tenant_id = ? AND status = ?", tenantID, "active").
		Count(&userCount)
	usage["users"] = userCount

	// Count roles
	var roleCount int64
	e.db.Table("system_role").
		Where("tenant_id = ?", tenantID).
		Count(&roleCount)
	usage["roles"] = roleCount

	// Count depts
	var deptCount int64
	e.db.Table("system_dept").
		Where("tenant_id = ?", tenantID).
		Count(&deptCount)
	usage["depts"] = deptCount

	// Count API keys (if table exists)
	var apiKeyCount int64
	e.db.Table("api_keys").
		Where("tenant_id = ?", tenantID).
		Count(&apiKeyCount)
	usage["api_keys"] = apiKeyCount

	return usage, nil
}

// TenantAuditLogger logs tenant-related audit events
type TenantAuditLogger struct {
	db *gorm.DB
}

// NewTenantAuditLogger creates a new audit logger
func NewTenantAuditLogger(db *gorm.DB) *TenantAuditLogger {
	return &TenantAuditLogger{db: db}
}

// LogTenantCreated logs tenant creation event
func (l *TenantAuditLogger) LogTenantCreated(tenantID uint64, operatorID uint64, snapshot string) error {
	return l.logEvent(tenantID, operatorID, "tenant.created", snapshot)
}

// LogTenantUpdated logs tenant update event
func (l *TenantAuditLogger) LogTenantUpdated(tenantID uint64, operatorID uint64, snapshot string) error {
	return l.logEvent(tenantID, operatorID, "tenant.updated", snapshot)
}

// LogTenantDeleted logs tenant deletion event
func (l *TenantAuditLogger) LogTenantDeleted(tenantID uint64, operatorID uint64, snapshot string) error {
	return l.logEvent(tenantID, operatorID, "tenant.deleted", snapshot)
}

// LogMemberAdded logs member addition event
func (l *TenantAuditLogger) LogMemberAdded(tenantID uint64, operatorID uint64, memberUserID uint64, role string) error {
	snapshot := fmt.Sprintf(`{"user_id":%d,"role":"%s"}`, memberUserID, role)
	return l.logEvent(tenantID, operatorID, "tenant.member.added", snapshot)
}

// LogMemberRemoved logs member removal event
func (l *TenantAuditLogger) LogMemberRemoved(tenantID uint64, operatorID uint64, memberUserID uint64) error {
	snapshot := fmt.Sprintf(`{"user_id":%d}`, memberUserID)
	return l.logEvent(tenantID, operatorID, "tenant.member.removed", snapshot)
}

func (l *TenantAuditLogger) logEvent(tenantID uint64, operatorID uint64, eventType string, detail string) error {
	// Log to operation_logs table (which already has tenant_id support)
	return l.db.Exec(`
		INSERT INTO operation_logs (tenant_id, user_id, module, operation, detail, created_at)
		VALUES (?, ?, 'tenant', ?, ?, NOW())
	`, tenantID, operatorID, eventType, detail).Error
}

// TenantHealthChecker provides health check utilities
type TenantHealthChecker struct {
	db *gorm.DB
}

// NewTenantHealthChecker creates a new health checker
func NewTenantHealthChecker(db *gorm.DB) *TenantHealthChecker {
	return &TenantHealthChecker{db: db}
}

// CheckTenantHealth performs comprehensive health check on a tenant
func (c *TenantHealthChecker) CheckTenantHealth(tenantID uint64) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	// Check tenant exists
	var tenant Tenant
	if err := c.db.First(&tenant, tenantID).Error; err != nil {
		return nil, fmt.Errorf("tenant not found: %w", err)
	}
	result["tenant_status"] = tenant.Status

	// Check member count
	var memberCount int64
	c.db.Model(&TenantMembership{}).
		Where("tenant_id = ? AND status = ?", tenantID, "active").
		Count(&memberCount)
	result["member_count"] = memberCount

	// Check for orphaned data
	var orphanedUsers int64
	c.db.Raw(`
		SELECT COUNT(*)
		FROM system_user
		WHERE tenant_id = ?
		AND id NOT IN (SELECT user_id FROM tenant_memberships WHERE tenant_id = ? AND status = 'active')
	`, tenantID, tenantID).Scan(&orphanedUsers)
	result["orphaned_users"] = orphanedUsers

	// Check isolation integrity
	var isolationViolations int64
	c.db.Raw(`
		SELECT COUNT(*)
		FROM system_role r
		LEFT JOIN system_user_role ur ON ur.role_id = r.id
		WHERE r.tenant_id = ? AND ur.tenant_id != r.tenant_id
	`, tenantID).Scan(&isolationViolations)
	result["isolation_violations"] = isolationViolations

	result["healthy"] = orphanedUsers == 0 && isolationViolations == 0

	return result, nil
}
