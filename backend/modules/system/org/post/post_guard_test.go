package org

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPostHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewPostHandler(NewPostService(nil))

	handler.GetPostList(newPostJSONContext(http.MethodGet, "/?page=1", ""))
	handler.CreatePost(newPostJSONContext(http.MethodPost, "/", `{"deptId":1,"postCode":"developer","postName":"研发工程师","status":1}`))

	context := newPostJSONContext(http.MethodPut, "/", `{"deptId":1,"postCode":"developer","postName":"研发工程师","status":1}`)
	context.Params = gin.Params{{Key: postParamID, Value: "1"}}
	handler.UpdatePost(context)

	handler.BatchUpdatePostStatus(newPostJSONContext(http.MethodPost, "/", `{"postIds":[1],"status":1}`))

	context = newPostJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: postParamID, Value: "1"}}
	handler.DeletePost(context)

	handler.BatchDeletePosts(newPostJSONContext(http.MethodPost, "/", `{"ids":[1]}`))
	handler.ExportPosts(newPostJSONContext(http.MethodPost, "/", `{}`))
}

func TestPostService_GuardBranches(t *testing.T) {
	db := setupPostTestDB(t)
	service := NewPostService(db)

	if _, err := service.BatchUpdatePostStatus(nil, 1); err == nil || err.Error() != "post.batch.empty" {
		t.Fatalf("expected empty post batch error, got %v", err)
	}
	if _, err := service.BatchUpdatePostStatus([]uint64{1}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid post status error, got %v", err)
	}
	if err := service.validatePostCreate(0, "", 1); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected blank post code error, got %v", err)
	}
	if err := service.ensurePostDeptID(0); err == nil || err.Error() != "post.dept.required" {
		t.Fatalf("expected missing dept error, got %v", err)
	}
	if err := service.ensurePostDeptID(999); err == nil || err.Error() != "post.dept.invalid" {
		t.Fatalf("expected invalid dept error, got %v", err)
	}
	if err := service.ensurePostDeptID(1); err == nil || err.Error() != postDeptRootForbiddenKey {
		t.Fatalf("expected root-dept forbidden error, got %v", err)
	}
}

func TestPostService_NilDBPublicGuards(t *testing.T) {
	service := NewPostService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"list posts", func() error { _, err := service.ListPosts(nil); return err }},
		{"create post", func() error {
			_, err := service.CreatePost(&PostCreateReq{DeptID: 1, PostCode: "developer", PostName: "研发工程师", Status: 1})
			return err
		}},
		{"update post", func() error {
			_, err := service.UpdatePost(1, &PostUpdateReq{DeptID: 1, PostCode: "developer", PostName: "研发工程师", Status: 1})
			return err
		}},
		{"delete post", func() error { return service.DeletePost(1) }},
		{"batch update status", func() error { _, err := service.BatchUpdatePostStatus([]uint64{1}, 1); return err }},
		{"export posts", func() error { _, err := service.ExportPosts(nil); return err }},
		{"import posts", func() error { _, err := service.ImportPosts([][]string{{"deptPath"}}); return err }},
		{"load post user counts", func() error { _, err := service.loadPostUserCounts(); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != postDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", postDatabaseNotInitializedKey, err)
			}
		})
	}
}
