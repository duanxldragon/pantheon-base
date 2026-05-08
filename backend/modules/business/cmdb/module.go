package cmdb

import (
	"time"

	"gorm.io/gorm"
)

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
	IsCache   int
}

func hostMenuSeeds() []cmdbMenuSeed {
	return []cmdbMenuSeed{
		{
			Key:       "operations-cmdb-host",
			ParentKey: "cmdb",
			TitleKey:  "operations.cmdb.host.menu",
			Path:      "/operations/cmdb/host",
			Component: "business/cmdb/host/CmdbHostList",
			PagePerm:  "business:cmdb:host:list",
			Type:      "C",
			Module:    "business.cmdb",
			RouteName: "cmdb-host-list",
			Sort:      1,
		},
		{Key: "operations-cmdb-host-detail", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.detail", Perms: "business:cmdb:host:detail", Type: "F", Module: "business.cmdb", Sort: 1},
		{Key: "operations-cmdb-host-create", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.create", Perms: "business:cmdb:host:create", Type: "F", Module: "business.cmdb", Sort: 2},
		{Key: "operations-cmdb-host-update", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.update", Perms: "business:cmdb:host:update", Type: "F", Module: "business.cmdb", Sort: 3},
		{Key: "operations-cmdb-host-delete", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.delete", Perms: "business:cmdb:host:delete", Type: "F", Module: "business.cmdb", Sort: 4},
		{Key: "operations-cmdb-host-collect", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.collect", Perms: "business:cmdb:host:collect", Type: "F", Module: "business.cmdb", Sort: 5},
		{Key: "operations-cmdb-host-status", ParentKey: "cmdb-host-list", TitleKey: "business.cmdb.host.permission.status", Perms: "business:cmdb:host:status", Type: "F", Module: "business.cmdb", Sort: 6},
		{
			Key:       "operations-cmdb-group",
			ParentKey: "cmdb",
			TitleKey:  "operations.cmdb.group.menu",
			Path:      "/operations/cmdb/group",
			Component: "business/cmdb/group/CmdbGroupList",
			PagePerm:  "business:cmdb:group:list",
			Type:      "C",
			Module:    "business.cmdb",
			RouteName: "cmdb-group-list",
			Sort:      2,
		},
		{Key: "operations-cmdb-group-detail", ParentKey: "cmdb-group-list", TitleKey: "business.cmdb.group.permission.detail", Perms: "business:cmdb:group:detail", Type: "F", Module: "business.cmdb", Sort: 1},
		{Key: "operations-cmdb-group-create", ParentKey: "cmdb-group-list", TitleKey: "business.cmdb.group.permission.create", Perms: "business:cmdb:group:create", Type: "F", Module: "business.cmdb", Sort: 2},
		{Key: "operations-cmdb-group-update", ParentKey: "cmdb-group-list", TitleKey: "business.cmdb.group.permission.update", Perms: "business:cmdb:group:update", Type: "F", Module: "business.cmdb", Sort: 3},
		{Key: "operations-cmdb-group-delete", ParentKey: "cmdb-group-list", TitleKey: "business.cmdb.group.permission.delete", Perms: "business:cmdb:group:delete", Type: "F", Module: "business.cmdb", Sort: 4},
	}
}

func topLevelMenuSeeds() []cmdbMenuSeed {
	return []cmdbMenuSeed{
		{
			Key:       "operations",
			TitleKey:  "operations.menu",
			Path:      "/operations",
			Type:      "D",
			Module:    "business.cmdb",
			Icon:      "desktop",
			RouteName: "operations",
			Sort:      50,
		},
		{
			Key:       "operations-cmdb",
			ParentKey: "operations",
			TitleKey:  "operations.cmdb.menu",
			Path:      "/operations/cmdb",
			Type:      "M",
			Module:    "business.cmdb",
			Icon:      "storage",
			RouteName: "cmdb",
			Sort:      1,
		},
	}
}

func seedHostMenus(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	if err := seedCmdbDicts(db); err != nil {
		return err
	}
	return ensureCmdbMenuSeeds(db, append(topLevelMenuSeeds(), hostMenuSeeds()...))
}

func seedHostPermissions(db *gorm.DB) error { return nil }

func seedGroupMenus(db *gorm.DB) error       { return nil }
func seedGroupPermissions(db *gorm.DB) error { return nil }

func ensureCmdbMenuSeeds(db *gorm.DB, seeds []cmdbMenuSeed) error {
	for _, seed := range seeds {
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
		parentID, err := resolveCmdbMenuParentID(db, seed.ParentKey)
		if err != nil {
			return err
		}
		if menuID == 0 {
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
				"is_cache":   0,
				"created_at": time.Now(),
				"updated_at": time.Now(),
			}
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
		} else {
			updates := map[string]interface{}{
				"parent_id":  parentID,
				"title_key":  seed.TitleKey,
				"component":  seed.Component,
				"page_perm":  seed.PagePerm,
				"perms":      seed.Perms,
				"type":       seed.Type,
				"icon":       seed.Icon,
				"route_name": seed.RouteName,
				"module":     seed.Module,
				"sort":       seed.Sort,
				"is_visible": 1,
				"is_cache":   0,
				"updated_at": time.Now(),
			}
			updates["path"] = seed.Path
			if err := db.Table("system_menu").Where("id = ?", menuID).Updates(updates).Error; err != nil {
				return err
			}
		}
		if err := ensureCmdbAdminBindings(db, menuID, seed); err != nil {
			return err
		}
	}
	return nil
}

func resolveCmdbMenuParentID(db *gorm.DB, parentKey string) (uint64, error) {
	if parentKey == "" {
		return 0, nil
	}
	var parentID uint64
	if err := db.Table("system_menu").Select("id").Where("route_name = ?", parentKey).Limit(1).Pluck("id", &parentID).Error; err != nil {
		return 0, err
	}
	return parentID, nil
}

func ensureCmdbAdminBindings(db *gorm.DB, menuID uint64, seed cmdbMenuSeed) error {
	if menuID == 0 || !db.Migrator().HasTable("system_role") {
		return nil
	}
	var adminRoleID uint64
	if err := db.Table("system_role").Select("id").Where("role_key = ?", "admin").Limit(1).Pluck("id", &adminRoleID).Error; err != nil {
		return err
	}
	if adminRoleID == 0 {
		return nil
	}
	if seed.Type != "F" && db.Migrator().HasTable("system_role_menu") {
		var count int64
		if err := db.Table("system_role_menu").Where("role_id = ? AND menu_id = ?", adminRoleID, menuID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := db.Exec("INSERT INTO system_role_menu (role_id, menu_id) VALUES (?, ?)", adminRoleID, menuID).Error; err != nil {
				return err
			}
		}
	}
	if err := ensureCmdbAdminPermission(db, adminRoleID, seed.PagePerm); err != nil {
		return err
	}
	return ensureCmdbAdminPermission(db, adminRoleID, seed.Perms)
}

func ensureCmdbAdminPermission(db *gorm.DB, adminRoleID uint64, permissionKey string) error {
	if permissionKey == "" || !db.Migrator().HasTable("system_role_permission") {
		return nil
	}
	var count int64
	if err := db.Table("system_role_permission").Where("role_id = ? AND permission_key = ?", adminRoleID, permissionKey).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	return db.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (?, ?)", adminRoleID, permissionKey).Error
}

func seedHostI18n(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	i18nEntries := []map[string]interface{}{
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "operations.menu", "value": "运维平台", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "operations.menu", "value": "Operations", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "operations.cmdb.menu", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "operations.cmdb.menu", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "operations.cmdb.host.menu", "value": "主机管理", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "operations.cmdb.host.menu", "value": "Host Management", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "operations.cmdb.host.detail", "value": "主机详情", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "operations.cmdb.host.detail", "value": "Host Detail", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "operations.cmdb.group.menu", "value": "主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "operations.cmdb.group.menu", "value": "Host Groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.title", "value": "主机管理", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.title", "value": "Host Management", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.eyebrow", "value": "运维平台 / 主机台账", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.eyebrow", "value": "Operations / Host Inventory", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.title", "value": "在统一视图中管理主机、标签与配置采集", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.title", "value": "Manage hosts, labels, and collection in one view", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.total", "value": "主机总数", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.total", "value": "Total Hosts", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.totalHint", "value": "当前筛选条件下的主机总量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.totalHint", "value": "Total hosts under the current filter.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.online", "value": "在线主机", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.online", "value": "Online Hosts", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.onlineHint", "value": "状态为在线的主机数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.onlineHint", "value": "Hosts whose status is online.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.maintenance", "value": "维护中", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.maintenance", "value": "Under Maintenance", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.maintenanceHint", "value": "状态为维护中的主机数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.maintenanceHint", "value": "Hosts whose status is maintenance.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.scope", "value": "数据范围", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.scope", "value": "Data Scope", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.scopeValue", "value": "按当前登录主体可见数据", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.scopeValue", "value": "Visible to the current login context", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.scopeHint", "value": "主机列表和详情遵循系统域数据范围。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.scopeHint", "value": "Host lists and details follow the system data scope.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.statusHint", "value": "当前主机状态。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.statusHint", "value": "Current host status.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.osHint", "value": "当前操作系统类型。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.osHint", "value": "Current operating system type.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.labelsHint", "value": "当前主机标签数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.labelsHint", "value": "Current host label count.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.hero.componentsHint", "value": "当前主机已装组件数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.hero.componentsHint", "value": "Installed component count on the current host.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.collectSshUserPlaceholder", "value": "root", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.collectSshUserPlaceholder", "value": "root", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.host.collectPrivateKeyPlaceholder", "value": "-----BEGIN OPENSSH PRIVATE KEY-----", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.host.collectPrivateKeyPlaceholder", "value": "-----BEGIN OPENSSH PRIVATE KEY-----", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "business.cmdb.host.os.linux", "value": "Linux", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "business.cmdb.host.os.linux", "value": "Linux", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "business.cmdb.host.os.windows", "value": "Windows", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "business.cmdb.host.os.windows", "value": "Windows", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "menu", "key": "business.cmdb.host.status.maintenance", "value": "维护中", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "menu", "key": "business.cmdb.host.status.maintenance", "value": "Maintenance", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.eyebrow", "value": "运维平台 / 主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.eyebrow", "value": "Operations / Host Groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.title", "value": "通过标签条件管理可复用的主机集合", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.title", "value": "Manage reusable host sets with label conditions", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.total", "value": "分组总数", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.total", "value": "Total Groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.totalHint", "value": "当前可见的主机分组数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.totalHint", "value": "All visible host groups under the current scope.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.members", "value": "选中分组成员", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.members", "value": "Selected Group Members", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.membersHint", "value": "当前选中分组的成员数量。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.membersHint", "value": "Member count of the selected group.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.scope", "value": "数据范围", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.scope", "value": "Data Scope", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.scopeValue", "value": "按当前登录主体可见数据", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.scopeValue", "value": "Visible to the current login context", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.scopeHint", "value": "成员计算遵循当前请求的数据范围。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.scopeHint", "value": "Member computation follows the current request scope.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.rules", "value": "筛选规则", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.rules", "value": "Filter Rules", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.hero.rulesHint", "value": "当前选中分组的规则条数。", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.hero.rulesHint", "value": "Rule count of the selected group.", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.tree.title", "value": "分组树", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.tree.title", "value": "Group Tree", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "page", "key": "business.cmdb.group.condition.ruleIndex", "value": "条件 {{count}}", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "page", "key": "business.cmdb.group.condition.ruleIndex", "value": "Condition {{count}}", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.detail", "value": "查看主机详情", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.detail", "value": "View host detail", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.create", "value": "新增主机", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.create", "value": "Create hosts", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.update", "value": "编辑主机", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.update", "value": "Update hosts", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.delete", "value": "删除主机", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.delete", "value": "Delete hosts", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.collect", "value": "采集主机配置", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.collect", "value": "Collect host config", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.host.permission.status", "value": "更新主机状态", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.host.permission.status", "value": "Update host status", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.group.permission.detail", "value": "查看主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.group.permission.detail", "value": "View host groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.group.permission.create", "value": "新增主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.group.permission.create", "value": "Create host groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.group.permission.update", "value": "编辑主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.group.permission.update", "value": "Update host groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "zh-CN", "group_name": "permission", "key": "business.cmdb.group.permission.delete", "value": "删除主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "locale": "en-US", "group_name": "permission", "key": "business.cmdb.group.permission.delete", "value": "Delete host groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
	}
	return seedCmdbRecords(db, "system_i18n", i18nEntries)
}

func seedGroupI18n(db *gorm.DB) error { return nil }

func seedCmdbDicts(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	dictTypes := []map[string]interface{}{
		{"dict_code": "cmdb_host_status", "dict_name": "主机状态", "module": "business.cmdb", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_os_type", "dict_name": "操作系统类型", "module": "business.cmdb", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "dict_name": "预置标签键", "module": "business.cmdb", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
	}
	for _, dt := range dictTypes {
		var count int64
		db.Table("system_dict_type").Where("dict_code = ?", dt["dict_code"]).Count(&count)
		if count == 0 {
			if err := db.Table("system_dict_type").Create(dt).Error; err != nil {
				return err
			}
		}
	}
	dictItems := []map[string]interface{}{
		{"dict_code": "cmdb_host_status", "item_label_key": "待上线", "item_value": "pending", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_host_status", "item_label_key": "在线", "item_value": "online", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_host_status", "item_label_key": "离线", "item_value": "offline", "sort": 3, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_host_status", "item_label_key": "维护中", "item_value": "maintenance", "sort": 4, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_os_type", "item_label_key": "Linux", "item_value": "linux", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_os_type", "item_label_key": "Windows", "item_value": "windows", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "item_label_key": "环境", "item_value": "env", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "item_label_key": "业务系统", "item_value": "biz", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "item_label_key": "集群", "item_value": "cluster", "sort": 3, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "item_label_key": "区域", "item_value": "region", "sort": 4, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "item_label_key": "数据库类型", "item_value": "db_type", "sort": 5, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
	}
	for _, di := range dictItems {
		var count int64
		db.Table("system_dict_item").Where("dict_code = ? AND item_value = ?", di["dict_code"], di["item_value"]).Count(&count)
		if count == 0 {
			if err := db.Table("system_dict_item").Create(di).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func seedCmdbRecords(db *gorm.DB, table string, records []map[string]interface{}) error {
	for _, record := range records {
		var existingID uint64
		db.Table(table).Select("id").Where("`key` = ? AND locale = ?",
			record["key"], record["locale"]).Limit(1).Pluck("id", &existingID)
		if existingID > 0 {
			update := map[string]interface{}{
				"value":      record["value"],
				"module":     record["module"],
				"updated_at": record["updated_at"],
			}
			if err := db.Table(table).Where("id = ?", existingID).Updates(update).Error; err != nil {
				return err
			}
		} else {
			if err := db.Table(table).Create(record).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
