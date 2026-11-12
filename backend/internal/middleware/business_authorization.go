package middleware

import (
	"context"
	"strconv"
	"strings"

	"github.com/duanxldragon/pantheon-base/backend/pkg/common"
	"github.com/duanxldragon/pantheon-base/backend/pkg/contracts/businessauth"
	"github.com/duanxldragon/pantheon-base/backend/pkg/tenant"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BusinessAuthorizationMiddleware admits only declared business routes and
// freezes their authorization input for later reauthorization.
func BusinessAuthorizationMiddleware(reader businessauth.Reader, mode tenant.ModeReader, dataScope bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		identityValue, _ := c.Get(businessauth.IdentityKey)
		identity, ok := identityValue.(businessauth.Identity)
		resolution := tenant.FromGin(c)
		if !ok || resolution == nil || reader == nil || mode == nil {
			failPermissionCheck(c, "permission.denied")
			return
		}
		input := businessauth.Input{Identity: identity, Resolution: *resolution, ResourceTenantID: resolution.TenantID, DataScope: dataScope,
			Action: businessauth.Action{Method: c.Request.Method, Path: c.Request.URL.Path, RouteTemplate: c.FullPath()}}
		businessauth.BindGin(c, reader, mode, input)
		if _, err := businessauth.Reauthorize(c, nil); err != nil {
			failPermissionCheck(c, "permission.denied")
			return
		}
		c.Next()
	}
}

// ReadBusinessDataScope reuses the existing policy resolver over uncached reads
// and only the namespaces which granted this action. It never invokes the legacy
// middleware's nil-DB, user-dept cache, or mixed bare-role interpretation.
func ReadBusinessDataScope(ctx context.Context, db *gorm.DB, actor uint64, bindings []businessauth.RoleBinding) (*common.DataScopeReq, error) {
	if ctx == nil || ctx.Err() != nil || db == nil || actor == 0 || len(bindings) == 0 {
		return nil, businessauth.ErrDenied
	}
	db = db.WithContext(ctx)
	var user struct{ ID, DeptID uint64 }
	if err := db.Table("system_user").Select("id, dept_id").Where("id = ? AND status = ? AND deleted_at IS NULL", actor, common.StatusEnabled).Take(&user).Error; err != nil {
		return nil, businessauth.ErrDenied
	}
	scope := &common.DataScopeReq{UserID: actor, DeptID: user.DeptID, Mode: common.DataScopeModeCustom}
	policies := make([]SystemRoleDataScope, 0, len(bindings))
	for _, binding := range bindings {
		scope.RoleKeys = append(scope.RoleKeys, binding.RoleKey)
		if (binding.TenantID == 0 && binding.RoleKey == "admin") || (binding.TenantID > 0 && tenant.IsTenantScopedRoleKey(binding.RoleKey)) {
			scope.Mode = common.DataScopeModeAll
			scope.IsAdmin = binding.RoleKey == "admin" || binding.RoleKey == tenant.TenantRoleAdminKey
			return scope, nil
		}
		var policy SystemRoleDataScope
		if err := db.Where("tenant_id = ? AND role_key = ?", binding.TenantID, binding.RoleKey).Take(&policy).Error; err != nil || !isValidDataScopePolicyMode(policy.Mode) {
			return nil, businessauth.ErrDenied
		}
		policies = append(policies, policy)
	}
	scope.Mode = resolveDataScopeMode(policies)
	if scope.Mode == common.DataScopeModeCustom {
		scope.DeptIDs = resolveCustomDataScopeDeptIDs(policies)
	}
	if scope.Mode == common.DataScopeModeDeptAndChildren && scope.DeptID > 0 {
		// The existing ancestor algorithm, with a strict namespace and read errors.
		tid := bindings[0].TenantID
		text := strconv.FormatUint(scope.DeptID, 10)
		if err := db.Table("system_dept").Where("tenant_id = ?", tid).
			Where("id = ? OR ancestors = ? OR ancestors LIKE ? OR ancestors LIKE ? OR ancestors LIKE ?", scope.DeptID, text, text+",%", "%,"+text+",%", "%,"+text).
			Order("id asc").Pluck("id", &scope.DeptIDs).Error; err != nil {
			return nil, businessauth.ErrDenied
		}
	}
	if ctx.Err() != nil || strings.TrimSpace(scope.Mode) == "" {
		return nil, businessauth.ErrDenied
	}
	return scope, nil
}
