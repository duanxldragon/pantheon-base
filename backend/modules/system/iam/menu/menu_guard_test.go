package iam

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newMenuJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestMenuHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewMenuHandler(NewMenuService(nil))

	handler.GetMenuTree(newMenuJSONContext(http.MethodGet, "/?scope=manage", ""))
	handler.CreateMenu(newMenuJSONContext(http.MethodPost, "/", `{"type":"M","titleKey":"system.menu.demo","path":"/demo"}`))

	context := newMenuJSONContext(http.MethodPut, "/", `{"type":"M","titleKey":"system.menu.demo","path":"/demo"}`)
	context.Params = gin.Params{{Key: menuParamID, Value: "1"}}
	handler.UpdateMenu(context)

	context = newMenuJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: menuParamID, Value: "1"}}
	handler.DeleteMenu(context)
}

func TestMenuService_GuardBranches(t *testing.T) {
	db := setupMenuTestDB(t)
	service := NewMenuService(db)

	if err := service.validateMenuCreate(&MenuCreateReq{Type: "C"}); err == nil || err.Error() != "menu.route_name.required" {
		t.Fatalf("expected route-name-required error, got %v", err)
	}
	if err := service.validateMenuCreate(&MenuCreateReq{Type: "M", ParentID: 999, Path: "/demo"}); err == nil || err.Error() != "menu.parent.not_found" {
		t.Fatalf("expected parent-not-found error, got %v", err)
	}
	if err := service.validateMenuUpdate(8, &MenuUpdateReq{ParentID: 8, Type: "M", Path: "/demo"}); err == nil || err.Error() != "menu.update.error.parent_self" {
		t.Fatalf("expected parent-self update error, got %v", err)
	}

	if err := db.Create(&SystemMenu{ID: 1, TitleKey: "system.menu.demo", Path: "/demo", Type: "M"}).Error; err != nil {
		t.Fatalf("seed menu: %v", err)
	}
	if err := service.ensurePathUnique(0, "/demo"); err == nil || err.Error() != "menu.path.exists" {
		t.Fatalf("expected duplicate path error, got %v", err)
	}
}
