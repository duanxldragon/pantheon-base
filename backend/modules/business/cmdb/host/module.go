package host

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
		Key:       "cmdb",
		TitleKey:  "business.cmdb.title",
		Path:      "/business/cmdb",
		Type:      "M",
		Icon:      "apps",
		RouteName: "business-cmdb",
		Module:    "business.cmdb",
		Sort:      10,
	},
	{
		Key:       "cmdb-host",
		ParentKey: "cmdb",
		TitleKey:  "business.cmdb.host.title",
		Path:      "/business/cmdb/host",
		Component: "business/cmdb/host/CmdbHostList",
		PagePerm:  "business:cmdb:host:list",
		Type:      "C",
		Icon:      "apps",
		RouteName: "business-cmdb-host",
		Module:    "business.cmdb.host",
		Sort:      10,
	},
	{
		Key:       "cmdb-host-view",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.view",
		Perms:     "business:cmdb:host:view",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      1,
	},
	{
		Key:       "cmdb-host-create",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.create",
		Perms:     "business:cmdb:host:create",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      2,
	},
	{
		Key:       "cmdb-host-update",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.update",
		Perms:     "business:cmdb:host:update",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      3,
	},
	{
		Key:       "cmdb-host-delete",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.delete",
		Perms:     "business:cmdb:host:delete",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      4,
	},
	{
		Key:       "cmdb-host-export",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.export",
		Perms:     "business:cmdb:host:export",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      5,
	},
	{
		Key:       "cmdb-host-import",
		ParentKey: "cmdb-host",
		TitleKey:  "business.cmdb.host.permission.import",
		Perms:     "business:cmdb:host:import",
		Type:      "F",
		Module:    "business.cmdb.host",
		Sort:      6,
	},
}

var generatedI18nSeeds = []generatedI18nSeed{
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "audit", Key: "business.cmdb.host.audit.create", Value: "新增主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "audit", Key: "business.cmdb.host.audit.delete", Value: "删除主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "audit", Key: "business.cmdb.host.audit.update", Value: "编辑主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.arch.label", Value: "架构"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.arch.placeholder", Value: "请输入架构"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.clusterName.label", Value: "集群名称"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.clusterName.placeholder", Value: "请输入集群名称"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.displayName.label", Value: "显示名称"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.displayName.placeholder", Value: "请输入显示名称"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.environment.label", Value: "环境"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.environment.option.dev", Value: "开发"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.environment.option.prod", Value: "生产"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.environment.option.staging", Value: "预发"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.environment.option.test", Value: "测试"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.environment.placeholder", Value: "请选择环境"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.hostCode.label", Value: "主机编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.hostCode.placeholder", Value: "请输入主机编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.hostname.label", Value: "主机名"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.hostname.placeholder", Value: "请输入主机名"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.idcCode.label", Value: "机房编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.idcCode.placeholder", Value: "请输入机房编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.ipAddress.label", Value: "IP 地址"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.ipAddress.placeholder", Value: "请输入 IP 地址"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.kernelVersion.label", Value: "内核版本"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.kernelVersion.placeholder", Value: "请输入内核版本"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.lastCheckInAt.label", Value: "最近上报时间"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.lastInventoryAt.label", Value: "最近盘点时间"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.lastOperatedAt.label", Value: "最近操作时间"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.lifecycleStatus.label", Value: "生命周期状态"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.lifecycleStatus.placeholder", Value: "请输入生命周期状态"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.maintainerTeam.label", Value: "维护团队"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.maintainerTeam.placeholder", Value: "请输入维护团队"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.osFamily.label", Value: "系统家族"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.osFamily.placeholder", Value: "请输入系统家族"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.osName.label", Value: "操作系统"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.osName.placeholder", Value: "请输入操作系统"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.ownerName.label", Value: "负责人"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.ownerName.placeholder", Value: "请输入负责人"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.ownerUserId.label", Value: "负责人用户 ID"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.provider.label", Value: "云厂商"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.provider.placeholder", Value: "请输入云厂商"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.purpose.label", Value: "用途"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.purpose.placeholder", Value: "请输入用途"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.regionCode.label", Value: "区域编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.regionCode.placeholder", Value: "请输入区域编码"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.remark.label", Value: "备注"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.remark.placeholder", Value: "请输入备注"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.sshPort.label", Value: "SSH 端口"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "field", Key: "business.cmdb.host.field.status.label", Value: "状态"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.status.option.active", Value: "启用"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "option", Key: "business.cmdb.host.field.status.option.inactive", Value: "停用"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "placeholder", Key: "business.cmdb.host.field.status.placeholder", Value: "请选择状态"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.create", Value: "新增主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.delete", Value: "删除主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.export", Value: "导出主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.import", Value: "导入主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.update", Value: "编辑主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "permission", Key: "business.cmdb.host.permission.view", Value: "查看主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "menu", Key: "business.cmdb.host.title", Value: "主机管理"},
	{Module: "business.cmdb.host", Locale: "zh-CN", Group: "menu", Key: "business.cmdb.title", Value: "CMDB"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "audit", Key: "business.cmdb.host.audit.create", Value: "Create host"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "audit", Key: "business.cmdb.host.audit.delete", Value: "Delete host"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "audit", Key: "business.cmdb.host.audit.update", Value: "Update host"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.arch.label", Value: "Arch"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.arch.placeholder", Value: "Enter architecture"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.clusterName.label", Value: "Cluster name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.clusterName.placeholder", Value: "Enter cluster name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.displayName.label", Value: "Display name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.displayName.placeholder", Value: "Enter display name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.environment.label", Value: "Environment"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.environment.option.dev", Value: "dev"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.environment.option.prod", Value: "prod"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.environment.option.staging", Value: "staging"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.environment.option.test", Value: "test"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.environment.placeholder", Value: "Select environment"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.hostCode.label", Value: "Host code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.hostCode.placeholder", Value: "Enter host code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.hostname.label", Value: "Hostname"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.hostname.placeholder", Value: "Enter hostname"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.idcCode.label", Value: "IDC code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.idcCode.placeholder", Value: "Enter IDC code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.ipAddress.label", Value: "IP address"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.ipAddress.placeholder", Value: "Enter IP address"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.kernelVersion.label", Value: "Kernel version"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.kernelVersion.placeholder", Value: "Enter kernel version"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.lastCheckInAt.label", Value: "Last check-in time"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.lastInventoryAt.label", Value: "Last inventory time"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.lastOperatedAt.label", Value: "Last operated time"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.lifecycleStatus.label", Value: "Lifecycle status"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.lifecycleStatus.placeholder", Value: "Enter lifecycle status"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.maintainerTeam.label", Value: "Maintainer team"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.maintainerTeam.placeholder", Value: "Enter maintainer team"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.osFamily.label", Value: "OS family"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.osFamily.placeholder", Value: "Enter OS family"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.osName.label", Value: "OS name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.osName.placeholder", Value: "Enter OS name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.ownerName.label", Value: "Owner name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.ownerName.placeholder", Value: "Enter owner name"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.ownerUserId.label", Value: "Owner user ID"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.provider.label", Value: "Provider"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.provider.placeholder", Value: "Enter provider"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.purpose.label", Value: "Purpose"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.purpose.placeholder", Value: "Enter purpose"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.regionCode.label", Value: "Region code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.regionCode.placeholder", Value: "Enter region code"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.remark.label", Value: "Remark"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.remark.placeholder", Value: "Enter remark"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.sshPort.label", Value: "SSH port"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "field", Key: "business.cmdb.host.field.status.label", Value: "Status"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.status.option.active", Value: "active"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "option", Key: "business.cmdb.host.field.status.option.inactive", Value: "inactive"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "placeholder", Key: "business.cmdb.host.field.status.placeholder", Value: "Select status"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.create", Value: "Create hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.delete", Value: "Delete hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.export", Value: "Export hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.import", Value: "Import hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.update", Value: "Update hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "permission", Key: "business.cmdb.host.permission.view", Value: "View hosts"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "menu", Key: "business.cmdb.host.title", Value: "Host Management"},
	{Module: "business.cmdb.host", Locale: "en-US", Group: "menu", Key: "business.cmdb.title", Value: "CMDB"},
}

func InitCmdbHostModule(r *gin.RouterGroup, db *gorm.DB) {
	service := NewCmdbHostService(db)
	handler := NewCmdbHostHandler(service)

	contracts.RegisterBackendModules(r, db, contracts.FuncModule{
		ModuleName:    "business.cmdb.host",
		MigrateFunc:   func(_ *gorm.DB) error { return service.Migrate() },
		SeedMenusFunc: seedCmdbHostMenus,
		SeedI18nFunc:  seedCmdbHostI18n,
		Register: func(r *gin.RouterGroup) {
			protected := r.Group("/business/cmdb/host").Use(middleware.JWTAuthMiddleware()).Use(middleware.DataScopeMiddleware(db)).Use(middleware.CasbinMiddleware())
			{
				protected.GET("/list", handler.GetCmdbHostList)
				protected.GET("/:id", handler.GetCmdbHostDetail)
				protected.POST("", handler.CreateCmdbHost)
				protected.PUT("/:id", handler.UpdateCmdbHost)
				protected.DELETE("/:id", handler.DeleteCmdbHost)
			}
		},
	})
}

func seedCmdbHostMenus(db *gorm.DB) error {
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

func seedCmdbHostI18n(db *gorm.DB) error {
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
