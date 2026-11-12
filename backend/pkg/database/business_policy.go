package database

import (
	"context"
	"strings"

	"github.com/casbin/casbin/v2"
	"github.com/duanxldragon/pantheon-base/backend/pkg/contracts/businessauth"
	"github.com/duanxldragon/pantheon-base/backend/pkg/tenant"
	"gorm.io/gorm"
)

// ReadBusinessPolicy uses the existing Casbin model and persisted adapter without
// consulting or modifying the process enforcer, its watcher, or its caches.
func ReadBusinessPolicy(ctx context.Context, db *gorm.DB) (*casbin.Enforcer, error) {
	if ctx == nil || ctx.Err() != nil || db == nil {
		return nil, businessauth.ErrDenied
	}
	enforcer, err := casbin.NewEnforcer(loadCasbinModel(), &GormCasbinAdapter{db: db.WithContext(ctx)})
	if err != nil || ctx.Err() != nil {
		return nil, businessauth.ErrDenied
	}
	return enforcer, nil
}

// AuthorizeBusinessBindings returns only bindings which actually grant the action.
// Genuine tenant0 subjects are evaluated first; tenant role keys are never expanded
// into global subjects. A permission checkpoint also requires its current key.
func AuthorizeBusinessBindings(ctx context.Context, db *gorm.DB, enforcer *casbin.Enforcer, bindings []businessauth.RoleBinding, action businessauth.Action) ([]businessauth.RoleBinding, error) {
	if ctx == nil || db == nil || enforcer == nil || action.Path == "" || action.RouteTemplate == "" || action.Method == "" {
		return nil, businessauth.ErrDenied
	}
	granted := make([]businessauth.RoleBinding, 0)
	for _, namespaceGlobal := range []bool{true, false} {
		for _, binding := range bindings {
			if (binding.TenantID == 0) != namespaceGlobal || strings.TrimSpace(binding.RoleKey) == "" {
				continue
			}
			subject := tenant.RoleSubject(binding.RoleKey, binding.TenantID)
			if binding.TenantID == 0 {
				subject = tenant.GlobalRoleSubject(binding.RoleKey)
			}
			allowed, err := enforcer.Enforce(subject, action.Path, action.Method)
			if err != nil {
				return nil, businessauth.ErrDenied
			}
			if !allowed {
				continue
			}
			if action.Permission != "" && (binding.TenantID != 0 || binding.RoleKey != "admin") {
				var count int64
				err = db.WithContext(ctx).Table("system_role_permission rp").
					Joins("JOIN system_role r ON r.id = rp.role_id AND r.tenant_id = rp.tenant_id").
					Where("rp.tenant_id = ? AND r.role_key = ? AND r.status = ? AND r.deleted_at IS NULL AND rp.permission_key = ?", binding.TenantID, binding.RoleKey, 1, action.Permission).Count(&count).Error
				if err != nil {
					return nil, businessauth.ErrDenied
				}
				if count == 0 {
					continue
				}
			}
			granted = append(granted, binding)
		}
		// Preserve global-first authorization and its policy namespace.
		if len(granted) > 0 {
			break
		}
	}
	if len(granted) == 0 || ctx.Err() != nil {
		return nil, businessauth.ErrDenied
	}
	return granted, nil
}
