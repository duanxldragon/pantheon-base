package org

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestDeptHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewDeptHandler(NewDeptService(nil))

	handler.GetDeptTree(newDeptJSONContext(http.MethodGet, "/?page=1", ""))
	handler.GetDeptOverview(newDeptJSONContext(http.MethodGet, "/", ""))
	handler.GetGovernanceTasks(newDeptJSONContext(http.MethodGet, "/", ""))

	context := newDeptJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: deptParamID, Value: "1"}}
	handler.GetDeptLeaderCandidates(context)

	handler.CreateDept(newDeptJSONContext(http.MethodPost, "/", `{"parentId":1,"deptName":"研发中心","status":1}`))

	context = newDeptJSONContext(http.MethodPut, "/", `{"parentId":1,"deptName":"研发中心","status":1}`)
	context.Params = gin.Params{{Key: deptParamID, Value: "1"}}
	handler.UpdateDept(context)

	handler.BatchUpdateDeptStatus(newDeptJSONContext(http.MethodPost, "/", `{"ids":[1],"status":1}`))
	handler.BatchUpdateDeptLeader(newDeptJSONContext(http.MethodPost, "/", `{"items":[{"deptId":1,"leaderUserId":1}]}`))

	context = newDeptJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: deptParamID, Value: "1"}}
	handler.DeleteDept(context)

	handler.BatchDeleteDepts(newDeptJSONContext(http.MethodPost, "/", `{"ids":[1]}`))
	handler.ExportDepts(newDeptJSONContext(http.MethodPost, "/", `{}`))
	handler.ExportGovernanceTasks(newDeptJSONContext(http.MethodPost, "/", `{}`))
}

func TestDeptService_GuardBranches(t *testing.T) {
	service := NewDeptService(setupDeptTestDB(t))

	if err := service.validateDeptCreate(&DeptCreateReq{}); err == nil || err.Error() != "dept.parent.required" {
		t.Fatalf("expected missing-parent create error, got %v", err)
	}
	if err := service.validateDeptCreate(&DeptCreateReq{ParentID: 1, LeaderUserID: 1}); err == nil || err.Error() != "dept.leader.bind_after_create" {
		t.Fatalf("expected leader-bind-after-create error, got %v", err)
	}
	if err := validateDeptOptionalEmail("bad-email"); err == nil || err.Error() != "dept.email.invalid" {
		t.Fatalf("expected invalid email error, got %v", err)
	}
	if err := service.validateDeptUpdate(nil, &DeptUpdateReq{}); err == nil || err.Error() != "dept.not_found" {
		t.Fatalf("expected missing-dept update error, got %v", err)
	}
	if err := service.validateDeptUpdate(&SystemDept{ID: 8}, &DeptUpdateReq{ParentID: 8, Status: 1}); err == nil || err.Error() != "dept.update.error.parent_self" {
		t.Fatalf("expected self-parent update error, got %v", err)
	}
	if err := service.ensureDeptParentExists(999); err == nil || err.Error() != "dept.parent.not_found" {
		t.Fatalf("expected parent-not-found error, got %v", err)
	}
	if _, err := service.BatchUpdateDeptStatus(nil, 1); err == nil || err.Error() != "dept.batch.empty" {
		t.Fatalf("expected empty dept batch error, got %v", err)
	}
	if _, err := service.BatchUpdateDeptStatus([]uint64{1}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid dept status error, got %v", err)
	}
	if _, err := service.BatchUpdateDeptLeader(nil); err == nil || err.Error() != "dept.batch.empty" {
		t.Fatalf("expected empty dept leader batch error, got %v", err)
	}
}
