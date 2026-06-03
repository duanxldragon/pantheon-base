package iam

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newPermissionJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestPermissionHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewPermissionHandler(NewPermissionService(nil))

	handler.GetWorkbench(newPermissionJSONContext(http.MethodGet, "/?roleKey=admin", ""))
	handler.ExportWorkbench(newPermissionJSONContext(http.MethodGet, "/?roleKey=admin", ""))
	handler.ListWorkbenchRemediationEvents(newPermissionJSONContext(http.MethodGet, "/?roleKey=admin", ""))
	handler.RemediateWorkbenchPolicies(newPermissionJSONContext(http.MethodPost, "/", `{"roleKey":"admin"}`))
	handler.ListDataScopePolicies(newPermissionJSONContext(http.MethodGet, "/", ""))

	context := newPermissionJSONContext(http.MethodPut, "/", `{"mode":"all"}`)
	context.Params = gin.Params{{Key: permissionRoleKeyParam, Value: "admin"}}
	handler.UpdateDataScopePolicy(context)

	handler.GetPolicyList(newPermissionJSONContext(http.MethodGet, "/?roleKey=admin", ""))
	handler.CreatePolicy(newPermissionJSONContext(http.MethodPost, "/", `{"roleKey":"admin","path":"/api/v1/system/user/list","method":"GET"}`))

	context = newPermissionJSONContext(http.MethodPut, "/", `{"roleKey":"admin","path":"/api/v1/system/user/list","method":"GET"}`)
	context.Params = gin.Params{{Key: permissionParamID, Value: "1"}}
	handler.UpdatePolicy(context)

	context = newPermissionJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: permissionParamID, Value: "1"}}
	handler.DeletePolicy(context)

	handler.BatchDeletePolicies(newPermissionJSONContext(http.MethodPost, "/", `{"ids":[1]}`))
	handler.ExportPolicies(newPermissionJSONContext(http.MethodPost, "/", `{}`))
}

func TestPermissionService_GuardBranches(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)

	if err := db.Create(&permissionTestRole{ID: 1, RoleName: "编辑", RoleKey: "editor", Status: 1, Sort: 1}).Error; err != nil {
		t.Fatalf("seed role: %v", err)
	}

	if _, err := service.UpdateDataScopePolicy("editor", nil); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected nil request data-scope error, got %v", err)
	}
	if _, err := service.UpdateDataScopePolicy("", &PermissionDataScopePolicyUpdateReq{Mode: "all"}); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank role key data-scope error, got %v", err)
	}
	if _, err := service.RemediateWorkbenchPolicies(&PermissionWorkbenchRemediateReq{}); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank role remediation error, got %v", err)
	}
	if _, err := service.RemediateWorkbenchPolicies(&PermissionWorkbenchRemediateReq{RoleKey: "missing"}); err == nil || err.Error() != "permission.role.invalid" {
		t.Fatalf("expected missing-role remediation error, got %v", err)
	}
	if _, _, _, err := service.validatePolicyPayload(0, "", "", ""); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank policy payload error, got %v", err)
	}
}
