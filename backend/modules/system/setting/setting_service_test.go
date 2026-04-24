package system

import (
	"fmt"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupSettingTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	return db
}

func TestSettingService_UpdateGroupInvalidatesPublicCache(t *testing.T) {
	db := setupSettingTestDB(t)
	service := NewSettingService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate setting: %v", err)
	}

	publicSettings, err := service.GetPublicSettings()
	if err != nil {
		t.Fatalf("load public settings: %v", err)
	}
	if publicSettings.Settings["site.name"] != "Pantheon Base" {
		t.Fatalf("expected default site name, got %s", publicSettings.Settings["site.name"])
	}

	updated, err := service.UpdateGroup("basic", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{
		{SettingKey: "site.name", SettingValue: "Pantheon QA"},
		{SettingKey: "site.logo", SettingValue: "https://example.com/logo.png"},
	}})
	if err != nil {
		t.Fatalf("update basic settings: %v", err)
	}
	if updated.Items[0].SettingValue != "Pantheon QA" {
		t.Fatalf("expected updated group value, got %+v", updated.Items)
	}

	publicSettings, err = service.GetPublicSettings()
	if err != nil {
		t.Fatalf("reload public settings: %v", err)
	}
	if publicSettings.Settings["site.name"] != "Pantheon QA" {
		t.Fatalf("expected cache invalidated site name, got %s", publicSettings.Settings["site.name"])
	}
	if publicSettings.Settings["site.logo"] != "https://example.com/logo.png" {
		t.Fatalf("expected updated site logo, got %s", publicSettings.Settings["site.logo"])
	}
}

func TestSettingService_EncryptedEmptyUpdateKeepsCurrentValue(t *testing.T) {
	db := setupSettingTestDB(t)
	service := NewSettingService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate setting: %v", err)
	}

	if _, err := service.UpdateGroup("upload", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{
		{SettingKey: "upload.s3_access_key_id", SettingValue: "secret-access-key"},
	}}); err != nil {
		t.Fatalf("set encrypted setting: %v", err)
	}

	if _, err := service.UpdateGroup("upload", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{
		{SettingKey: "upload.s3_access_key_id", SettingValue: ""},
	}}); err != nil {
		t.Fatalf("keep encrypted setting with empty value: %v", err)
	}

	value, err := service.GetByKey("upload.s3_access_key_id")
	if err != nil {
		t.Fatalf("get encrypted setting: %v", err)
	}
	if value != "secret-access-key" {
		t.Fatalf("expected encrypted value to be kept, got %s", value)
	}
}

func TestSettingService_UpdateGroupValidatesValueType(t *testing.T) {
	db := setupSettingTestDB(t)
	service := NewSettingService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate setting: %v", err)
	}

	_, err := service.UpdateGroup("upload", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{
		{SettingKey: "upload.allowed_types", SettingValue: "[invalid json]"},
	}})
	if err == nil || err.Error() != "setting.value.invalid_json" {
		t.Fatalf("expected invalid json error, got %v", err)
	}

	_, err = service.UpdateGroup("upload", &SettingGroupUpdateReq{Items: []SettingUpdateItemReq{
		{SettingKey: "upload.max_file_size", SettingValue: "not-a-number"},
	}})
	if err == nil || err.Error() != "setting.value.invalid_number" {
		t.Fatalf("expected invalid number error, got %v", err)
	}
}

