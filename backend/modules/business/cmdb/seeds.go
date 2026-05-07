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

func seedHostPermissions(db *gorm.DB) error { return nil }

func seedGroupMenus(db *gorm.DB) error     { return nil }
func seedGroupPermissions(db *gorm.DB) error { return nil }

func seedHostI18n(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	i18nEntries := []map[string]interface{}{
		{"module": "operations", "group_name": "messages", "key": "operations.menu", "locale": "zh-CN", "value": "运维平台", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations", "group_name": "messages", "key": "operations.menu", "locale": "en-US", "value": "Operations", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.menu", "locale": "zh-CN", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.menu", "locale": "en-US", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.host.menu", "locale": "zh-CN", "value": "主机管理", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.host.menu", "locale": "en-US", "value": "Host Management", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.group.menu", "locale": "zh-CN", "value": "主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "operations.cmdb", "group_name": "messages", "key": "operations.cmdb.group.menu", "locale": "en-US", "value": "Host Groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
	}
	return seedRecords(db, "system_i18n", i18nEntries)
}

func seedGroupI18n(db *gorm.DB) error { return nil }

func seedCmdbDicts(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	dictTypes := []map[string]interface{}{
		{"dict_code": "cmdb_host_status", "dict_name": "主机状态", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_os_type", "dict_name": "操作系统类型", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
		{"dict_code": "cmdb_label_key", "dict_name": "预置标签键", "status": 1, "created_at": time.Now(), "updated_at": time.Now()},
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

func seedRecords(db *gorm.DB, table string, records []map[string]interface{}) error {
	for _, record := range records {
		var count int64
		switch table {
		case "system_menu":
			db.Table(table).Where("name = ?", record["name"]).Count(&count)
		case "system_i18n":
			db.Table(table).Where("module = ? AND `key` = ? AND locale = ?",
				record["module"], record["key"], record["locale"]).Count(&count)
		}
		if count == 0 {
			if err := db.Table(table).Create(record).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
