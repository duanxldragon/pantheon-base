package dynamicmodule

import (
	"net/http"
	"testing"

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
