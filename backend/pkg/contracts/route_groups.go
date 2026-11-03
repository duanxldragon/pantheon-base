package contracts

import (
	"github.com/duanxldragon/pantheon-base/backend/internal/middleware"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// ProtectedGroup is the standard entry point for a business route group:
// the chain is TokenAuth -> Casbin and nothing else.
//
// It deliberately does NOT install a tenant-context middleware. That is a
// contract requirement, not an oversight: TENANT_CONTRACT_V1 §2.6 records that
// the business domain (modules/business/*) does not participate in tenant
// isolation in V1 — business tables carry no tenant_id column, the generator
// explicitly rejects the "tenant" data scope (internal/scaffold/contract.go),
// and tenant.WithTenantScope(nil) would filter nothing even if it ran.
//
// Do not "fix" this by appending middleware.TenantContextMiddleware here: it
// isolates nothing, and in multi mode it turns every business request into
// TENANT_CONTEXT_MISSING. Changing this chain is a contract change, not a bug
// fix; route_groups_test.go pins the chain and fails first.
func ProtectedGroup(r *gin.RouterGroup, path string) gin.IRoutes {
	return ProtectedGroupWithRedis(r, path, database.RDB)
}

// ProtectedGroupWithRedis is ProtectedGroup with an explicit Redis client for
// token-revocation and session-cache lookups. Same chain: TokenAuth -> Casbin.
//
// Same contract boundary as ProtectedGroup: no tenant-context middleware by
// design (TENANT_CONTRACT_V1 §2.6). DataScopedGroup builds on this function, so
// the boundary covers it as well.
func ProtectedGroupWithRedis(r *gin.RouterGroup, path string, rdb *redis.Client) gin.IRoutes {
	return r.Group(path).
		Use(middleware.TokenAuthMiddleware(rdb)).
		Use(middleware.CasbinMiddleware())
}

// DataScopedGroup appends the IAM data-scope middleware to ProtectedGroup:
// TokenAuth -> Casbin -> DataScope.
//
// DataScope is orthogonal to tenancy: it narrows rows by self/department scope,
// not by tenant. The group still installs no tenant-context middleware, per
// TENANT_CONTRACT_V1 §2.6, and business tables have no tenant_id to filter on.
func DataScopedGroup(r *gin.RouterGroup, path string, db *gorm.DB) gin.IRoutes {
	return ProtectedGroup(r, path).
		Use(middleware.DataScopeMiddleware(db))
}
