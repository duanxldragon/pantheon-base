package config

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestDictHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewDictHandler(NewDictService(nil))

	handler.GetDictTypeList(newDictJSONContext(http.MethodGet, "/?dictCode=biz", ""))
	handler.CreateDictType(newDictJSONContext(http.MethodPost, "/", `{"dictCode":"biz_status","dictName":"业务状态","status":1}`))

	context := newDictJSONContext(http.MethodPut, "/", `{"dictCode":"biz_status","dictName":"业务状态","status":1}`)
	context.Params = gin.Params{{Key: dictParamID, Value: "1"}}
	handler.UpdateDictType(context)

	context = newDictJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: dictParamID, Value: "1"}}
	handler.DeleteDictType(context)

	handler.BatchUpdateDictTypeStatus(newDictJSONContext(http.MethodPost, "/", `{"ids":[1],"status":1}`))
	handler.BatchDeleteDictTypes(newDictJSONContext(http.MethodPost, "/", `{"ids":[1]}`))
	handler.GetDictItemList(newDictJSONContext(http.MethodGet, "/?dictCode=biz_status&page=1", ""))
	handler.AnalyzeDictUsage(newDictJSONContext(http.MethodGet, "/?dictCode=biz_status", ""))
	handler.CreateDictItem(newDictJSONContext(http.MethodPost, "/", `{"dictCode":"biz_status","itemLabelKey":"dict.biz_status.enabled","itemValue":"enabled","status":1}`))

	context = newDictJSONContext(http.MethodPut, "/", `{"dictCode":"biz_status","itemLabelKey":"dict.biz_status.enabled","itemValue":"enabled","status":1}`)
	context.Params = gin.Params{{Key: dictParamID, Value: "1"}}
	handler.UpdateDictItem(context)

	context = newDictJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: dictParamID, Value: "1"}}
	handler.DeleteDictItem(context)

	handler.BatchUpdateDictItemStatus(newDictJSONContext(http.MethodPost, "/", `{"ids":[1],"status":1}`))
	handler.BatchDeleteDictItems(newDictJSONContext(http.MethodPost, "/", `{"ids":[1]}`))

	context = newDictJSONContext(http.MethodPost, "/", `{"direction":"up"}`)
	context.Params = gin.Params{{Key: dictParamID, Value: "1"}}
	handler.ReorderDictItem(context)

	handler.GetDictOptions(newDictJSONContext(http.MethodGet, "/?codes=biz_status", ""))
	handler.RefreshDictOptionsCache(newDictJSONContext(http.MethodPost, "/", `{"codes":["biz_status"]}`))
	handler.ExportDictTypes(newDictJSONContext(http.MethodPost, "/", `{}`))
	handler.ExportDictItems(newDictJSONContext(http.MethodPost, "/", `{"dictCode":"biz_status"}`))
}

func TestDictService_GuardBranches(t *testing.T) {
	db := setupDictTestDB(t)
	service := NewDictService(db)

	if _, err := service.BatchUpdateDictTypeStatus(nil, 1); err == nil || err.Error() != "dict.type.batch.empty" {
		t.Fatalf("expected empty type batch error, got %v", err)
	}
	if _, err := service.BatchUpdateDictTypeStatus([]uint64{1}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid type status error, got %v", err)
	}
	if _, err := service.BatchUpdateDictItemStatus(nil, 1); err == nil || err.Error() != "dict.item.batch.empty" {
		t.Fatalf("expected empty item batch error, got %v", err)
	}
	if _, err := service.BatchUpdateDictItemStatus([]uint64{1}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid item status error, got %v", err)
	}
	if _, err := service.ReorderDictItem(1, "sideways"); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid reorder direction error, got %v", err)
	}
	if _, err := service.AnalyzeDictUsage("   "); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank dict usage error, got %v", err)
	}
	if err := service.validateDictType(0, " "); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank dict type code error, got %v", err)
	}

	if err := db.Create(&SystemDictType{DictCode: "biz_status", DictName: "业务状态", Module: "business", Status: 1}).Error; err != nil {
		t.Fatalf("seed dict type: %v", err)
	}
	if err := service.validateDictType(0, "biz_status"); err == nil || err.Error() != "dict.type.code.exists" {
		t.Fatalf("expected duplicate dict type code error, got %v", err)
	}
	if err := service.validateDictItem(0, "missing", "enabled"); err == nil || err.Error() != "dict.type.not_found" {
		t.Fatalf("expected missing dict type error, got %v", err)
	}

	if err := db.Create(&SystemDictItem{DictCode: "biz_status", ItemLabelKey: "dict.biz_status.enabled", ItemValue: "enabled", Status: 1}).Error; err != nil {
		t.Fatalf("seed dict item: %v", err)
	}
	if err := service.validateDictItem(0, "biz_status", "enabled"); err == nil || err.Error() != "dict.item.value.exists" {
		t.Fatalf("expected duplicate dict item value error, got %v", err)
	}

	result, err := service.ImportDictTypes(nil)
	if err != nil {
		t.Fatalf("expected import-type validation result, got %v", err)
	}
	if result.Failed != 1 {
		t.Fatalf("expected one import-type error for empty file, got %+v", result)
	}

	result, err = service.ImportDictItems(nil)
	if err != nil {
		t.Fatalf("expected import-item validation result, got %v", err)
	}
	if result.Failed != 1 {
		t.Fatalf("expected one import-item error for empty file, got %+v", result)
	}

	headerOnly, err := service.ImportDictTypes([][]string{{"dictCode"}})
	if err != nil {
		t.Fatalf("expected import-type header validation result, got %v", err)
	}
	if headerOnly.Failed == 0 {
		t.Fatalf("expected header validation failures for dict-type import, got %+v", headerOnly)
	}

	itemHeaderOnly, err := service.ImportDictItems([][]string{{"dictCode"}})
	if err != nil {
		t.Fatalf("expected import-item header validation result, got %v", err)
	}
	if itemHeaderOnly.Failed == 0 {
		t.Fatalf("expected header validation failures for dict-item import, got %+v", itemHeaderOnly)
	}

	if err := service.validateDictItem(0, " ", " "); err == nil || err.Error() != dictParamInvalidKey {
		t.Fatalf("expected blank dict-item param error, got %v", err)
	}
}

func TestDictService_NilDBPublicGuards(t *testing.T) {
	service := NewDictService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"list dict types", func() error { _, err := service.ListDictTypes(nil); return err }},
		{"create dict type", func() error {
			_, err := service.CreateDictType(&DictTypeCreateReq{DictCode: "biz_status", DictName: "业务状态", Status: 1})
			return err
		}},
		{"import dict types", func() error { _, err := service.ImportDictTypes([][]string{{"dictCode"}}); return err }},
		{"update dict type", func() error {
			_, err := service.UpdateDictType(1, &DictTypeUpdateReq{DictCode: "biz_status", DictName: "业务状态", Status: 1})
			return err
		}},
		{"delete dict type", func() error { return service.DeleteDictType(1) }},
		{"batch update dict type status", func() error { _, err := service.BatchUpdateDictTypeStatus([]uint64{1}, 1); return err }},
		{"list dict items", func() error { _, err := service.ListDictItems(&DictItemListQuery{DictCode: "biz_status"}); return err }},
		{"create dict item", func() error {
			_, err := service.CreateDictItem(&DictItemCreateReq{DictCode: "biz_status", ItemLabelKey: "dict.biz_status.enabled", ItemValue: "enabled", Status: 1})
			return err
		}},
		{"import dict items", func() error { _, err := service.ImportDictItems([][]string{{"dictCode"}}); return err }},
		{"update dict item", func() error {
			_, err := service.UpdateDictItem(1, &DictItemUpdateReq{DictCode: "biz_status", ItemLabelKey: "dict.biz_status.enabled", ItemValue: "enabled", Status: 1})
			return err
		}},
		{"delete dict item", func() error { return service.DeleteDictItem(1) }},
		{"batch update dict item status", func() error { _, err := service.BatchUpdateDictItemStatus([]uint64{1}, 1); return err }},
		{"reorder dict item", func() error { _, err := service.ReorderDictItem(1, "up"); return err }},
		{"get dict options", func() error { _, err := service.GetDictOptions([]string{"biz_status"}); return err }},
		{"refresh dict cache", func() error { _, err := service.RefreshDictOptionsCache([]string{"biz_status"}); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != dictDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", dictDatabaseNotInitializedKey, err)
			}
		})
	}
}
