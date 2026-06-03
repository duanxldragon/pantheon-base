package iam

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRoleHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewRoleHandler(NewRoleService(nil))

	handler.GetRoleList(newRoleJSONContext(http.MethodGet, "/?page=1", ""))
	handler.CreateRole(newRoleJSONContext(http.MethodPost, "/", `{"roleName":"审计员","roleKey":"auditor","status":1}`))
	handler.ExportRoles(newRoleJSONContext(http.MethodPost, "/", `{}`))

	context := newRoleJSONContext(http.MethodPut, "/", `{"roleName":"审计员","roleKey":"auditor","status":1}`)
	context.Params = gin.Params{{Key: roleParamID, Value: "1"}}
	handler.UpdateRole(context)

	handler.BatchUpdateRoleStatus(newRoleJSONContext(http.MethodPost, "/", `{"ids":[1],"status":1}`))
	handler.BatchDeleteRoles(newRoleJSONContext(http.MethodPost, "/", `{"ids":[1]}`))

	for _, fn := range []func(*gin.Context){
		handler.GetRoleMembers,
		handler.GetRoleMemberCandidates,
		handler.AddRoleMembers,
		handler.RemoveRoleMembers,
		handler.DeleteRole,
	} {
		context = newRoleJSONContext(http.MethodPost, "/", `{"userIds":[1]}`)
		context.Params = gin.Params{{Key: roleParamID, Value: "1"}}
		fn(context)
	}
}

func TestRoleService_GuardBranches(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

	if err := db.Create(&SystemRole{ID: 1, RoleName: "管理员", RoleKey: "admin", Status: 1}).Error; err != nil {
		t.Fatalf("seed admin role: %v", err)
	}
	if err := db.Create(&SystemRole{ID: 2, RoleName: "编辑", RoleKey: "editor", Status: 1}).Error; err != nil {
		t.Fatalf("seed editor role: %v", err)
	}

	if _, err := service.BatchUpdateRoleStatus(nil, 1); err == nil || err.Error() != "role.batch.empty" {
		t.Fatalf("expected empty role batch error, got %v", err)
	}
	if _, err := service.BatchUpdateRoleStatus([]uint64{2}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid role status error, got %v", err)
	}
	if _, err := service.BatchUpdateRoleStatus([]uint64{1}, 2); err == nil || err.Error() != "role.update.error.protected" {
		t.Fatalf("expected protected-role disable error, got %v", err)
	}
	if _, err := service.AddRoleMembers(2, nil); err == nil || err.Error() != "user.batch.empty" {
		t.Fatalf("expected empty add-member batch error, got %v", err)
	}
	if _, err := service.RemoveRoleMembers(2, nil); err == nil || err.Error() != "user.batch.empty" {
		t.Fatalf("expected empty remove-member batch error, got %v", err)
	}
	if err := service.validateRoleCreate(&RoleCreateReq{}); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid role create error, got %v", err)
	}
	if err := service.ensureRoleKeyUnique(0, "editor"); err == nil || err.Error() != "role.key.exists" {
		t.Fatalf("expected duplicate role key error, got %v", err)
	}
}
