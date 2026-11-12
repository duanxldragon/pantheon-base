package middleware

import (
	"strconv"
	"strings"

	"github.com/duanxldragon/pantheon-base/backend/pkg/contracts/businessauth"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"
	"github.com/duanxldragon/pantheon-base/backend/pkg/tenant"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BusinessTenantContextMiddleware establishes current principal before any
// header capability check and freezes provenance from tenant.Resolve itself.
func BusinessTenantContextMiddleware(db *gorm.DB, mode tenant.ModeReader, reader businessauth.Reader, platformScope bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, _ := c.Get(businessauth.IdentityKey)
		identity, ok := value.(businessauth.Identity)
		if !ok || db == nil || reader == nil || mode == nil {
			failPermissionCheck(c, "permission.denied")
			return
		}
		ctx := c.Request.Context()
		principal, err := reader.RefreshPrincipal(ctx, identity)
		if err != nil || principal.Identity != identity {
			failPermissionCheck(c, "permission.denied")
			return
		}
		currentMode, err := mode.ReadMode(ctx)
		if err != nil || (currentMode != tenant.ModeCompat && currentMode != tenant.ModeMulti) {
			failPermissionCheck(c, "permission.denied")
			return
		}
		if currentMode == tenant.ModeMulti && identity.ClaimTenantID > 0 {
			currentDB := db.WithContext(ctx)
			if tenant.EnsureTenantLoginable(currentDB, identity.ClaimTenantID) != nil || !tenant.HasActiveMembership(currentDB, identity.ClaimTenantID, identity.ActorID) {
				failPermissionCheck(c, "permission.denied")
				return
			}
			var count int64
			err := currentDB.Table("system_user_role ur").Joins("JOIN system_role r ON r.id = ur.role_id AND r.tenant_id = ur.tenant_id").
				Where("ur.user_id = ? AND ur.tenant_id = ? AND r.status = ? AND r.deleted_at IS NULL", identity.ActorID, identity.ClaimTenantID, 1).Count(&count).Error
			if err != nil || count == 0 {
				failPermissionCheck(c, "permission.denied")
				return
			}
		}
		header := strings.TrimSpace(c.GetHeader(tenant.HeaderTenantID))
		capable := false
		if currentMode == tenant.ModeMulti && (header != "" || (platformScope && identity.ClaimTenantID == 0)) {
			for _, binding := range principal.GlobalBindings {
				if binding.TenantID != 0 {
					failPermissionCheck(c, "permission.denied")
					return
				}
			}
			policy, err := database.ReadBusinessPolicy(ctx, db)
			if err != nil {
				failPermissionCheck(c, "permission.denied")
				return
			}
			_, err = database.AuthorizeBusinessBindings(ctx, db, policy, principal.GlobalBindings, businessauth.Action{Method: c.Request.Method, Path: c.Request.URL.Path, RouteTemplate: c.FullPath()})
			capable = err == nil
		}
		claim := ""
		if identity.ClaimTenantID > 0 {
			claim = strconv.FormatUint(identity.ClaimTenantID, 10)
		}
		population, failed := false, false
		if currentMode == tenant.ModeMulti && platformScope && identity.ClaimTenantID == 0 && header == "" {
			population, failed = tenant.IsPlatformPopulationUser(db.WithContext(ctx), identity.ActorID)
		}
		// Compat needs no membership lookup. Multi fallback must prove no memberships.
		resolved, err := tenant.Resolve(tenant.ResolveInput{Mode: currentMode, SubjectTenantID: claim, HeaderTenantID: header, HeaderAllowed: capable, PlatformScoped: platformScope, PlatformCapable: capable && !failed && population})
		if err != nil {
			failPermissionCheck(c, "permission.denied")
			return
		}
		tenant.SetGin(c, resolved)
		c.Next()
	}
}
