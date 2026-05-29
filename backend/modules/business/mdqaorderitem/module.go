package mdqaorderitem

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/contracts"
	"strings"
)

type generatedMenuSeed struct {
	Key        string
	ParentKey  string
	ParentPath string
	TitleKey   string
	Path       string
	Component  string
	PagePerm   string
	Perms      string
	Type       string
	Icon       string
	RouteName  string
	Module     string
	Sort       int
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
		Key:        "mdqaorderitem",
		ParentKey:  "",
		ParentPath: "",
		TitleKey:   "business.mdqaorderitem.title",
		Path:       "/operations/mdqaorderitem",
		Component:  "business/mdqaorderitem/MdqaorderitemList",
		PagePerm:   "business:mdqaorderitem:list",
		Type:       "C",
		Icon:       "apps",
		RouteName:  "business-mdqaorderitem",
		Module:     "business.mdqaorderitem",
		Sort:       10,
	},
	{
		Key:       "mdqaorderitem-view",
		ParentKey: "mdqaorderitem",
		TitleKey:  "business.mdqaorderitem.permission.view",
		Perms:     "business:mdqaorderitem:view",
		Type:      "F",
		Module:    "business.mdqaorderitem",
		Sort:      1,
	},
	{
		Key:       "mdqaorderitem-create",
		ParentKey: "mdqaorderitem",
		TitleKey:  "business.mdqaorderitem.permission.create",
		Perms:     "business:mdqaorderitem:create",
		Type:      "F",
		Module:    "business.mdqaorderitem",
		Sort:      2,
	},
	{
		Key:       "mdqaorderitem-update",
		ParentKey: "mdqaorderitem",
		TitleKey:  "business.mdqaorderitem.permission.update",
		Perms:     "business:mdqaorderitem:update",
		Type:      "F",
		Module:    "business.mdqaorderitem",
		Sort:      3,
	},
	{
		Key:       "mdqaorderitem-delete",
		ParentKey: "mdqaorderitem",
		TitleKey:  "business.mdqaorderitem.permission.delete",
		Perms:     "business:mdqaorderitem:delete",
		Type:      "F",
		Module:    "business.mdqaorderitem",
		Sort:      4,
	},
}

var generatedI18nSeeds = []generatedI18nSeed{
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "menu", Key: "business.mdqaorderitem.title", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "field", Key: "business.mdqaorderitem.field.itemName.label", Value: "明细名称"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorderitem.field.itemName.placeholder", Value: "请输入明细名称"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "field", Key: "business.mdqaorderitem.field.quantity.label", Value: "数量"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorderitem.field.quantity.placeholder", Value: "请输入数量"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "field", Key: "business.mdqaorderitem.field.enabled.label", Value: "启用"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "field", Key: "business.mdqaorderitem.field.remark.label", Value: "备注"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorderitem.field.remark.placeholder", Value: "请输入备注"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "field", Key: "business.mdqaorderitem.field.orderId.label", Value: "订单ID"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "placeholder", Key: "business.mdqaorderitem.field.orderId.placeholder", Value: "自动回填"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorderitem.permission.view", Value: "view订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorderitem.permission.create", Value: "create订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorderitem.permission.update", Value: "update订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorderitem.permission.delete", Value: "delete订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorderitem.audit.create", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorderitem.audit.update", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "audit", Key: "business.mdqaorderitem.audit.delete", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "zh-CN", Group: "permission", Key: "business.mdqaorderitem.permission.detail", Value: "detail订单明细"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "menu", Key: "business.mdqaorderitem.title", Value: "Order Item"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "field", Key: "business.mdqaorderitem.field.itemName.label", Value: "Item Name"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorderitem.field.itemName.placeholder", Value: "Enter item name"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "field", Key: "business.mdqaorderitem.field.quantity.label", Value: "Quantity"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorderitem.field.quantity.placeholder", Value: "Enter quantity"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "field", Key: "business.mdqaorderitem.field.enabled.label", Value: "Enabled"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "field", Key: "business.mdqaorderitem.field.remark.label", Value: "Remark"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorderitem.field.remark.placeholder", Value: "Enter remark"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "field", Key: "business.mdqaorderitem.field.orderId.label", Value: "Order ID"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "placeholder", Key: "business.mdqaorderitem.field.orderId.placeholder", Value: "Auto filled"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "permission", Key: "business.mdqaorderitem.permission.view", Value: "view Order Item"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "permission", Key: "business.mdqaorderitem.permission.create", Value: "create Order Item"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "permission", Key: "business.mdqaorderitem.permission.update", Value: "update Order Item"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "permission", Key: "business.mdqaorderitem.permission.delete", Value: "delete Order Item"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "audit", Key: "business.mdqaorderitem.audit.create", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "audit", Key: "business.mdqaorderitem.audit.update", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "audit", Key: "business.mdqaorderitem.audit.delete", Value: "订单明细"},
	{Module: "business.mdqaorderitem", Locale: "en-US", Group: "permission", Key: "business.mdqaorderitem.permission.detail", Value: "detail Order Item"},
}

func InitMdqaorderitemModule(r *gin.RouterGroup, db *gorm.DB) {
	service := NewMdqaorderitemService(db)
	handler := NewMdqaorderitemHandler(service)

	contracts.RegisterBackendModules(r, db, contracts.FuncModule{
		ModuleName:    "business.mdqaorderitem",
		MigrateFunc:   func(_ *gorm.DB) error { return service.Migrate() },
		SeedMenusFunc: seedMdqaorderitemMenus,
		SeedI18nFunc:  seedMdqaorderitemI18n,
		Register: func(r *gin.RouterGroup) {
			protected := r.Group("/business/mdqaorderitem").Use(middleware.JWTAuthMiddleware()).Use(middleware.CasbinMiddleware())
			{
				protected.GET("/list", handler.GetMdqaorderitemList)
				protected.GET("/options", handler.GetMdqaorderitemOptions)
				protected.GET("/:id", handler.GetMdqaorderitemDetail)

				protected.POST("", handler.CreateMdqaorderitem)
				protected.PUT("/:id", handler.UpdateMdqaorderitem)
				protected.DELETE("/:id", handler.DeleteMdqaorderitem)
			}
		},
	})
}

func seedMdqaorderitemMenus(db *gorm.DB) error {
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

func seedMdqaorderitemI18n(db *gorm.DB) error {
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
