package system

import "strings"

var registeredMenuComponentKeys = map[string]struct{}{
	"dashboard":                        {},
	"auth/SecurityCenter":              {},
	"auth/LoginLogList":                {},
	"auth/SessionList":                 {},
	"system/profile/ProfileCenter":     {},
	"system/dict/DictPage":             {},
	"system/dept/DeptList":             {},
	"system/menu/MenuList":             {},
	"system/permission/PermissionList": {},
	"system/post/PostList":             {},
	"system/role/RoleList":             {},
	"system/setting/SettingPage":       {},
	"system/user/UserList":             {},
	"system/user/UserDetail":           {},
	"system/audit/OperationLogList":    {},
	"business/cmdb/CMDBTypeList":       {},
	"business/cmdb/CMDBItemList":       {},
	"business/cmdb/CMDBItemDetail":     {},
}

func isRegisteredMenuComponentKey(value string) bool {
	_, ok := registeredMenuComponentKeys[strings.TrimSpace(value)]
	return ok
}

func requiresRegisteredMenuComponent(module string) bool {
	normalized := strings.TrimSpace(module)
	return normalized == "platform" ||
		strings.HasPrefix(normalized, "system.") ||
		strings.HasPrefix(normalized, "business.")
}
