package mdqaorder

import (
	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/contracts"
	"strings"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type generatedMenuSeed struct {
	Key       string
	ParentKey string
	ParentPath string
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

type generatedI18nSeed struct {
	Module string
	Locale string
	Group  string
	Key    string
	Value  string
}

var generatedMenuSeeds = []generatedMenuSeed{
	{
		Key:       "mdqaorder",
		ParentKey: "",
		ParentPath: "",
		TitleKey:  "business.mdqaorder.title",
		Path:      "/business/mdqaorder",
		Component: "business/mdqaorder/MdqaorderList",
		PagePerm:  "business:mdqaorder:list",
		Type:      "C",
		Icon:      "apps",
		RouteName: "business-mdqaorder",
		Module:    "business.mdqaorder",
		Sort:      10,
	},
	{
		Key:       "mdqaorder-view",
		ParentKey: "mdqaorder",
		TitleKey:  "business.mdqaorder.permission.view",
		Perms:     "business:mdqaorder:view",
		Type:      "F",
		Module:    "business.mdqaorder",
		Sort:      1,
	},
	{
		Key:       "mdqaorder-create",
		ParentKey: "mdqaorder",
		TitleKey:  "business.mdqaorder.permission.create",
		Perms:     "business:mdqaorder:create",
		Type:      "F",
		Module:    "business.mdqaorder",
		Sort:      2,
	},
	{
		Key:       "mdqaorder-update",
		ParentKey: "mdqaorder",
		TitleKey:  "business.mdqaorder.permission.update",
		Perms:     "business:mdqaorder:update",
		Type:      "F",
		Module:    "business.mdqaorder",
		Sort:      3,
	},
	{
		Key:       "mdqaorder-delete",
		ParentKey: "mdqaorder",
		TitleKey:  "business.mdqaorder.permission.delete",
		Perms:     "business:mdqaorder:delete",
		Type:      "F",
		Module:    "business.mdqaorder",
		Sort:      4,
	},
}

var generatedI18nSeeds = []generatedI18nSeed{
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "menu", Key: "business.mdqaorder.title", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "field", Key: "business.mdqaorder.field.name.label", Value: "订单名称"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorder.field.name.placeholder", Value: "请输入订单名称"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "field", Key: "business.mdqaorder.field.status.label", Value: "状态"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorder.field.status.placeholder", Value: "请选择状态"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "option", Key: "business.mdqaorder.field.status.option.draft", Value: "草稿"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "option", Key: "business.mdqaorder.field.status.option.active", Value: "生效"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorder.permission.view", Value: "view主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorder.permission.create", Value: "create主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorder.permission.update", Value: "update主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorder.permission.delete", Value: "delete主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorder.audit.create", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorder.audit.update", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorder.audit.delete", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorder.permission.detail", Value: "detail主从订单"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "menu", Key: "business.mdqaorder.title", Value: "Master Detail Order"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "field", Key: "business.mdqaorder.field.name.label", Value: "Order Name"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorder.field.name.placeholder", Value: "Enter order name"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "field", Key: "business.mdqaorder.field.status.label", Value: "Status"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorder.field.status.placeholder", Value: "Select status"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "option", Key: "business.mdqaorder.field.status.option.draft", Value: "Draft"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "option", Key: "business.mdqaorder.field.status.option.active", Value: "Active"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "permission", Key: "business.mdqaorder.permission.view", Value: "view Master Detail Order"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "permission", Key: "business.mdqaorder.permission.create", Value: "create Master Detail Order"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "permission", Key: "business.mdqaorder.permission.update", Value: "update Master Detail Order"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "permission", Key: "business.mdqaorder.permission.delete", Value: "delete Master Detail Order"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "audit", Key: "business.mdqaorder.audit.create", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "audit", Key: "business.mdqaorder.audit.update", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "audit", Key: "business.mdqaorder.audit.delete", Value: "主从订单"},
	{Module: "business.mdqaorder", Locale: "en-US", Group: "permission", Key: "business.mdqaorder.permission.detail", Value: "detail Master Detail Order"},
}

func InitMdqaorderModule(r *gin.RouterGroup, db *gorm.DB) {
	service := NewMdqaorderService(db)
	handler := NewMdqaorderHandler(service)

	contracts.RegisterBackendModules(r, db, contracts.FuncModule{
		ModuleName:  "business.mdqaorder",
		MigrateFunc: func(_ *gorm.DB) error { return service.Migrate() },
		SeedMenusFunc: seedMdqaorderMenus,
		SeedI18nFunc: seedMdqaorderI18n,
		Register: func(r *gin.RouterGroup) {
			protected := r.Group("/business/mdqaorder").Use(middleware.JWTAuthMiddleware()).Use(middleware.CasbinMiddleware())
			{
				protected.GET("/list", handler.GetMdqaorderList)
				protected.GET("/:id", handler.GetMdqaorderDetail)
				protected.POST("", handler.CreateMdqaorder)
				protected.PUT("/:id", handler.UpdateMdqaorder)
				protected.DELETE("/:id", handler.DeleteMdqaorder)
			}
		},
	})
}

func seedMdqaorderMenus(db *gorm.DB) error {
	if db == nil || !db.Migrator().HasTable("system_menu") {
		return nil
	}
	return db.Transaction(func(tx *gorm.DB) error {
		keyToID := make(map[string]uint64, len(generatedMenuSeeds))
		for _, seed := range generatedMenuSeeds {
			if _, err := ensureGeneratedMenuSeed(tx, keyToID, seed); err != nil {
				return err
			}
		}
		return nil
	})
}

func ensureGeneratedMenuSeed(tx *gorm.DB, keyToID map[string]uint64, seed generatedMenuSeed) (uint64, error) {
	var menuID uint64
	if seed.Path != "" {
		if err := tx.Table("system_menu").Select("id").Where("path = ?", seed.Path).Limit(1).Pluck("id", &menuID).Error; err != nil {
			return 0, err
		}
	} else if seed.Perms != "" {
		if err := tx.Table("system_menu").Select("id").Where("perms = ?", seed.Perms).Limit(1).Pluck("id", &menuID).Error; err != nil {
			return 0, err
		}
	}

	parentID := uint64(0)
	if seed.ParentKey != "" {
		parentID = keyToID[seed.ParentKey]
	}
	if parentID == 0 && seed.ParentPath != "" {
		if err := tx.Table("system_menu").Select("id").Where("path = ?", seed.ParentPath).Limit(1).Pluck("id", &parentID).Error; err != nil {
			return 0, err
		}
	}

	payload := map[string]interface{}{
		"parent_id":  parentID,
		"title_key":  seed.TitleKey,
		"path":       seed.Path,
		"component":  seed.Component,
		"page_perm":  seed.PagePerm,
		"perms":      seed.Perms,
		"type":       seed.Type,
		"icon":       seed.Icon,
		"route_name": seed.RouteName,
		"module":     seed.Module,
		"sort":       seed.Sort,
		"is_visible": 1,
	}

	if menuID == 0 {
		if err := tx.Table("system_menu").Create(payload).Error; err != nil {
			return 0, err
		}
		if seed.Path != "" {
			if err := tx.Table("system_menu").Select("id").Where("path = ?", seed.Path).Limit(1).Pluck("id", &menuID).Error; err != nil {
				return 0, err
			}
		} else if seed.Perms != "" {
			if err := tx.Table("system_menu").Select("id").Where("perms = ?", seed.Perms).Limit(1).Pluck("id", &menuID).Error; err != nil {
				return 0, err
			}
		}
	} else if err := tx.Table("system_menu").Where("id = ?", menuID).Updates(payload).Error; err != nil {
		return 0, err
	}

	if seed.Key != "" {
		keyToID[seed.Key] = menuID
	}
	if err := bindGeneratedSeedToAdmin(tx, menuID, seed); err != nil {
		return 0, err
	}
	return menuID, nil
}

func bindGeneratedSeedToAdmin(tx *gorm.DB, menuID uint64, seed generatedMenuSeed) error {
	if menuID == 0 || !tx.Migrator().HasTable("system_role") {
		return nil
	}

	var adminRoleID uint64
	if err := tx.Table("system_role").Select("id").Where("role_key = ?", "admin").Limit(1).Pluck("id", &adminRoleID).Error; err != nil {
		return err
	}
	if adminRoleID == 0 {
		return nil
	}

	if seed.Type == "C" && tx.Migrator().HasTable("system_role_menu") {
		var count int64
		if err := tx.Table("system_role_menu").Where("role_id = ? AND menu_id = ?", adminRoleID, menuID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := tx.Exec("INSERT INTO system_role_menu (role_id, menu_id) VALUES (?, ?)", adminRoleID, menuID).Error; err != nil {
				return err
			}
		}
	}

	if tx.Migrator().HasTable("system_role_permission") {
		for _, permissionKey := range []string{strings.TrimSpace(seed.PagePerm), strings.TrimSpace(seed.Perms)} {
			if permissionKey == "" {
				continue
			}
			var count int64
			if err := tx.Table("system_role_permission").Where("role_id = ? AND permission_key = ?", adminRoleID, permissionKey).Count(&count).Error; err != nil {
				return err
			}
			if count == 0 {
				if err := tx.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (?, ?)", adminRoleID, permissionKey).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func seedMdqaorderI18n(db *gorm.DB) error {
	if db == nil || !db.Migrator().HasTable("system_i18n") {
		return nil
	}
	for _, seed := range generatedI18nSeeds {
		var count int64
		if err := db.Table("system_i18n").Where("module = ? AND locale = ? AND `key` = ?", seed.Module, seed.Locale, seed.Key).Count(&count).Error; err != nil {
			return err
		}
		payload := map[string]interface{}{
			"module":     seed.Module,
			"group_name": seed.Group,
			"key":        seed.Key,
			"locale":     seed.Locale,
			"value":      seed.Value,
		}
		if count == 0 {
			if err := db.Table("system_i18n").Create(payload).Error; err != nil {
				return err
			}
			continue
		}
		if err := db.Table("system_i18n").Where("module = ? AND locale = ? AND `key` = ?", seed.Module, seed.Locale, seed.Key).Updates(map[string]interface{}{
			"group_name": seed.Group,
			"value":      seed.Value,
		}).Error; err != nil {
			return err
		}
	}
	return nil
}
