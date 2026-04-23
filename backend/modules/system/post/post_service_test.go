package system

import (
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupPostTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&SystemPost{}); err != nil {
		t.Fatalf("migrate post: %v", err)
	}
	if err := db.Exec("CREATE TABLE IF NOT EXISTS system_user (id INTEGER PRIMARY KEY, post_id INTEGER, deleted_at DATETIME)").Error; err != nil {
		t.Fatalf("create user fixture: %v", err)
	}
	if err := db.Exec("CREATE TABLE IF NOT EXISTS system_dept (id INTEGER PRIMARY KEY, parent_id INTEGER, is_root INTEGER, dept_name TEXT)").Error; err != nil {
		t.Fatalf("create dept fixture: %v", err)
	}
	if err := db.Exec("INSERT INTO system_dept (id, parent_id, is_root, dept_name) VALUES (1, 0, 1, 'Pantheon Base'), (10, 1, 0, '研发中心')").Error; err != nil {
		t.Fatalf("seed dept fixture: %v", err)
	}
	return db
}

func TestPostService_DeleteReleasesPostCode(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	created, err := service.CreatePost(&PostCreateReq{
		PostCode: "developer",
		PostName: "Developer",
		DeptID:   10,
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create post: %v", err)
	}
	if err := service.DeletePost(created.ID); err != nil {
		t.Fatalf("delete post: %v", err)
	}

	var deleted SystemPost
	if err := db.Unscoped().First(&deleted, created.ID).Error; err != nil {
		t.Fatalf("load deleted post: %v", err)
	}
	if !strings.HasPrefix(deleted.PostCode, deletedPostCodePrefix) {
		t.Fatalf("expected archived post code, got %s", deleted.PostCode)
	}

	recreated, err := service.CreatePost(&PostCreateReq{
		PostCode: "developer",
		PostName: "Developer",
		DeptID:   10,
		Status:   1,
	})
	if err != nil {
		t.Fatalf("recreate post with same code: %v", err)
	}
	if recreated.PostCode != "developer" {
		t.Fatalf("expected developer, got %s", recreated.PostCode)
	}
}

func TestPostService_DeleteIgnoresSoftDeletedUsers(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	created, err := service.CreatePost(&PostCreateReq{
		PostCode: "ops",
		PostName: "Operations",
		DeptID:   10,
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create post: %v", err)
	}
	if err := db.Exec("INSERT INTO system_user (id, post_id, deleted_at) VALUES (1, ?, ?)", created.ID, time.Now()).Error; err != nil {
		t.Fatalf("seed soft deleted user: %v", err)
	}

	if err := service.DeletePost(created.ID); err != nil {
		t.Fatalf("delete post with soft deleted user: %v", err)
	}
}

func TestPostService_MigrateReleasesLegacyDeletedPostCode(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	legacy := SystemPost{
		DeptID:   10,
		PostCode: "legacy_post",
		PostName: "Legacy Post",
		Status:   1,
	}
	if err := db.Create(&legacy).Error; err != nil {
		t.Fatalf("seed legacy post: %v", err)
	}
	if err := db.Model(&legacy).Update("deleted_at", time.Now()).Error; err != nil {
		t.Fatalf("soft delete legacy post: %v", err)
	}

	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate post: %v", err)
	}
	var repaired SystemPost
	if err := db.Unscoped().First(&repaired, legacy.ID).Error; err != nil {
		t.Fatalf("load repaired post: %v", err)
	}
	if !strings.HasPrefix(repaired.PostCode, deletedPostCodePrefix) {
		t.Fatalf("expected archived legacy post code, got %s", repaired.PostCode)
	}

	if _, err := service.CreatePost(&PostCreateReq{DeptID: 10, PostCode: "legacy_post", PostName: "Legacy Post", Status: 1}); err != nil {
		t.Fatalf("expected legacy post code to be reusable: %v", err)
	}
}

func TestPostService_BatchUpdatePostStatus(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	created, err := service.CreatePost(&PostCreateReq{
		PostCode: "batch_post",
		PostName: "Batch Post",
		DeptID:   10,
		Status:   1,
	})
	if err != nil {
		t.Fatalf("create post: %v", err)
	}

	updated, err := service.BatchUpdatePostStatus([]uint64{created.ID, created.ID}, 2)
	if err != nil {
		t.Fatalf("batch disable post: %v", err)
	}
	if updated != 1 {
		t.Fatalf("expected 1 updated post, got %d", updated)
	}
	var disabled SystemPost
	if err := db.First(&disabled, created.ID).Error; err != nil {
		t.Fatalf("load disabled post: %v", err)
	}
	if disabled.Status != 2 {
		t.Fatalf("expected post status 2, got %d", disabled.Status)
	}

	if _, err := service.BatchUpdatePostStatus([]uint64{999}, 1); err == nil || err.Error() != "post.batch.not_found" {
		t.Fatalf("expected not found error, got %v", err)
	}
}

func TestPostService_ImportTemplateAndExport(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	template := service.BuildPostImportTemplate()
	if len(template.Rows) == 0 || !strings.HasPrefix(template.Rows[0][0], "#") {
		t.Fatalf("expected template to include ignored instruction rows, got %+v", template.Rows)
	}
	templateResult, err := service.ImportPosts(append([][]string{template.Headers}, template.Rows...))
	if err != nil {
		t.Fatalf("import template comments: %v", err)
	}
	if !templateResult.Applied || templateResult.Created != 0 || templateResult.Failed != 0 {
		t.Fatalf("expected template comments to be ignored, got %+v", templateResult)
	}

	result, err := service.ImportPosts([][]string{
		template.Headers,
		{"Pantheon Base/研发中心", "developer", "研发工程师", "10", "1", "负责研发交付"},
	})
	if err != nil {
		t.Fatalf("import post: %v", err)
	}
	if !result.Applied || result.Created != 1 || result.Failed != 0 {
		t.Fatalf("unexpected import result: %+v", result)
	}

	exported, err := service.ExportPosts(&PostListQuery{PostCode: "developer"})
	if err != nil {
		t.Fatalf("export post: %v", err)
	}
	if len(exported.Rows) != 1 || exported.Rows[0][1] != "developer" || exported.Rows[0][2] != "研发工程师" {
		t.Fatalf("unexpected export rows: %+v", exported.Rows)
	}
}
