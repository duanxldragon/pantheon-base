package cmdb

import (
	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/modules/business/cmdb/group"
	"pantheon-platform/backend/modules/business/cmdb/host"
	"pantheon-platform/backend/pkg/contracts"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitCmdbModule(r *gin.RouterGroup, db *gorm.DB) {
	hostSvc := host.NewHostService(db)
	hostHandler := host.NewHostHandler(hostSvc)

	groupSvc := group.NewGroupService(db)
	groupHandler := group.NewGroupHandler(groupSvc)

	modules := []contracts.BackendModule{
		contracts.FuncModule{
			ModuleName:    "business.cmdb.host",
			MigrateFunc:   func(db *gorm.DB) error { return hostSvc.Migrate() },
			SeedMenusFunc: seedHostMenus,
			SeedPermsFunc: seedHostPermissions,
			SeedI18nFunc:  seedHostI18n,
			Register: func(r *gin.RouterGroup) {
				cmdb := r.Group("/business/cmdb").
					Use(middleware.JWTAuthMiddleware()).
					Use(middleware.CasbinMiddleware())
				hostHandler.RegisterRoutes(cmdb)
			},
		},
		contracts.FuncModule{
			ModuleName:    "business.cmdb.group",
			MigrateFunc:   func(db *gorm.DB) error { return groupSvc.Migrate() },
			SeedMenusFunc: seedGroupMenus,
			SeedPermsFunc: seedGroupPermissions,
			SeedI18nFunc:  seedGroupI18n,
			Register: func(r *gin.RouterGroup) {
				cmdb := r.Group("/business/cmdb").
					Use(middleware.JWTAuthMiddleware()).
					Use(middleware.CasbinMiddleware())
				groupHandler.RegisterRoutes(cmdb)
			},
		},
	}

	contracts.RegisterBackendModules(r, db, modules...)
}
