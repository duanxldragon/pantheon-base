package dynamicmodule

import (
	"encoding/json"
	"net/http"
	"testing"

	"pantheon-platform/backend/internal/scaffold"

	"github.com/gin-gonic/gin"
)

func TestDynamicModuleHandler_ServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	service := &DynamicModuleService{db: openDynamicModuleTestDB(t), workspaceRoot: ""}
	handler := NewDynamicModuleHandler(service)

	handler.RegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", `{"name":"business.demo"}`))
	handler.GenerateAndRegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", `{"schema":{"scope":"business","name":"demo","displayName":"Demo","model":{"tableName":"biz_demo"}}}`))

	context := newDynamicModuleJSONContext(http.MethodDelete, "/?dropTable=true&purgeSource=true", "")
	context.Params = gin.Params{{Key: dynamicModuleNameParamKey, Value: "business.demo"}}
	handler.UnregisterModule(context)

	context = newDynamicModuleJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: dynamicModuleNameParamKey, Value: "business.demo"}}
	handler.DeleteModuleRecord(context)

	context = newDynamicModuleJSONContext(http.MethodDelete, "/?dropTable=true", "")
	context.Params = gin.Params{{Key: dynamicModuleNameParamKey, Value: "business.demo"}}
	handler.PurgeModule(context)

	handler.RepairRegistries(newDynamicModuleJSONContext(http.MethodPost, "/", ""))
	handler.AuditPendingActivations(newDynamicModuleJSONContext(http.MethodPost, "/", ""))
	handler.GetModuleSchema(newDynamicModuleJSONContext(http.MethodGet, "/?module=business.demo", ""))
	handler.ListModules(newDynamicModuleJSONContext(http.MethodGet, "/", ""))

	context = newDynamicModuleJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: dynamicModuleNameParamKey, Value: "business.demo"}}
	handler.GetModuleStatus(context)
}

func TestDynamicModuleService_GuardBranches(t *testing.T) {
	req := newGeneratedModuleRequest("business", "demo", "Demo", "biz_demo")

	service := NewDynamicModuleService(nil)
	if _, _, _, err := service.RegisterGeneratedModule(req); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db generated-module guard, got %v", err)
	}

	db := openDynamicModuleTestDB(t)
	service = &DynamicModuleService{db: db, workspaceRoot: ""}

	if _, _, _, err := service.RegisterGeneratedModule(req); err == nil || err.Error() != "workspace.not_found" {
		t.Fatalf("expected workspace-not-found guard for generated module, got %v", err)
	}
	if _, err := service.RegisterManagedModule("business.demo"); err == nil || err.Error() != "workspace.not_found" {
		t.Fatalf("expected workspace-not-found guard for managed module, got %v", err)
	}
	if _, err := service.GetManagedModuleSchema("business.demo"); err == nil || err.Error() != "workspace.not_found" {
		t.Fatalf("expected workspace-not-found guard for schema, got %v", err)
	}
}

func TestDynamicModuleService_LifecycleGuards(t *testing.T) {
	db := openDynamicModuleTestDB(t)
	service := &DynamicModuleService{db: db, workspaceRoot: ""}

	if _, err := service.AuditPendingGeneratedModuleActivations(); err == nil || err.Error() != dynamicModuleWorkspaceNotFoundKey {
		t.Fatalf("expected activation workspace guard, got %v", err)
	}
	if err := service.RebuildGeneratedRegistries(); err == nil || err.Error() != dynamicModuleWorkspaceNotFoundKey {
		t.Fatalf("expected registry rebuild workspace guard, got %v", err)
	}
	if _, err := service.FinalizeUnregister("business.demo", false); err == nil || err.Error() != dynamicModuleWorkspaceNotFoundKey {
		t.Fatalf("expected finalize-unregister workspace guard, got %v", err)
	}
	if err := service.DeleteModuleRecord("business.demo"); err == nil || err.Error() != dynamicModuleNotFoundKey {
		t.Fatalf("expected delete-record not-found guard, got %v", err)
	}
	if _, err := service.PurgeModule("business.demo", true, true); err == nil || err.Error() != dynamicModuleNotFoundKey {
		t.Fatalf("expected purge not-found guard, got %v", err)
	}

	if err := db.Create(&ModuleRegistration{Name: "business.demo", Status: ModuleStatusActive}).Error; err != nil {
		t.Fatalf("seed builtin registration: %v", err)
	}
	if _, err := service.UnregisterModule("business.demo", false, false); err == nil || err.Error() != dynamicModuleUnregisterBuiltinKey {
		t.Fatalf("expected unregister builtin guard, got %v", err)
	}
}

func TestDynamicModuleHandlerAndHelperGuards(t *testing.T) {
	gin.SetMode(gin.TestMode)
	service := &DynamicModuleService{db: openDynamicModuleTestDB(t), workspaceRoot: ""}
	handler := NewDynamicModuleHandler(service)

	handler.RegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", `{"name":"invalid"}`))
	handler.GenerateAndRegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", `{"schema":{"scope":"business","name":"demo","displayName":"Demo","model":{"tableName":"biz_demo"}}}`))
	handler.GetModuleSchema(newDynamicModuleJSONContext(http.MethodGet, "/?module=invalid", ""))

	req := &scaffold.ModuleSchema{}
	applyGenerateSchemaRawMetadata([]byte(`{"schema":{"metadata":{"autoRecycle":true}}}`), req)
	if !req.Metadata.AutoRecycle {
		t.Fatal("expected autoRecycle metadata to be applied")
	}

	if isGenerateValidationError(json.Unmarshal([]byte("{"), &map[string]interface{}{})) {
		t.Fatal("expected unmatched errors to stay outside validation classification")
	}
	if !isGenerateValidationError(assertDynamicModuleErr(dynamicModuleInvalidNameErrorKey)) {
		t.Fatal("expected module invalid-name error to be treated as validation error")
	}
	if isGenerateValidationError(assertDynamicModuleErr("module.generate.unexpected")) {
		t.Fatal("expected unknown generate error to be non-validation")
	}
}

func assertDynamicModuleErr(message string) error {
	return &dynamicModuleError{message: message}
}

type dynamicModuleError struct {
	message string
}

func (e *dynamicModuleError) Error() string {
	return e.message
}
