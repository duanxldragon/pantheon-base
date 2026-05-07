package cmdb

import (
	"time"

	"gorm.io/gorm"
)

func seedHostMenus(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	if err := seedCmdbDicts(db); err != nil {
		return err
	}
	menus := []map[string]interface{}{
		{
			"path":       "/operations",
			"name":       "operations",
			"title_key":  "operations.menu",
			"component":  "",
			"type":       "D",
			"module":     "operations",
			"sort":       50,
			"is_visible": 1,
			"is_cache":   0,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		{
			"path":        "/operations/cmdb",
			"name":        "cmdb",
			"title_key":   "operations.cmdb.menu",
			"component":   "",
			"type":        "M",
			"module":      "operations.cmdb",
			"sort":        1,
			"parent_path": "/operations",
			"is_visible":  1,
			"is_cache":    0,
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"path":        "/operations/cmdb/host",
			"name":        "cmdb-host-list",
			"title_key":   "operations.cmdb.host.menu",
			"component":   "business/cmdb/host/CmdbHostList",
			"type":        "C",
			"module":      "operations.cmdb",
			"sort":        1,
			"parent_path": "/operations/cmdb",
			"page_perm":   "business:cmdb:host:list",
			"is_visible":  1,
			"is_cache":    0,
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"path":        "/operations/cmdb/group",
			"name":        "cmdb-group-list",
			"title_key":   "operations.cmdb.group.menu",
			"component":   "business/cmdb/group/CmdbGroupList",
			"type":        "C",
			"module":      "operations.cmdb",
			"sort":        2,
			"parent_path": "/operations/cmdb",
			"page_perm":   "business:cmdb:group:list",
			"is_visible":  1,
			"is_cache":    0,
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
	}
	return seedRecords(db, "system_menu", menus)
}

func seedHostPermissions(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	perms := []map[string]interface{}{
		{"permission_key": "business:cmdb:host:list", "module": "business.cmdb", "description": "主机列表"},
		{"permission_key": "business:cmdb:host:detail", "module": "business.cmdb", "description": "主机详情"},
		{"permission_key": "business:cmdb:host:create", "module": "business.cmdb", "description": "新增主机"},
		{"permission_key": "business:cmdb:host:update", "module": "business.cmdb", "description": "编辑主机"},
		{"permission_key": "business:cmdb:host:delete", "module": "business.cmdb", "description": "删除主机"},
		{"permission_key": "business:cmdb:host:collect", "module": "business.cmdb", "description": "SSH采集"},
		{"permission_key": "business:cmdb:host:status", "module": "business.cmdb", "description": "更新状态"},
		{"permission_key": "business:cmdb:group:list", "module": "business.cmdb", "description": "分组列表"},
		{"permission_key": "business:cmdb:group:detail", "module": "business.cmdb", "description": "分组详情"},
		{"permission_key": "business:cmdb:group:create", "module": "business.cmdb", "description": "新增分组"},
		{"permission_key": "business:cmdb:group:update", "module": "business.cmdb", "description": "编辑分组"},
		{"permission_key": "business:cmdb:group:delete", "module": "business.cmdb", "description": "删除分组"},
	}
	for _, p := range perms {
		p["created_at"] = time.Now()
		p["updated_at"] = time.Now()
	}
	return seedRecords(db, "system_permission", perms)
}

func seedGroupMenus(db *gorm.DB) error   { return nil }
func seedGroupPermissions(db *gorm.DB) error { return nil }

func seedHostI18n(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	i18nEntries := []map[string]interface{}{
		{"module": "operations", "locale": "zh-CN", "i18n_key": "operations.menu", "i18n_value": "运维平台", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations", "locale": "en-US", "i18n_key": "operations.menu", "i18n_value": "Operations", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "zh-CN", "i18n_key": "operations.cmdb.menu", "i18n_value": "CMDB", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "en-US", "i18n_key": "operations.cmdb.menu", "i18n_value": "CMDB", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "zh-CN", "i18n_key": "operations.cmdb.host.menu", "i18n_value": "主机管理", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "en-US", "i18n_key": "operations.cmdb.host.menu", "i18n_value": "Host Management", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "zh-CN", "i18n_key": "operations.cmdb.group.menu", "i18n_value": "主机分组", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "locale": "en-US", "i18n_key": "operations.cmdb.group.menu", "i18n_value": "Host Groups", "created_at": time.Now(), "updated_at": time.Now()},
	}
	return seedRecords(db, "system_i18n", i18nEntries)
}

func seedGroupI18n(db *gorm.DB) error { return nil }

func seedCmdbDicts(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	dictTypes := []map[string]interface{}{
		{"dict_type": "cmdb_host_status", "dict_name": "主机状态", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_os_type", "dict_name": "操作系统类型", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_name": "预置标签键", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
	}
	for _, dt := range dictTypes {
		var count int64
		db.Table("system_dict_type").Where("dict_type = ?", dt["dict_type"]).Count(&count)
		if count == 0 {
			if err := db.Table("system_dict_type").Create(dt).Error; err != nil {
				return err
			}
		}
	}
	dictItems := []map[string]interface{}{
		{"dict_type": "cmdb_host_status", "dict_label": "待上线", "dict_value": "pending", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_host_status", "dict_label": "在线", "dict_value": "online", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_host_status", "dict_label": "离线", "dict_value": "offline", "sort": 3, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_host_status", "dict_label": "维护中", "dict_value": "maintenance", "sort": 4, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_os_type", "dict_label": "Linux", "dict_value": "linux", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_os_type", "dict_label": "Windows", "dict_value": "windows", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_label": "环境", "dict_value": "env", "sort": 1, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_label": "业务系统", "dict_value": "biz", "sort": 2, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_label": "集群", "dict_value": "cluster", "sort": 3, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_label": "区域", "dict_value": "region", "sort": 4, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_type": "cmdb_label_key", "dict_label": "数据库类型", "dict_value": "db_type", "sort": 5, "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
	}
	for _, di := range dictItems {
		var count int64
		db.Table("system_dict_data").Where("dict_type = ? AND dict_value = ?", di["dict_type"], di["dict_value"]).Count(&count)
		if count == 0 {
			if err := db.Table("system_dict_data").Create(di).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func seedRecords(db *gorm.DB, table string, records []map[string]interface{}) error {
	for _, record := range records {
		var count int64
		switch table {
		case "system_menu":
			db.Table(table).Where("name = ?", record["name"]).Count(&count)
		case "system_permission":
			db.Table(table).Where("permission_key = ?", record["permission_key"]).Count(&count)
		case "system_i18n":
			db.Table(table).Where("module = ? AND i18n_key = ? AND locale = ?",
				record["module"], record["i18n_key"], record["locale"]).Count(&count)
		}
		if count == 0 {
			if err := db.Table(table).Create(record).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
