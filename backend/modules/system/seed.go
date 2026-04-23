package system

import (
	"strings"

	"gorm.io/gorm"
)

type menuSeed struct {
	Key        string
	ParentKey  string
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
	IsCache    int
	IsExternal int
	ActiveMenu string
}

func seedAuditModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), auditMenuSeeds()...))
}

func seedMenuModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), coreMenuSeeds()...))
}

func seedDeptModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), deptMenuSeeds()...))
}

func seedPostModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), postMenuSeeds()...))
}

func seedPermissionModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), permissionMenuSeeds()...))
}

func seedSettingModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), settingMenuSeeds()...))
}

func seedDictModuleMenus(db *gorm.DB) error {
	return ensureMenuSeeds(db, append(baseMenuGroupSeeds(), dictMenuSeeds()...))
}

func ensureMenuSeeds(db *gorm.DB, seeds []menuSeed) error {
	if db == nil {
		return nil
	}
	for _, seed := range seeds {
		if err := ensureSingleMenuSeed(db, seed); err != nil {
			return err
		}
	}
	return cleanupActionMenuRoleBindings(db)
}

func baseMenuGroupSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "access",
			TitleKey:  "system.menu.access",
			Path:      "/system/access",
			Type:      "M",
			Icon:      "apps",
			Module:    "system.iam",
			RouteName: "system-access",
			Sort:      20,
		},
		{
			Key:       "org",
			TitleKey:  "system.menu.org",
			Path:      "/system/org",
			Type:      "M",
			Icon:      "storage",
			Module:    "system.org",
			RouteName: "system-org",
			Sort:      30,
		},
		{
			Key:       "config",
			TitleKey:  "system.menu.config",
			Path:      "/system/config",
			Type:      "M",
			Icon:      "settings",
			Module:    "system.config",
			RouteName: "system-config",
			Sort:      40,
		},
		{
			Key:       "security",
			TitleKey:  "system.menu.security",
			Path:      "/system/security",
			Type:      "M",
			Icon:      "safe",
			Module:    "system.auth",
			RouteName: "system-security",
			Sort:      50,
		},
	}
}

func coreMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "dashboard",
			TitleKey:  "system.menu.dashboard",
			Path:      "/dashboard",
			Component: "dashboard",
			PagePerm:  "platform:dashboard:view",
			Type:      "C",
			Icon:      "dashboard",
			RouteName: "dashboard",
			Module:    "platform",
			Sort:      10,
		},
		{
			Key:       "user",
			ParentKey: "access",
			TitleKey:  "system.menu.user",
			Path:      "/system/user",
			Component: "system/user/UserList",
			PagePerm:  "system:user:list",
			Perms:     "",
			Type:      "C",
			Icon:      "user",
			RouteName: "system-user",
			Module:    "system.iam",
			Sort:      10,
		},
		{
			Key:       "role",
			ParentKey: "access",
			TitleKey:  "system.menu.role",
			Path:      "/system/role",
			Component: "system/role/RoleList",
			PagePerm:  "system:role:list",
			Perms:     "",
			Type:      "C",
			Icon:      "safe",
			RouteName: "system-role",
			Module:    "system.iam",
			Sort:      20,
		},
		{
			Key:       "menu",
			ParentKey: "access",
			TitleKey:  "system.menu.menu",
			Path:      "/system/menu",
			Component: "system/menu/MenuList",
			PagePerm:  "system:menu:list",
			Perms:     "",
			Type:      "C",
			Icon:      "menu",
			RouteName: "system-menu",
			Module:    "system.iam",
			Sort:      40,
		},
	}
}

func deptMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "dept",
			ParentKey: "org",
			TitleKey:  "system.menu.dept",
			Path:      "/system/dept",
			Component: "system/dept/DeptList",
			PagePerm:  "system:dept:list",
			Perms:     "",
			Type:      "C",
			Icon:      "storage",
			RouteName: "system-dept",
			Module:    "system.org",
			Sort:      10,
		},
		{Key: "dept-create", ParentKey: "dept", TitleKey: "system.permission.dept.create", Perms: "system:dept:create", Type: "F", Sort: 1},
		{Key: "dept-update", ParentKey: "dept", TitleKey: "system.permission.dept.update", Perms: "system:dept:update", Type: "F", Sort: 2},
		{Key: "dept-delete", ParentKey: "dept", TitleKey: "system.permission.dept.delete", Perms: "system:dept:delete", Type: "F", Sort: 3},
		{Key: "dept-export", ParentKey: "dept", TitleKey: "system.permission.dept.export", Perms: "system:dept:export", Type: "F", Sort: 4},
		{Key: "dept-import", ParentKey: "dept", TitleKey: "system.permission.dept.import", Perms: "system:dept:import", Type: "F", Sort: 5},
		{Key: "dept-batch-update", ParentKey: "dept", TitleKey: "system.permission.dept.batch_update", Perms: "system:dept:batch-update", Type: "F", Sort: 6},
	}
}

func postMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "post",
			ParentKey: "org",
			TitleKey:  "system.menu.post",
			Path:      "/system/post",
			Component: "system/post/PostList",
			PagePerm:  "system:post:list",
			Perms:     "",
			Type:      "C",
			Icon:      "storage",
			RouteName: "system-post",
			Module:    "system.org",
			Sort:      20,
		},
		{Key: "post-create", ParentKey: "post", TitleKey: "system.permission.post.create", Perms: "system:post:create", Type: "F", Sort: 1},
		{Key: "post-update", ParentKey: "post", TitleKey: "system.permission.post.update", Perms: "system:post:update", Type: "F", Sort: 2},
		{Key: "post-delete", ParentKey: "post", TitleKey: "system.permission.post.delete", Perms: "system:post:delete", Type: "F", Sort: 3},
		{Key: "post-export", ParentKey: "post", TitleKey: "system.permission.post.export", Perms: "system:post:export", Type: "F", Sort: 4},
		{Key: "post-import", ParentKey: "post", TitleKey: "system.permission.post.import", Perms: "system:post:import", Type: "F", Sort: 5},
		{Key: "post-batch-update", ParentKey: "post", TitleKey: "system.permission.post.batch_update", Perms: "system:post:batch-update", Type: "F", Sort: 6},
	}
}

func permissionMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "permission",
			ParentKey: "access",
			TitleKey:  "system.menu.permission",
			Path:      "/system/permission",
			Component: "system/permission/PermissionList",
			PagePerm:  "system:permission:list",
			Perms:     "",
			Type:      "C",
			Icon:      "safe",
			RouteName: "system-permission",
			Module:    "system.iam",
			Sort:      30,
		},
		{Key: "user-view", ParentKey: "user", TitleKey: "system.permission.user.view", Perms: "system:user:view", Type: "F", Sort: 1},
		{Key: "user-create", ParentKey: "user", TitleKey: "system.permission.user.create", Perms: "system:user:create", Type: "F", Sort: 2},
		{Key: "user-update", ParentKey: "user", TitleKey: "system.permission.user.update", Perms: "system:user:update", Type: "F", Sort: 3},
		{Key: "user-delete", ParentKey: "user", TitleKey: "system.permission.user.delete", Perms: "system:user:delete", Type: "F", Sort: 4},
		{Key: "user-reset", ParentKey: "user", TitleKey: "system.permission.user.reset", Perms: "system:user:reset", Type: "F", Sort: 5},
		{Key: "user-export", ParentKey: "user", TitleKey: "system.permission.user.export", Perms: "system:user:export", Type: "F", Sort: 6},
		{Key: "user-import", ParentKey: "user", TitleKey: "system.permission.user.import", Perms: "system:user:import", Type: "F", Sort: 7},
		{Key: "user-batch-update", ParentKey: "user", TitleKey: "system.permission.user.batch_update", Perms: "system:user:batch-update", Type: "F", Sort: 8},
		{Key: "role-create", ParentKey: "role", TitleKey: "system.permission.role.create", Perms: "system:role:create", Type: "F", Sort: 1},
		{Key: "role-update", ParentKey: "role", TitleKey: "system.permission.role.update", Perms: "system:role:update", Type: "F", Sort: 2},
		{Key: "role-delete", ParentKey: "role", TitleKey: "system.permission.role.delete", Perms: "system:role:delete", Type: "F", Sort: 3},
		{Key: "role-batch-update", ParentKey: "role", TitleKey: "system.permission.role.batch_update", Perms: "system:role:batch-update", Type: "F", Sort: 4},
		{Key: "role-export", ParentKey: "role", TitleKey: "system.permission.role.export", Perms: "system:role:export", Type: "F", Sort: 5},
		{Key: "menu-create", ParentKey: "menu", TitleKey: "system.permission.menu.create", Perms: "system:menu:create", Type: "F", Sort: 1},
		{Key: "menu-update", ParentKey: "menu", TitleKey: "system.permission.menu.update", Perms: "system:menu:update", Type: "F", Sort: 2},
		{Key: "menu-delete", ParentKey: "menu", TitleKey: "system.permission.menu.delete", Perms: "system:menu:delete", Type: "F", Sort: 3},
		{Key: "permission-create", ParentKey: "permission", TitleKey: "system.permission.policy.create", Perms: "system:permission:create", Type: "F", Sort: 1},
		{Key: "permission-update", ParentKey: "permission", TitleKey: "system.permission.policy.update", Perms: "system:permission:update", Type: "F", Sort: 2},
		{Key: "permission-delete", ParentKey: "permission", TitleKey: "system.permission.policy.delete", Perms: "system:permission:delete", Type: "F", Sort: 3},
		{Key: "permission-export", ParentKey: "permission", TitleKey: "system.permission.policy.export", Perms: "system:permission:export", Type: "F", Sort: 4},
		{Key: "permission-import", ParentKey: "permission", TitleKey: "system.permission.policy.import", Perms: "system:permission:import", Type: "F", Sort: 5},
	}
}

func settingMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "setting",
			ParentKey: "config",
			TitleKey:  "system.menu.setting",
			Path:      "/system/setting",
			Component: "system/setting/SettingPage",
			PagePerm:  "system:setting:list",
			Perms:     "",
			Type:      "C",
			Icon:      "settings",
			RouteName: "system-setting",
			Module:    "system.config",
			IsCache:   1,
			Sort:      20,
		},
		{Key: "setting-update", ParentKey: "setting", TitleKey: "system.permission.setting.update", Perms: "system:setting:update", Type: "F", Sort: 1},
		{Key: "setting-refresh", ParentKey: "setting", TitleKey: "system.permission.setting.refresh", Perms: "system:setting:refresh", Type: "F", Sort: 2},
	}
}

func dictMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "dict",
			ParentKey: "config",
			TitleKey:  "system.menu.dict",
			Path:      "/system/dict",
			Component: "system/dict/DictPage",
			PagePerm:  "system:dict:list",
			Perms:     "",
			Type:      "C",
			Icon:      "list",
			RouteName: "system-dict",
			Module:    "system.config",
			IsCache:   1,
			Sort:      10,
		},
		{Key: "dict-create", ParentKey: "dict", TitleKey: "system.permission.dict.create", Perms: "system:dict:create", Type: "F", Sort: 1},
		{Key: "dict-update", ParentKey: "dict", TitleKey: "system.permission.dict.update", Perms: "system:dict:update", Type: "F", Sort: 2},
		{Key: "dict-delete", ParentKey: "dict", TitleKey: "system.permission.dict.delete", Perms: "system:dict:delete", Type: "F", Sort: 3},
		{Key: "dict-refresh", ParentKey: "dict", TitleKey: "system.permission.dict.refresh", Perms: "system:dict:refresh", Type: "F", Sort: 4},
		{Key: "dict-export", ParentKey: "dict", TitleKey: "system.permission.dict.export", Perms: "system:dict:export", Type: "F", Sort: 5},
		{Key: "dict-import", ParentKey: "dict", TitleKey: "system.permission.dict.import", Perms: "system:dict:import", Type: "F", Sort: 6},
	}
}

func auditMenuSeeds() []menuSeed {
	return []menuSeed{
		{
			Key:       "operation-log",
			ParentKey: "security",
			TitleKey:  "system.menu.operationLog",
			Path:      "/system/operation-log",
			Component: "system/audit/OperationLogList",
			PagePerm:  "system:operation-log:list",
			Perms:     "",
			Type:      "C",
			Icon:      "safe",
			RouteName: "system-operation-log",
			Module:    "system.audit",
			Sort:      30,
		},
		{Key: "operation-log-delete", ParentKey: "operation-log", TitleKey: "system.permission.operation_log.delete", Perms: "system:operation-log:delete", Type: "F", Sort: 1},
		{Key: "operation-log-clear", ParentKey: "operation-log", TitleKey: "system.permission.operation_log.clear", Perms: "system:operation-log:clear", Type: "F", Sort: 2},
		{Key: "operation-log-export", ParentKey: "operation-log", TitleKey: "system.permission.operation_log.export", Perms: "system:operation-log:export", Type: "F", Sort: 3},
	}
}

func ensureSingleMenuSeed(db *gorm.DB, seed menuSeed) error {
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

	parentID, err := resolveMenuParentID(db, seed.ParentKey)
	if err != nil {
		return err
	}
	if menuID == 0 {
		payload := map[string]interface{}{
			"parent_id":   parentID,
			"title_key":   seed.TitleKey,
			"path":        seed.Path,
			"component":   seed.Component,
			"page_perm":   seed.PagePerm,
			"perms":       seed.Perms,
			"type":        normalizeSeedMenuType(seed.Type),
			"icon":        seed.Icon,
			"route_name":  strings.TrimSpace(seed.RouteName),
			"module":      normalizeSeedMenuModule(seed.Module),
			"sort":        seed.Sort,
			"is_visible":  1,
			"is_cache":    normalizeSeedMenuFlag(seed.IsCache),
			"is_external": normalizeSeedMenuFlag(seed.IsExternal),
			"active_menu": strings.TrimSpace(seed.ActiveMenu),
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
			"parent_id":   parentID,
			"title_key":   seed.TitleKey,
			"component":   seed.Component,
			"page_perm":   seed.PagePerm,
			"icon":        seed.Icon,
			"route_name":  strings.TrimSpace(seed.RouteName),
			"module":      normalizeSeedMenuModule(seed.Module),
			"sort":        seed.Sort,
			"type":        normalizeSeedMenuType(seed.Type),
			"is_visible":  1,
			"is_cache":    normalizeSeedMenuFlag(seed.IsCache),
			"is_external": normalizeSeedMenuFlag(seed.IsExternal),
			"active_menu": strings.TrimSpace(seed.ActiveMenu),
		}
		updates["path"] = seed.Path
		updates["perms"] = seed.Perms
		if err := db.Table("system_menu").Where("id = ?", menuID).Updates(updates).Error; err != nil {
			return err
		}
	}

	if menuID == 0 {
		return nil
	}

	var adminRoleID uint64
	if err := db.Table("system_role").Select("id").Where("role_key = ?", "admin").Limit(1).Pluck("id", &adminRoleID).Error; err != nil {
		return err
	}
	if adminRoleID == 0 {
		return nil
	}

	if normalizeSeedMenuType(seed.Type) != "F" {
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
	if err := ensureAdminPermissionSeed(db, adminRoleID, seed.PagePerm); err != nil {
		return err
	}
	if err := ensureAdminPermissionSeed(db, adminRoleID, seed.Perms); err != nil {
		return err
	}
	return nil
}

func ensureAdminPermissionSeed(db *gorm.DB, adminRoleID uint64, permissionKey string) error {
	permissionKey = strings.TrimSpace(permissionKey)
	if permissionKey == "" {
		return nil
	}
	var count int64
	if err := db.Table("system_role_permission").
		Where("role_id = ? AND permission_key = ?", adminRoleID, permissionKey).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	return db.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (?, ?)", adminRoleID, permissionKey).Error
}

func cleanupActionMenuRoleBindings(db *gorm.DB) error {
	return db.Exec(`
DELETE FROM system_role_menu
WHERE menu_id IN (
	SELECT id FROM system_menu WHERE type = 'F'
)`).Error
}

func resolveMenuParentID(db *gorm.DB, parentKey string) (uint64, error) {
	if parentKey == "" {
		return 0, nil
	}
	parentPaths := map[string]string{
		"access":        "/system/access",
		"org":           "/system/org",
		"config":        "/system/config",
		"security":      "/system/security",
		"user":          "/system/user",
		"role":          "/system/role",
		"menu":          "/system/menu",
		"dept":          "/system/dept",
		"post":          "/system/post",
		"permission":    "/system/permission",
		"login-log":     "/system/login-log",
		"session":       "/system/session",
		"setting":       "/system/setting",
		"dict":          "/system/dict",
		"operation-log": "/system/operation-log",
	}
	parentPath, ok := parentPaths[parentKey]
	if !ok {
		return 0, nil
	}
	return lookupMenuIDByPath(db, parentPath)
}

func lookupMenuIDByPath(db *gorm.DB, path string) (uint64, error) {
	var menuID uint64
	if err := db.Table("system_menu").Select("id").Where("path = ?", path).Limit(1).Pluck("id", &menuID).Error; err != nil {
		return 0, err
	}
	return menuID, nil
}

func normalizeSeedMenuType(value string) string {
	switch value {
	case "M", "C", "F":
		return value
	default:
		return "C"
	}
}

func normalizeSeedMenuModule(value string) string {
	if strings.TrimSpace(value) == "" {
		return "system"
	}
	return strings.TrimSpace(value)
}

func normalizeSeedMenuFlag(value int) int {
	if value == 1 {
		return 1
	}
	return 0
}
