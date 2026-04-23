package cmdb

import (
	"strings"

	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/contracts"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitCMDBModule(r *gin.RouterGroup, db *gorm.DB) {
	cmdbSvc := NewCMDBService(db)
	cmdbHandler := NewCMDBHandler(cmdbSvc)

	modules := []contracts.BackendModule{
		contracts.FuncModule{
			ModuleName:    "business.cmdb",
			MigrateFunc:   func(_ *gorm.DB) error { return cmdbSvc.Migrate() },
			SeedMenusFunc: seedCMDBMenus,
			SeedPermsFunc: seedCMDBRolePermissions,
			Register: func(r *gin.RouterGroup) {
				protected := r.Group("/business/cmdb").Use(middleware.JWTAuthMiddleware()).Use(middleware.CasbinMiddleware())
				{
					protected.GET("/type/list", cmdbHandler.GetTypeList)
					protected.GET("/type/import-template", cmdbHandler.DownloadTypeImportTemplate)
					protected.POST("/type", cmdbHandler.CreateType)
					protected.POST("/type/export", cmdbHandler.ExportTypes)
					protected.POST("/type/import", cmdbHandler.ImportTypes)
					protected.PUT("/type/:id", cmdbHandler.UpdateType)
					protected.DELETE("/type/:id", cmdbHandler.DeleteType)
					protected.GET("/item/list", cmdbHandler.GetItemList)
					protected.GET("/item/import-template", cmdbHandler.DownloadItemImportTemplate)
					protected.GET("/item/:id", cmdbHandler.GetItemDetail)
					protected.POST("/item", cmdbHandler.CreateItem)
					protected.POST("/item/export", cmdbHandler.ExportItems)
					protected.POST("/item/import", cmdbHandler.ImportItems)
					protected.POST("/relation", cmdbHandler.CreateRelation)
					protected.PUT("/item/:id", cmdbHandler.UpdateItem)
					protected.DELETE("/item/:id", cmdbHandler.DeleteItem)
					protected.DELETE("/relation/:id", cmdbHandler.DeleteRelation)
				}
			},
		},
	}

	contracts.RegisterBackendModules(r, db, modules...)
}

type cmdbMenuSeed struct {
	Key       string
	ParentKey string
	TitleKey  string
	Path      string
	Component string
	PagePerm  string
	Perms     string
	Type      string
	Icon      string
	RouteName string
	Module    string
	Sort      int
}

func seedCMDBMenus(db *gorm.DB) error {
	return ensureCMDBMenuSeeds(db, []cmdbMenuSeed{
		{Key: "cmdb-root", TitleKey: "cmdb.menu.root", Path: "/business/cmdb", Type: "M", Icon: "storage", RouteName: "business-cmdb-root", Module: "business.cmdb", Sort: 80},
		{Key: "cmdb-types", ParentKey: "cmdb-root", TitleKey: "cmdb.menu.types", Path: "/business/cmdb/types", Component: "business/cmdb/CMDBTypeList", PagePerm: "business:cmdb:type:list", Type: "C", Icon: "list", RouteName: "business-cmdb-types", Module: "business.cmdb", Sort: 10},
		{Key: "cmdb-items", ParentKey: "cmdb-root", TitleKey: "cmdb.menu.items", Path: "/business/cmdb/items", Component: "business/cmdb/CMDBItemList", PagePerm: "business:cmdb:item:list", Type: "C", Icon: "storage", RouteName: "business-cmdb-items", Module: "business.cmdb", Sort: 20},
		{Key: "cmdb-type-create", ParentKey: "cmdb-types", TitleKey: "cmdb.permission.type.create", Perms: "business:cmdb:type:create", Type: "F", Sort: 1},
		{Key: "cmdb-type-update", ParentKey: "cmdb-types", TitleKey: "cmdb.permission.type.update", Perms: "business:cmdb:type:update", Type: "F", Sort: 2},
		{Key: "cmdb-type-delete", ParentKey: "cmdb-types", TitleKey: "cmdb.permission.type.delete", Perms: "business:cmdb:type:delete", Type: "F", Sort: 3},
		{Key: "cmdb-type-export", ParentKey: "cmdb-types", TitleKey: "cmdb.permission.type.export", Perms: "business:cmdb:type:export", Type: "F", Sort: 4},
		{Key: "cmdb-type-import", ParentKey: "cmdb-types", TitleKey: "cmdb.permission.type.import", Perms: "business:cmdb:type:import", Type: "F", Sort: 5},
		{Key: "cmdb-item-view", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.view", Perms: "business:cmdb:item:view", Type: "F", Sort: 1},
		{Key: "cmdb-item-create", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.create", Perms: "business:cmdb:item:create", Type: "F", Sort: 2},
		{Key: "cmdb-item-update", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.update", Perms: "business:cmdb:item:update", Type: "F", Sort: 3},
		{Key: "cmdb-item-delete", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.delete", Perms: "business:cmdb:item:delete", Type: "F", Sort: 4},
		{Key: "cmdb-item-export", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.export", Perms: "business:cmdb:item:export", Type: "F", Sort: 5},
		{Key: "cmdb-item-import", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.item.import", Perms: "business:cmdb:item:import", Type: "F", Sort: 6},
		{Key: "cmdb-relation-create", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.relation.create", Perms: "business:cmdb:relation:create", Type: "F", Sort: 7},
		{Key: "cmdb-relation-delete", ParentKey: "cmdb-items", TitleKey: "cmdb.permission.relation.delete", Perms: "business:cmdb:relation:delete", Type: "F", Sort: 8},
	})
}

func ensureCMDBMenuSeeds(db *gorm.DB, seeds []cmdbMenuSeed) error {
	if db == nil || !db.Migrator().HasTable("system_menu") {
		return nil
	}
	for _, seed := range seeds {
		if err := ensureSingleCMDBMenuSeed(db, seed); err != nil {
			return err
		}
	}
	return nil
}

func ensureSingleCMDBMenuSeed(db *gorm.DB, seed cmdbMenuSeed) error {
	var menuID uint64
	if seed.Path != "" {
		if err := db.Table("system_menu").Select("id").Where("path = ?", seed.Path).Limit(1).Pluck("id", &menuID).Error; err != nil {
			return err
		}
	} else if seed.Perms != "" {
		if err := db.Table("system_menu").Select("id").Where("perms = ?", seed.Perms).Limit(1).Pluck("id", &menuID).Error; err != nil {
			return err
		}
	}

	parentID, err := resolveCMDBMenuParentID(db, seed.ParentKey)
	if err != nil {
		return err
	}

	payload := map[string]interface{}{
		"parent_id":  parentID,
		"title_key":  seed.TitleKey,
		"path":       seed.Path,
		"component":  seed.Component,
		"page_perm":  seed.PagePerm,
		"perms":      seed.Perms,
		"type":       normalizeCMDBMenuType(seed.Type),
		"icon":       seed.Icon,
		"route_name": strings.TrimSpace(seed.RouteName),
		"module":     "business.cmdb",
		"sort":       seed.Sort,
		"is_visible": 1,
	}

	if menuID == 0 {
		if err := db.Table("system_menu").Create(payload).Error; err != nil {
			return err
		}
		if seed.Path != "" {
			if err := db.Table("system_menu").Select("id").Where("path = ?", seed.Path).Limit(1).Pluck("id", &menuID).Error; err != nil {
				return err
			}
		} else if seed.Perms != "" {
			if err := db.Table("system_menu").Select("id").Where("perms = ?", seed.Perms).Limit(1).Pluck("id", &menuID).Error; err != nil {
				return err
			}
		}
	} else if err := db.Table("system_menu").Where("id = ?", menuID).Updates(payload).Error; err != nil {
		return err
	}

	return bindCMDBMenuToAdmin(db, menuID)
}

func bindCMDBMenuToAdmin(db *gorm.DB, menuID uint64) error {
	if menuID == 0 || !db.Migrator().HasTable("system_role") || !db.Migrator().HasTable("system_role_menu") {
		return nil
	}
	var adminRoleID uint64
	if err := db.Table("system_role").Select("id").Where("role_key = ?", "admin").Limit(1).Pluck("id", &adminRoleID).Error; err != nil {
		return err
	}
	if adminRoleID == 0 {
		return nil
	}
	var count int64
	if err := db.Table("system_role_menu").Where("role_id = ? AND menu_id = ?", adminRoleID, menuID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	return db.Exec("INSERT INTO system_role_menu (role_id, menu_id) VALUES (?, ?)", adminRoleID, menuID).Error
}

func seedCMDBRolePermissions(db *gorm.DB) error {
	if db == nil || !db.Migrator().HasTable("system_role_menu") || !db.Migrator().HasTable("system_role_permission") || !db.Migrator().HasTable("system_menu") {
		return nil
	}
	type rolePermissionSeed struct {
		RoleID        uint64 `gorm:"column:role_id"`
		PermissionKey string `gorm:"column:permission_key"`
	}
	var seeds []rolePermissionSeed
	if err := db.Table("system_role_menu").
		Select("system_role_menu.role_id AS role_id, COALESCE(NULLIF(system_menu.page_perm, ''), NULLIF(system_menu.perms, '')) AS permission_key").
		Joins("JOIN system_menu ON system_menu.id = system_role_menu.menu_id").
		Where("system_menu.module = ? AND (system_menu.page_perm <> '' OR system_menu.perms <> '')", "business.cmdb").
		Scan(&seeds).Error; err != nil {
		return err
	}
	for _, seed := range seeds {
		permissionKey := strings.TrimSpace(seed.PermissionKey)
		if seed.RoleID == 0 || permissionKey == "" {
			continue
		}
		var count int64
		if err := db.Table("system_role_permission").Where("role_id = ? AND permission_key = ?", seed.RoleID, permissionKey).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := db.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (?, ?)", seed.RoleID, permissionKey).Error; err != nil {
			return err
		}
	}
	return nil
}

func resolveCMDBMenuParentID(db *gorm.DB, parentKey string) (uint64, error) {
	parentPaths := map[string]string{
		"cmdb-root":  "/business/cmdb",
		"cmdb-types": "/business/cmdb/types",
		"cmdb-items": "/business/cmdb/items",
	}
	parentPath, ok := parentPaths[parentKey]
	if !ok {
		return 0, nil
	}
	var menuID uint64
	if err := db.Table("system_menu").Select("id").Where("path = ?", parentPath).Limit(1).Pluck("id", &menuID).Error; err != nil {
		return 0, err
	}
	return menuID, nil
}

func normalizeCMDBMenuType(value string) string {
	switch value {
	case "M", "C", "F":
		return value
	default:
		return "C"
	}
}
