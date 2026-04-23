package system

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupDeptTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	return db
}

func TestDeptService_MigrateCreatesRootAndReparentsTopLevel(t *testing.T) {
	db := setupDeptTestDB(t)
	if err := db.AutoMigrate(&SystemDept{}); err != nil {
		t.Fatalf("migrate dept table: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_dept (id, parent_id, ancestors, is_root, dept_name, status) VALUES (10, 0, '', 0, '研发中心', 1)`).Error; err != nil {
		t.Fatalf("seed dept 10: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_dept (id, parent_id, ancestors, is_root, dept_name, status) VALUES (11, 10, '10', 0, '平台研发部', 1)`).Error; err != nil {
		t.Fatalf("seed dept 11: %v", err)
	}
	if err := db.Exec(`INSERT INTO system_dept (id, parent_id, ancestors, is_root, dept_name, status) VALUES (12, 0, '', 0, '财务部', 1)`).Error; err != nil {
		t.Fatalf("seed dept 12: %v", err)
	}

	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}

	var roots []SystemDept
	if err := db.Where("is_root = ?", 1).Find(&roots).Error; err != nil {
		t.Fatalf("load root depts: %v", err)
	}
	if len(roots) != 1 {
		t.Fatalf("expected 1 root dept, got %d", len(roots))
	}

	root := roots[0]
	if root.ParentID != 0 || root.Ancestors != "" {
		t.Fatalf("expected root parent/ancestors to be zero/empty, got parent=%d ancestors=%q", root.ParentID, root.Ancestors)
	}

	var rdDept SystemDept
	if err := db.First(&rdDept, 10).Error; err != nil {
		t.Fatalf("load dept 10: %v", err)
	}
	if rdDept.ParentID != root.ID {
		t.Fatalf("expected dept 10 parent to be root %d, got %d", root.ID, rdDept.ParentID)
	}
	if rdDept.Ancestors != fmt.Sprintf("%d", root.ID) {
		t.Fatalf("expected dept 10 ancestors to be root id, got %q", rdDept.Ancestors)
	}

	var childDept SystemDept
	if err := db.First(&childDept, 11).Error; err != nil {
		t.Fatalf("load dept 11: %v", err)
	}
	expectedAncestors := fmt.Sprintf("%d,%d", root.ID, rdDept.ID)
	if childDept.Ancestors != expectedAncestors {
		t.Fatalf("expected child ancestors %q, got %q", expectedAncestors, childDept.Ancestors)
	}
}

func TestDeptService_DeleteDeptRejectsRoot(t *testing.T) {
	db := setupDeptTestDB(t)
	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}

	var root SystemDept
	if err := db.Where("is_root = ?", 1).First(&root).Error; err != nil {
		t.Fatalf("load root dept: %v", err)
	}

	err := service.DeleteDept(root.ID)
	if err == nil || err.Error() != "dept.root.delete_forbidden" {
		t.Fatalf("expected root delete forbidden, got %v", err)
	}
}

func TestDeptService_DeleteIgnoresSoftDeletedUsers(t *testing.T) {
	db := setupDeptTestDB(t)
	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}
	if err := db.Exec("CREATE TABLE IF NOT EXISTS system_user (id INTEGER PRIMARY KEY, dept_id INTEGER, deleted_at DATETIME)").Error; err != nil {
		t.Fatalf("create user fixture: %v", err)
	}

	var root SystemDept
	if err := db.Where("is_root = ?", 1).First(&root).Error; err != nil {
		t.Fatalf("load root dept: %v", err)
	}
	child := SystemDept{
		ParentID:  root.ID,
		Ancestors: fmt.Sprintf("%d", root.ID),
		DeptName:  "运维部",
		Status:    1,
	}
	if err := db.Create(&child).Error; err != nil {
		t.Fatalf("seed child dept: %v", err)
	}
	if err := db.Exec("INSERT INTO system_user (id, dept_id, deleted_at) VALUES (1, ?, ?)", child.ID, time.Now()).Error; err != nil {
		t.Fatalf("seed soft deleted user: %v", err)
	}

	if err := service.DeleteDept(child.ID); err != nil {
		t.Fatalf("delete dept with soft deleted user: %v", err)
	}
}

func TestDeptService_BatchUpdateDeptStatus(t *testing.T) {
	db := setupDeptTestDB(t)
	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}

	var root SystemDept
	if err := db.Where("is_root = ?", 1).First(&root).Error; err != nil {
		t.Fatalf("load root dept: %v", err)
	}
	child := SystemDept{
		ParentID:  root.ID,
		Ancestors: fmt.Sprintf("%d", root.ID),
		DeptName:  "研发中心",
		Status:    1,
	}
	if err := db.Create(&child).Error; err != nil {
		t.Fatalf("seed child dept: %v", err)
	}

	updated, err := service.BatchUpdateDeptStatus([]uint64{child.ID, child.ID}, 2)
	if err != nil {
		t.Fatalf("batch disable dept: %v", err)
	}
	if updated != 1 {
		t.Fatalf("expected 1 updated dept, got %d", updated)
	}
	var disabled SystemDept
	if err := db.First(&disabled, child.ID).Error; err != nil {
		t.Fatalf("load disabled dept: %v", err)
	}
	if disabled.Status != 2 {
		t.Fatalf("expected dept status 2, got %d", disabled.Status)
	}

	if _, err := service.BatchUpdateDeptStatus([]uint64{root.ID}, 2); err == nil || err.Error() != "dept.root.status_fixed" {
		t.Fatalf("expected root status fixed error, got %v", err)
	}
}

func TestDeptService_GetDeptTreeIncludesAncestorsForSearch(t *testing.T) {
	db := setupDeptTestDB(t)
	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}

	var root SystemDept
	if err := db.Where("is_root = ?", 1).First(&root).Error; err != nil {
		t.Fatalf("load root dept: %v", err)
	}
	if err := db.Create(&SystemDept{
		ParentID:  root.ID,
		Ancestors: fmt.Sprintf("%d", root.ID),
		DeptName:  "研发中心",
		Status:    1,
	}).Error; err != nil {
		t.Fatalf("seed child dept: %v", err)
	}

	tree, err := service.GetDeptTree(&DeptListQuery{DeptName: "研发"})
	if err != nil {
		t.Fatalf("get dept tree: %v", err)
	}
	if len(tree) != 1 {
		t.Fatalf("expected root node in search tree, got %d nodes", len(tree))
	}
	if !tree[0].IsRoot {
		t.Fatalf("expected first node to be root")
	}
	if len(tree[0].Children) != 1 || tree[0].Children[0].DeptName != "研发中心" {
		t.Fatalf("expected matched child under root, got %+v", tree[0].Children)
	}
}

func TestDeptService_ImportTemplateAndExport(t *testing.T) {
	db := setupDeptTestDB(t)
	service := NewDeptService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate dept service: %v", err)
	}

	template := service.BuildDeptImportTemplate()
	if len(template.Rows) == 0 || !strings.HasPrefix(template.Rows[0][0], "#") {
		t.Fatalf("expected template to include ignored instruction rows, got %+v", template.Rows)
	}
	templateResult, err := service.ImportDepts(append([][]string{template.Headers}, template.Rows...))
	if err != nil {
		t.Fatalf("import template comments: %v", err)
	}
	if !templateResult.Applied || templateResult.Created != 0 || templateResult.Failed != 0 {
		t.Fatalf("expected template comments to be ignored, got %+v", templateResult)
	}

	var root SystemDept
	if err := db.Where("is_root = ?", 1).First(&root).Error; err != nil {
		t.Fatalf("load root dept: %v", err)
	}
	result, err := service.ImportDepts([][]string{
		template.Headers,
		{root.DeptName, "研发中心", "10", "张三", "13800138000", "rd@example.com", "1"},
	})
	if err != nil {
		t.Fatalf("import dept: %v", err)
	}
	if !result.Applied || result.Created != 1 || result.Failed != 0 {
		t.Fatalf("unexpected import result: %+v", result)
	}

	exported, err := service.ExportDepts(&DeptListQuery{DeptName: "研发"})
	if err != nil {
		t.Fatalf("export dept: %v", err)
	}
	if len(exported.Rows) != 1 || exported.Rows[0][0] != root.DeptName || exported.Rows[0][1] != "研发中心" {
		t.Fatalf("unexpected export rows: %+v", exported.Rows)
	}
}
