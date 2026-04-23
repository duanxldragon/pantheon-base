package system

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupDictTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&SystemDictType{}, &SystemDictItem{}); err != nil {
		t.Fatalf("migrate dict: %v", err)
	}
	return db
}

func TestDictService_DeleteTypeReleasesDictCode(t *testing.T) {
	db := setupDictTestDB(t)
	service := NewDictService(db)

	created, err := service.CreateDictType(&DictTypeCreateReq{
		DictCode: "biz_status",
		DictName: "Business Status",
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create dict type: %v", err)
	}
	if err := service.DeleteDictType(created.ID); err != nil {
		t.Fatalf("delete dict type: %v", err)
	}

	var deleted SystemDictType
	if err := db.Unscoped().First(&deleted, created.ID).Error; err != nil {
		t.Fatalf("load deleted dict type: %v", err)
	}
	if !strings.HasPrefix(deleted.DictCode, deletedDictTypeCodePrefix) {
		t.Fatalf("expected archived dict code, got %s", deleted.DictCode)
	}

	recreated, err := service.CreateDictType(&DictTypeCreateReq{
		DictCode: "biz_status",
		DictName: "Business Status",
		Status:   1,
	})
	if err != nil {
		t.Fatalf("recreate dict type: %v", err)
	}
	if recreated.DictCode != "biz_status" {
		t.Fatalf("expected biz_status, got %s", recreated.DictCode)
	}
}

func TestDictService_DeleteItemReleasesItemValue(t *testing.T) {
	db := setupDictTestDB(t)
	service := NewDictService(db)

	if _, err := service.CreateDictType(&DictTypeCreateReq{DictCode: "ticket_status", DictName: "Ticket Status", Status: 1}); err != nil {
		t.Fatalf("create dict type: %v", err)
	}
	created, err := service.CreateDictItem(&DictItemCreateReq{
		DictCode:     "ticket_status",
		ItemLabelKey: "dict.ticket.open",
		ItemValue:    "open",
		Status:       1,
	})
	if err != nil {
		t.Fatalf("create dict item: %v", err)
	}
	if err := service.DeleteDictItem(created.ID); err != nil {
		t.Fatalf("delete dict item: %v", err)
	}

	var deleted SystemDictItem
	if err := db.Unscoped().First(&deleted, created.ID).Error; err != nil {
		t.Fatalf("load deleted dict item: %v", err)
	}
	if !strings.HasPrefix(deleted.ItemValue, deletedDictItemValuePrefix) {
		t.Fatalf("expected archived item value, got %s", deleted.ItemValue)
	}

	recreated, err := service.CreateDictItem(&DictItemCreateReq{
		DictCode:     "ticket_status",
		ItemLabelKey: "dict.ticket.open",
		ItemValue:    "open",
		Status:       1,
	})
	if err != nil {
		t.Fatalf("recreate dict item: %v", err)
	}
	if recreated.ItemValue != "open" {
		t.Fatalf("expected open, got %s", recreated.ItemValue)
	}
}

func TestDictService_MigrateReleasesLegacyDeletedDictKeys(t *testing.T) {
	db := setupDictTestDB(t)
	service := NewDictService(db)

	legacyType := SystemDictType{DictCode: "legacy_dict", DictName: "Legacy Dict", Status: 1}
	if err := db.Create(&legacyType).Error; err != nil {
		t.Fatalf("seed legacy dict type: %v", err)
	}
	if err := db.Model(&legacyType).Update("deleted_at", time.Now()).Error; err != nil {
		t.Fatalf("soft delete legacy dict type: %v", err)
	}

	activeType := SystemDictType{DictCode: "legacy_item_dict", DictName: "Legacy Item Dict", Status: 1}
	if err := db.Create(&activeType).Error; err != nil {
		t.Fatalf("seed active dict type: %v", err)
	}
	legacyItem := SystemDictItem{DictCode: activeType.DictCode, ItemLabelKey: "dict.legacy.item", ItemValue: "same", Status: 1}
	if err := db.Create(&legacyItem).Error; err != nil {
		t.Fatalf("seed legacy dict item: %v", err)
	}
	if err := db.Model(&legacyItem).Update("deleted_at", time.Now()).Error; err != nil {
		t.Fatalf("soft delete legacy dict item: %v", err)
	}

	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dict: %v", err)
	}

	var repairedType SystemDictType
	if err := db.Unscoped().First(&repairedType, legacyType.ID).Error; err != nil {
		t.Fatalf("load repaired dict type: %v", err)
	}
	if !strings.HasPrefix(repairedType.DictCode, deletedDictTypeCodePrefix) {
		t.Fatalf("expected archived legacy dict code, got %s", repairedType.DictCode)
	}
	var repairedItem SystemDictItem
	if err := db.Unscoped().First(&repairedItem, legacyItem.ID).Error; err != nil {
		t.Fatalf("load repaired dict item: %v", err)
	}
	if !strings.HasPrefix(repairedItem.ItemValue, deletedDictItemValuePrefix) {
		t.Fatalf("expected archived legacy item value, got %s", repairedItem.ItemValue)
	}

	if _, err := service.CreateDictType(&DictTypeCreateReq{DictCode: "legacy_dict", DictName: "Legacy Dict", Status: 1}); err != nil {
		t.Fatalf("expected legacy dict code to be reusable: %v", err)
	}
	if _, err := service.CreateDictItem(&DictItemCreateReq{DictCode: activeType.DictCode, ItemLabelKey: "dict.legacy.item", ItemValue: "same", Status: 1}); err != nil {
		t.Fatalf("expected legacy item value to be reusable: %v", err)
	}
}

func TestDictService_ImportTemplateAndExport(t *testing.T) {
	db := setupDictTestDB(t)
	service := NewDictService(db)

	typeTemplate := service.BuildDictTypeImportTemplate()
	if len(typeTemplate.Rows) == 0 || !strings.HasPrefix(typeTemplate.Rows[0][0], "#") {
		t.Fatalf("expected dict type template instructions, got %+v", typeTemplate.Rows)
	}
	typeTemplateResult, err := service.ImportDictTypes(append([][]string{typeTemplate.Headers}, typeTemplate.Rows...))
	if err != nil {
		t.Fatalf("import type template comments: %v", err)
	}
	if !typeTemplateResult.Applied || typeTemplateResult.Created != 0 || typeTemplateResult.Failed != 0 {
		t.Fatalf("expected type template comments to be ignored, got %+v", typeTemplateResult)
	}

	typeResult, err := service.ImportDictTypes([][]string{
		typeTemplate.Headers,
		{"biz_status", "业务状态", "business", "1", "业务通用状态字典"},
	})
	if err != nil {
		t.Fatalf("import dict type: %v", err)
	}
	if !typeResult.Applied || typeResult.Created != 1 || typeResult.Failed != 0 {
		t.Fatalf("unexpected type import result: %+v", typeResult)
	}

	itemTemplate := service.BuildDictItemImportTemplate()
	if len(itemTemplate.Rows) == 0 || !strings.HasPrefix(itemTemplate.Rows[0][0], "#") {
		t.Fatalf("expected dict item template instructions, got %+v", itemTemplate.Rows)
	}
	itemTemplateResult, err := service.ImportDictItems(append([][]string{itemTemplate.Headers}, itemTemplate.Rows...))
	if err != nil {
		t.Fatalf("import item template comments: %v", err)
	}
	if !itemTemplateResult.Applied || itemTemplateResult.Created != 0 || itemTemplateResult.Failed != 0 {
		t.Fatalf("expected item template comments to be ignored, got %+v", itemTemplateResult)
	}

	itemResult, err := service.ImportDictItems([][]string{
		itemTemplate.Headers,
		{"biz_status", "dict.biz_status.enabled", "enabled", "green", "10", "1", "启用"},
	})
	if err != nil {
		t.Fatalf("import dict item: %v", err)
	}
	if !itemResult.Applied || itemResult.Created != 1 || itemResult.Failed != 0 {
		t.Fatalf("unexpected item import result: %+v", itemResult)
	}

	exportedTypes, err := service.ExportDictTypes(&DictTypeListQuery{DictCode: "biz_status"})
	if err != nil {
		t.Fatalf("export dict type: %v", err)
	}
	if len(exportedTypes.Rows) != 1 || exportedTypes.Rows[0][0] != "biz_status" {
		t.Fatalf("unexpected type export rows: %+v", exportedTypes.Rows)
	}

	exportedItems, err := service.ExportDictItems(&DictItemListQuery{DictCode: "biz_status"})
	if err != nil {
		t.Fatalf("export dict item: %v", err)
	}
	if len(exportedItems.Rows) != 1 || exportedItems.Rows[0][0] != "biz_status" || exportedItems.Rows[0][2] != "enabled" {
		t.Fatalf("unexpected item export rows: %+v", exportedItems.Rows)
	}
}
