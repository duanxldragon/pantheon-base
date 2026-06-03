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
	if err := service.validateDeptUpdate(&SystemDept{ID: 1, IsRoot: 1}, &DeptUpdateReq{ParentID: 2, Status: 1}); err == nil || err.Error() != "dept.root.parent_fixed" {
		t.Fatalf("expected root-parent-fixed error, got %v", err)
	}
	if err := service.validateDeptUpdate(&SystemDept{ID: 1, IsRoot: 1}, &DeptUpdateReq{ParentID: 0, Status: 2}); err == nil || err.Error() != "dept.root.status_fixed" {
		t.Fatalf("expected root-status-fixed error, got %v", err)
	}
	if err := service.validateDeptUpdate(&SystemDept{ID: 9}, &DeptUpdateReq{ParentID: 0, Status: 1}); err == nil || err.Error() != "dept.parent.required" {
		t.Fatalf("expected non-root parent-required error, got %v", err)
	}
	if _, _, err := service.resolveDeptLeaderFields(0, "", 1); err == nil || err.Error() != "dept.leader.bind_after_create" {
		t.Fatalf("expected leader-bind-after-create resolve error, got %v", err)
	}
}

func TestDeptService_NilDBPublicGuards(t *testing.T) {
	service := NewDeptService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"get tree", func() error { _, err := service.GetDeptTree(nil); return err }},
		{"get overview", func() error { _, err := service.GetOverview(); return err }},
		{"list governance tasks", func() error { _, err := service.ListGovernanceTasks(nil); return err }},
		{"list leader candidates", func() error { _, err := service.ListLeaderCandidates(1); return err }},
		{"create dept", func() error {
			_, err := service.CreateDept(&DeptCreateReq{ParentID: 1, DeptName: "研发中心", Status: 1})
			return err
		}},
		{"update dept", func() error {
			_, err := service.UpdateDept(1, &DeptUpdateReq{ParentID: 1, DeptName: "研发中心", Status: 1})
			return err
		}},
		{"delete dept", func() error { return service.DeleteDept(1) }},
		{"batch update status", func() error { _, err := service.BatchUpdateDeptStatus([]uint64{1}, 1); return err }},
		{"batch update leader", func() error {
			_, err := service.BatchUpdateDeptLeader([]DeptBatchLeaderItem{{DeptID: 1, LeaderUserID: 1}})
			return err
		}},
		{"export depts", func() error { _, err := service.ExportDepts(nil); return err }},
		{"import depts", func() error { _, err := service.ImportDepts([][]string{{"deptName"}}); return err }},
		{"load dept post counts", func() error { _, err := service.loadDeptPostCounts(); return err }},
		{"load dept child counts", func() error { _, err := service.loadDeptChildCounts(); return err }},
		{"load dept user counts", func() error { _, err := service.loadDeptUserCounts(); return err }},
		{"load post user counts", func() error { _, err := service.loadPostUserCounts(); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != deptDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", deptDatabaseNotInitializedKey, err)
			}
		})
	}
}
