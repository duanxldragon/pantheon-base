package system

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestI18nHandler_ServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := newI18nTestDB(t)
	service := NewI18nService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	workspaceRoot := t.TempDir()
	if err := os.MkdirAll(filepath.Join(workspaceRoot, "backend"), 0o755); err != nil {
		t.Fatalf("mkdir backend root: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(workspaceRoot, "frontend", "src"), 0o755); err != nil {
		t.Fatalf("mkdir frontend root: %v", err)
	}
	t.Setenv("PANTHEON_WORKSPACE_ROOT", workspaceRoot)

	if err := service.BatchInsert([]SystemI18n{
		{Module: "system.config", Group: "messages", Key: "i18n.handler.detail", Locale: "zh-CN", Value: "详情"},
		{Module: "system.config", Group: "messages", Key: "legacy.key", Locale: "zh-CN", Value: "旧值"},
		{Module: "system.config", Group: "messages", Key: "legacy.key", Locale: "en-US", Value: "Legacy"},
	}); err != nil {
		t.Fatalf("seed handler rows: %v", err)
	}

	handler := NewI18nHandler(service)

	handler.GetLangPack(newI18nJSONContext(http.MethodGet, "/?locale=zh-CN", ""))
	handler.GetOverview(newI18nJSONContext(http.MethodGet, "/", ""))
	handler.GetAudit(newI18nJSONContext(http.MethodGet, "/", ""))
	handler.DeleteArchivedUnusedKeys(newI18nJSONContext(http.MethodPost, "/", `{"module":"system.config","confirmArchived":false}`))
	handler.PreviewRenameKey(newI18nJSONContext(http.MethodPost, "/", `{"module":"system.config","oldKey":"missing.key","newKey":"system.config.missing.key"}`))
	handler.RenameKey(newI18nJSONContext(http.MethodPost, "/", `{"module":"system.config","oldKey":"legacy.key","newKey":"system.config.legacy.key","confirmSourceUpdated":false}`))
	handler.GetMissingLocales(newI18nJSONContext(http.MethodGet, "/?module=system.config", ""))
	handler.FillMissingLocales(newI18nJSONContext(http.MethodPost, "/?module=system.config", ""))
	handler.HydrateBuiltinLocales(newI18nJSONContext(http.MethodPost, "/?module=system.config", ""))
	handler.List(newI18nJSONContext(http.MethodGet, "/?page=1", ""))

	context := newI18nJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "1"}}
	handler.Get(context)

	handler.Create(newI18nJSONContext(http.MethodPost, "/", `{"module":"system.config","group":"messages","key":"i18n.demo","locale":"zh-CN","value":"演示"}`))

	context = newI18nJSONContext(http.MethodPut, "/", `{"value":"更新后"}`)
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "1"}}
	handler.Update(context)

	context = newI18nJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "1"}}
	handler.Delete(context)

	handler.DeleteBatch(newI18nJSONContext(http.MethodPost, "/", `{"ids":[1]}`))
	handler.Export(newI18nJSONContext(http.MethodPost, "/", `{}`))
	handler.SyncMissingKeys(newI18nJSONContext(http.MethodPost, "/", ""))
	handler.ReloadCache(newI18nJSONContext(http.MethodPost, "/", `{"locales":["zh-CN"]}`))
}

func TestI18nService_RenameGuardBranches(t *testing.T) {
	service := NewI18nService(nil)
	validReq := &I18nRenamePreviewReq{
		Module: "system.config",
		OldKey: "legacy.key",
		NewKey: "system.config.legacy.key",
	}

	if _, err := service.PreviewRenameKey(&I18nRenamePreviewReq{}); err == nil || err.Error() != "i18n.rename.invalid" {
		t.Fatalf("expected invalid preview request error, got %v", err)
	}
	if _, err := service.PreviewRenameKey(validReq); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db preview guard, got %v", err)
	}

	db := newI18nTestDB(t)
	service = NewI18nService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	workspaceRoot := t.TempDir()
	if err := os.MkdirAll(filepath.Join(workspaceRoot, "backend"), 0o755); err != nil {
		t.Fatalf("mkdir backend root: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(workspaceRoot, "frontend", "src"), 0o755); err != nil {
		t.Fatalf("mkdir frontend root: %v", err)
	}
	t.Setenv("PANTHEON_WORKSPACE_ROOT", workspaceRoot)

	if _, err := service.PreviewRenameKey(validReq); err == nil || err.Error() != "i18n.rename.source_not_found" {
		t.Fatalf("expected missing-source preview error, got %v", err)
	}

	if err := service.BatchInsert([]SystemI18n{
		{Module: "system.config", Group: "messages", Key: "legacy.key", Locale: "zh-CN", Value: "旧值"},
		{Module: "system.config", Group: "messages", Key: "system.config.legacy.key", Locale: "zh-CN", Value: "新值"},
	}); err != nil {
		t.Fatalf("seed rename rows: %v", err)
	}

	if _, err := service.RenameKey(&I18nRenameExecuteReq{
		Module: "system.config",
		OldKey: "legacy.key",
		NewKey: "system.config.legacy.key",
	}); err == nil || err.Error() != "i18n.rename.target_exists" {
		t.Fatalf("expected target-exists rename error, got %v", err)
	}
}

func TestI18nHandler_InvalidGuardBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewI18nHandler(NewI18nService(nil))

	handler.DeleteArchivedUnusedKeys(newI18nJSONContext(http.MethodPost, "/", "{"))
	handler.ReloadCache(newI18nJSONContext(http.MethodPost, "/", "{"))

	context := newI18nJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "bad"}}
	handler.Get(context)

	context = newI18nJSONContext(http.MethodPut, "/", `{"value":"ok"}`)
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "bad"}}
	handler.Update(context)

	context = newI18nJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "bad"}}
	handler.Delete(context)
}

func TestI18nService_GuardBranches(t *testing.T) {
	service := NewI18nService(nil)

	if _, err := service.Create(&I18nCreateReq{}); err == nil || err.Error() != i18nCreateInvalidKey {
		t.Fatalf("expected create-invalid error, got %v", err)
	}
	if err := service.Update(1, &I18nUpdateReq{Value: " "}); err == nil || err.Error() != i18nValueRequiredKey {
		t.Fatalf("expected value-required error, got %v", err)
	}
	if _, err := service.Import([][]string{{"module"}}); err == nil || err.Error() != i18nDatabaseNotInitializedKey {
		t.Fatalf("expected import nil-db guard, got %v", err)
	}
	if _, err := service.DeleteArchivedUnusedKeys("system.config", false); err == nil || err.Error() != i18nLifecycleDeleteConfirmKey {
		t.Fatalf("expected delete confirm-required error, got %v", err)
	}
	if _, err := service.transitionUnusedLifecycle("system.config", I18nLifecycleStatusActive, I18nLifecycleStatusObserving, true); err == nil || err.Error() != i18nLifecycleTransitionInvalidKey {
		t.Fatalf("expected lifecycle transition invalid error, got %v", err)
	}
}
