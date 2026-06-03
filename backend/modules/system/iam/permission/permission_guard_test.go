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
	handler.ImportPolicies(newPermissionJSONContext(http.MethodPost, "/", ""))
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

func TestPermissionService_NilDBPublicGuards(t *testing.T) {
	service := NewPermissionService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"list policies", func() error { _, err := service.ListPolicies(nil); return err }},
		{"create policy", func() error {
			_, err := service.CreatePolicy(&PermissionPolicyCreateReq{RoleKey: "admin", Path: "/api/demo", Method: "GET"})
			return err
		}},
		{"update policy", func() error {
			_, err := service.UpdatePolicy(1, &PermissionPolicyUpdateReq{RoleKey: "admin", Path: "/api/demo", Method: "GET"})
			return err
		}},
		{"delete policy", func() error { return service.DeletePolicy(1) }},
		{"export policies", func() error { _, err := service.ExportPolicies(nil); return err }},
		{"export workbench", func() error { _, err := service.ExportWorkbench(nil); return err }},
		{"remediate workbench", func() error {
			_, err := service.RemediateWorkbenchPolicies(&PermissionWorkbenchRemediateReq{RoleKey: "admin"})
			return err
		}},
		{"list remediation events", func() error { _, err := service.ListWorkbenchRemediationEvents(nil); return err }},
		{"import policies", func() error { _, err := service.ImportPolicies([][]string{{"roleKey"}}); return err }},
		{"get workbench", func() error { _, err := service.GetWorkbench(nil); return err }},
		{"list data scope policies", func() error { _, err := service.ListDataScopePolicies(nil); return err }},
		{"update data scope policy", func() error {
			_, err := service.UpdateDataScopePolicy("admin", &PermissionDataScopePolicyUpdateReq{Mode: "all"})
			return err
		}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != permissionDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", permissionDatabaseNotInitializedKey, err)
			}
		})
	}
}
