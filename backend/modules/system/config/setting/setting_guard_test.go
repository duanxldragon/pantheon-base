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

func TestSettingService_NilDBPublicGuards(t *testing.T) {
	service := NewSettingService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"list", func() error { _, err := service.List(nil); return err }},
		{"get group", func() error { _, err := service.GetGroup("basic"); return err }},
		{"get by key", func() error { _, err := service.GetByKey("site.name"); return err }},
		{"update group", func() error {
			_, err := service.UpdateGroup("basic", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{{SettingKey: "site.name", SettingValue: "Pantheon"}}})
			return err
		}},
		{"get public settings", func() error { _, err := service.GetPublicSettings(); return err }},
		{"get overview", func() error { _, err := service.GetOverview(); return err }},
		{"refresh cache", func() error { _, err := service.RefreshSettingCache([]string{"basic"}); return err }},
		{"list audit", func() error { _, err := service.ListAudit(nil); return err }},
		{"export audit", func() error { _, err := service.ExportAudit(nil); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != settingDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", settingDatabaseNotInitializedKey, err)
			}
		})
	}
}

func TestSettingService_ValueValidationGuards(t *testing.T) {
	cases := []struct {
		name     string
		run      func() error
		expected string
	}{
		{"invalid number", func() error { _, err := validateAndNormalizeSettingValue("site.name", "number", "abc"); return err }, settingValueInvalidNumberKey},
		{"invalid boolean", func() error { _, err := validateAndNormalizeSettingValue("site.name", "boolean", "maybe"); return err }, settingValueInvalidBooleanKey},
		{"invalid json", func() error { _, err := validateAndNormalizeSettingValue("site.name", "json", "{"); return err }, settingValueInvalidJSONKey},
		{"upload types must be array", func() error {
			_, err := validateAndNormalizeSettingValue("upload.allowed_types", "json", `{"png":true}`)
			return err
		}, settingValueInvalidJSONKey},
		{"invalid value type", func() error { _, err := validateAndNormalizeSettingValue("site.name", "custom", "value"); return err }, settingValueTypeInvalidKey},
		{"invalid option", func() error { _, err := normalizeSettingValue("platform.app_mode", "invalid"); return err }, settingValueInvalidOptionKey},
		{"retention invalid json", func() error { _, err := normalizeAuditRetentionOptions("{"); return err }, settingValueInvalidJSONKey},
		{"retention empty", func() error { _, err := normalizeAuditRetentionOptions("[]"); return err }, settingValueInvalidOptionKey},
		{"retention out of range", func() error { _, err := normalizeAuditRetentionOptions("[0]"); return err }, settingValueInvalidOptionKey},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != tc.expected {
				t.Fatalf("expected %s, got %v", tc.expected, err)
			}
		})
	}
}
