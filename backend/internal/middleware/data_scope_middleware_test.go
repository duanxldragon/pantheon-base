package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/testmysql"

	"github.com/gin-gonic/gin"
)

func TestDataScopeMiddlewareInjectsRoleDeptScope(t *testing.T) {
	db := testmysql.Open(t)
	if err := db.Exec("CREATE TABLE system_user (id BIGINT PRIMARY KEY, dept_id BIGINT)").Error; err != nil {
		t.Fatalf("create user table: %v", err)
	}
	if err := MigrateDataScopePolicy(db); err != nil {
		t.Fatalf("migrate data scope policy: %v", err)
	}
	if err := db.Exec("INSERT INTO system_user (id, dept_id) VALUES (7, 42)").Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}
	if err := db.Create(&SystemRoleDataScope{RoleKey: "dept_role", Mode: common.DataScopeModeDept}).Error; err != nil {
		t.Fatalf("seed role data scope: %v", err)
	}

	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(func(c *gin.Context) {
		c.Set("userId", uint64(7))
		c.Set("roleKeys", []string{"dept_role"})
		c.Next()
	})
	engine.Use(DataScopeMiddleware(db))
	engine.GET("/scoped", func(c *gin.Context) {
		scope := common.GetDataScope(c)
		if scope == nil {
			t.Fatalf("expected data scope")
		}
		if scope.UserID != 7 || scope.DeptID != 42 || scope.Mode != common.DataScopeModeDept {
			t.Fatalf("unexpected data scope: %+v", scope)
		}
		common.Success(c, gin.H{"mode": scope.Mode})
	})

	req := httptest.NewRequest(http.MethodGet, "/scoped", nil)
	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected request to pass, got %d", recorder.Code)
	}
}
