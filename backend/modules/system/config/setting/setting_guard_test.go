package config

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSettingHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewSettingHandler(NewSettingService(nil), nil)

	handler.GetSettingList(newSettingJSONContext(http.MethodGet, "/?groupKey=basic", ""))
	handler.GetSettingOverview(newSettingJSONContext(http.MethodGet, "/", ""))

	context := newSettingJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: settingParamGroupKey, Value: "basic"}}
	handler.GetSettingGroup(context)

	handler.GetPublicSettings(newSettingJSONContext(http.MethodGet, "/", ""))

	context = newSettingJSONContext(http.MethodPost, "/", `{"items":[{"settingKey":"site.name","settingValue":"Pantheon"}]}`)
	context.Params = gin.Params{{Key: settingParamGroupKey, Value: "basic"}}
	handler.UpdateSettingGroup(context)

	handler.RefreshSettingCache(newSettingJSONContext(http.MethodPost, "/", `{"groupKeys":["basic"]}`))
	handler.GetSettingAuditList(newSettingJSONContext(http.MethodGet, "/?page=1", ""))
	handler.ExportSettingAudit(newSettingJSONContext(http.MethodPost, "/", `{}`))
}

func TestSettingService_GuardBranches(t *testing.T) {
	db := setupSettingTestDB(t)
	service := NewSettingService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	if _, err := service.GetGroup(""); err == nil || err.Error() != "setting.group.invalid" {
		t.Fatalf("expected invalid group error, got %v", err)
	}
	if _, err := service.UpdateGroup("", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{{SettingKey: "site.name", SettingValue: "Pantheon"}}}); err == nil || err.Error() != "setting.group.invalid" {
		t.Fatalf("expected invalid update group error, got %v", err)
	}
	if _, err := service.UpdateGroup("basic", nil); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected nil update request error, got %v", err)
	}
	if _, err := service.UpdateGroup("basic", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{{SettingValue: "Pantheon"}}}); err == nil || err.Error() != "setting.key.required" {
		t.Fatalf("expected missing setting key error, got %v", err)
	}
}
