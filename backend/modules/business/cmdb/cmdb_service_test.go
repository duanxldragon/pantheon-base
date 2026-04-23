package cmdb

import (
	"fmt"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupCMDBTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&BizCMDBType{}, &BizCMDBItem{}, &BizCMDBRelation{}); err != nil {
		t.Fatalf("migrate cmdb: %v", err)
	}
	return db
}

func TestCMDBService_ImportTemplateAndExport(t *testing.T) {
	db := setupCMDBTestDB(t)
	service := NewCMDBService(db)

	typeTemplate := service.BuildTypeImportTemplate()
	if len(typeTemplate.Rows) == 0 || !strings.HasPrefix(typeTemplate.Rows[0][0], "#") {
		t.Fatalf("expected type template instructions, got %+v", typeTemplate.Rows)
	}
	typeTemplateResult, err := service.ImportTypes(append([][]string{typeTemplate.Headers}, typeTemplate.Rows...))
	if err != nil {
		t.Fatalf("import type template comments: %v", err)
	}
	if !typeTemplateResult.Applied || typeTemplateResult.Created != 0 || typeTemplateResult.Failed != 0 {
		t.Fatalf("expected type template comments to be ignored, got %+v", typeTemplateResult)
	}

	typeResult, err := service.ImportTypes([][]string{
		typeTemplate.Headers,
		{"biz_app", "业务应用", "software", "1", "应用类资源"},
	})
	if err != nil {
		t.Fatalf("import types: %v", err)
	}
	if !typeResult.Applied || typeResult.Created != 1 || typeResult.Failed != 0 {
		t.Fatalf("unexpected type import result: %+v", typeResult)
	}

	itemTemplate := service.BuildItemImportTemplate()
	if len(itemTemplate.Rows) == 0 || !strings.HasPrefix(itemTemplate.Rows[0][0], "#") {
		t.Fatalf("expected item template instructions, got %+v", itemTemplate.Rows)
	}
	itemTemplateResult, err := service.ImportItems(append([][]string{itemTemplate.Headers}, itemTemplate.Rows...))
	if err != nil {
		t.Fatalf("import item template comments: %v", err)
	}
	if !itemTemplateResult.Applied || itemTemplateResult.Created != 0 || itemTemplateResult.Failed != 0 {
		t.Fatalf("expected item template comments to be ignored, got %+v", itemTemplateResult)
	}

	itemResult, err := service.ImportItems([][]string{
		itemTemplate.Headers,
		{"biz_app", "app-pantheon-api", "Pantheon API", "prod", "active", "1", "2", "https://api.example.com", "核心业务 API"},
	})
	if err != nil {
		t.Fatalf("import items: %v", err)
	}
	if !itemResult.Applied || itemResult.Created != 1 || itemResult.Failed != 0 {
		t.Fatalf("unexpected item import result: %+v", itemResult)
	}

	exportedTypes, err := service.ExportTypes(&CMDBTypeListQuery{TypeCode: "biz_app"})
	if err != nil {
		t.Fatalf("export types: %v", err)
	}
	if len(exportedTypes.Rows) != 1 || exportedTypes.Rows[0][0] != "biz_app" || exportedTypes.Rows[0][1] != "业务应用" {
		t.Fatalf("unexpected type export rows: %+v", exportedTypes.Rows)
	}

	exportedItems, err := service.ExportItems(&CMDBItemListQuery{ItemCode: "app-pantheon-api"})
	if err != nil {
		t.Fatalf("export items: %v", err)
	}
	if len(exportedItems.Rows) != 1 || exportedItems.Rows[0][0] != "biz_app" || exportedItems.Rows[0][1] != "app-pantheon-api" {
		t.Fatalf("unexpected item export rows: %+v", exportedItems.Rows)
	}
}

func TestSeedCMDBRolePermissions_BackfillsModulePermissions(t *testing.T) {
	db := setupCMDBTestDB(t)

	fixtures := []string{
		"CREATE TABLE IF NOT EXISTS system_role (id INTEGER PRIMARY KEY, role_key TEXT)",
		"CREATE TABLE IF NOT EXISTS system_menu (id INTEGER PRIMARY KEY, module TEXT, page_perm TEXT, perms TEXT)",
		"CREATE TABLE IF NOT EXISTS system_role_menu (role_id INTEGER, menu_id INTEGER)",
		"CREATE TABLE IF NOT EXISTS system_role_permission (role_id INTEGER, permission_key TEXT)",
		"INSERT INTO system_role (id, role_key) VALUES (1, 'admin')",
		"INSERT INTO system_menu (id, module, page_perm, perms) VALUES (11, 'business.cmdb', 'business:cmdb:type:list', '')",
		"INSERT INTO system_menu (id, module, page_perm, perms) VALUES (12, 'business.cmdb', '', 'business:cmdb:type:export')",
		"INSERT INTO system_role_menu (role_id, menu_id) VALUES (1, 11)",
		"INSERT INTO system_role_menu (role_id, menu_id) VALUES (1, 12)",
	}
	for _, statement := range fixtures {
		if err := db.Exec(statement).Error; err != nil {
			t.Fatalf("exec fixture %q: %v", statement, err)
		}
	}

	if err := seedCMDBRolePermissions(db); err != nil {
		t.Fatalf("seed cmdb role permissions: %v", err)
	}
	if err := seedCMDBRolePermissions(db); err != nil {
		t.Fatalf("seed cmdb role permissions idempotent: %v", err)
	}

	type permissionRow struct {
		PermissionKey string `gorm:"column:permission_key"`
	}
	var rows []permissionRow
	if err := db.Table("system_role_permission").Select("permission_key").Order("permission_key asc").Scan(&rows).Error; err != nil {
		t.Fatalf("query role permissions: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 permission rows, got %+v", rows)
	}
	if rows[0].PermissionKey != "business:cmdb:type:export" || rows[1].PermissionKey != "business:cmdb:type:list" {
		t.Fatalf("unexpected permission keys: %+v", rows)
	}
}

func TestCMDBService_ItemDetailAndRelations(t *testing.T) {
	db := setupCMDBTestDB(t)
	if err := db.AutoMigrate(&BizCMDBRelation{}); err != nil {
		t.Fatalf("migrate cmdb relation: %v", err)
	}
	if err := db.Exec("CREATE TABLE IF NOT EXISTS system_dept (id INTEGER PRIMARY KEY, dept_name TEXT)").Error; err != nil {
		t.Fatalf("create dept fixture: %v", err)
	}
	if err := db.Exec("CREATE TABLE IF NOT EXISTS system_dict_item (id INTEGER PRIMARY KEY, dict_code TEXT, item_value TEXT, status INTEGER)").Error; err != nil {
		t.Fatalf("create dict fixture: %v", err)
	}
	if err := db.Exec("INSERT INTO system_dept (id, dept_name) VALUES (2, '平台研发部')").Error; err != nil {
		t.Fatalf("seed dept fixture: %v", err)
	}
	if err := db.Exec("INSERT INTO system_dict_item (dict_code, item_value, status) VALUES ('cmdb_relation_type', 'depends_on', 1)").Error; err != nil {
		t.Fatalf("seed relation dict fixture: %v", err)
	}

	service := NewCMDBService(db)
	firstType, err := service.CreateType(&CMDBTypeCreateReq{
		TypeCode: "application",
		TypeName: "应用服务",
		Category: "software",
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create first type: %v", err)
	}
	secondType, err := service.CreateType(&CMDBTypeCreateReq{
		TypeCode: "database",
		TypeName: "数据库",
		Category: "infrastructure",
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create second type: %v", err)
	}
	sourceItem, err := service.CreateItem(&CMDBItemCreateReq{
		TypeID:      firstType.ID,
		ItemCode:    "app-pantheon-api",
		ItemName:    "Pantheon API",
		Environment: "prod",
		Status:      "active",
		OwnerDeptID: 2,
	})
	if err != nil {
		t.Fatalf("create source item: %v", err)
	}
	targetItem, err := service.CreateItem(&CMDBItemCreateReq{
		TypeID:      secondType.ID,
		ItemCode:    "db-pantheon-prod",
		ItemName:    "Pantheon DB",
		Environment: "prod",
		Status:      "active",
	})
	if err != nil {
		t.Fatalf("create target item: %v", err)
	}

	relation, err := service.CreateRelation(&CMDBRelationCreateReq{
		SourceItemID: sourceItem.ID,
		TargetItemID: targetItem.ID,
		RelationType: "depends_on",
		Remark:       "核心 API 依赖主库",
	})
	if err != nil {
		t.Fatalf("create relation: %v", err)
	}
	if relation.SourceItemCode != sourceItem.ItemCode || relation.TargetItemCode != targetItem.ItemCode {
		t.Fatalf("unexpected relation payload: %+v", relation)
	}

	sourceDetail, err := service.GetItemDetail(sourceItem.ID)
	if err != nil {
		t.Fatalf("get source detail: %v", err)
	}
	if sourceDetail.OwnerDeptName != "平台研发部" {
		t.Fatalf("unexpected owner dept name: %+v", sourceDetail)
	}
	if len(sourceDetail.OutgoingRelations) != 1 || len(sourceDetail.IncomingRelations) != 0 {
		t.Fatalf("unexpected source detail relations: %+v", sourceDetail)
	}

	targetDetail, err := service.GetItemDetail(targetItem.ID)
	if err != nil {
		t.Fatalf("get target detail: %v", err)
	}
	if len(targetDetail.IncomingRelations) != 1 || targetDetail.IncomingRelations[0].SourceItemCode != sourceItem.ItemCode {
		t.Fatalf("unexpected target detail relations: %+v", targetDetail)
	}

	if err := service.DeleteItem(targetItem.ID); err != nil {
		t.Fatalf("delete target item: %v", err)
	}
	sourceDetailAfterDelete, err := service.GetItemDetail(sourceItem.ID)
	if err != nil {
		t.Fatalf("get source detail after delete: %v", err)
	}
	if len(sourceDetailAfterDelete.OutgoingRelations) != 0 {
		t.Fatalf("expected cascading relation cleanup, got %+v", sourceDetailAfterDelete.OutgoingRelations)
	}
}
