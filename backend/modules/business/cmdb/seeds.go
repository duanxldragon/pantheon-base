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
	Component  string
	PagePerm   string
	Type       string
	Icon       string
	RouteName  string
	Module     string
	Sort       int
	IsCache    int
}

func hostMenuSeeds() []cmdbMenuSeed {
	return []cmdbMenuSeed{
		{
			Key:       "operations-cmdb-host",
			ParentKey: "operations-cmdb",
			TitleKey:  "operations.cmdb.host.menu",
			Path:      "/operations/cmdb/host",
			Component:  "business/cmdb/host/CmdbHostList",
			PagePerm:   "business:cmdb:host:list",
			Type:      "C",
			Module:    "business.cmdb",
			RouteName: "cmdb-host-list",
			Sort:      1,
		},
		{
			Key:       "operations-cmdb-group",
			ParentKey: "operations-cmdb",
			TitleKey:  "operations.cmdb.group.menu",
			Path:      "/operations/cmdb/group",
			Component:  "business/cmdb/group/CmdbGroupList",
			PagePerm:   "business:cmdb:group:list",
			Type:      "C",
			Module:    "business.cmdb",
			RouteName: "cmdb-group-list",
			Sort:      2,
		},
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

func seedGroupMenus(db *gorm.DB) error     { return nil }
func seedGroupPermissions(db *gorm.DB) error { return nil }

func ensureCmdbMenuSeeds(db *gorm.DB, seeds []cmdbMenuSeed) error {
	for _, seed := range seeds {
		var menuID uint64
		if seed.Path != "" {
			if err := db.Table("system_menu").Select("id").Where("path = ?", seed.Path).Limit(1).Pluck("id", &menuID).Error; err != nil {
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

func seedHostI18n(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	i18nEntries := []map[string]interface{}{
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.menu", "locale": "zh-CN", "value": "运维平台", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.menu", "locale": "en-US", "value": "Operations", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.menu", "locale": "zh-CN", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.menu", "locale": "en-US", "value": "CMDB", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.host.menu", "locale": "zh-CN", "value": "主机管理", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.host.menu", "locale": "en-US", "value": "Host Management", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.group.menu", "locale": "zh-CN", "value": "主机分组", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
		{"module": "business.cmdb", "group_name": "messages", "key": "operations.cmdb.group.menu", "locale": "en-US", "value": "Host Groups", "lifecycle_status": "active", "created_at": time.Now(), "updated_at": time.Now()},
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
		var count int64
		db.Table(table).Where("module = ? AND `key` = ? AND locale = ?",
			record["module"], record["key"], record["locale"]).Count(&count)
		if count == 0 {
			if err := db.Table(table).Create(record).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
