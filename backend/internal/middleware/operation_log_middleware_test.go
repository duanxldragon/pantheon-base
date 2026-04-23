package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"pantheon-platform/backend/pkg/common"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupOperationLogTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:operation_log_test?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&SystemLogOper{}); err != nil {
		t.Fatalf("migrate operation log: %v", err)
	}
	return db
}

func waitOperationLog(t *testing.T, db *gorm.DB) SystemLogOper {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		var log SystemLogOper
		err := db.Order("id desc").First(&log).Error
		if err == nil {
			return log
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("operation log not written in time")
	return SystemLogOper{}
}

func TestOperationLogMiddleware_UsesAuditOverrides(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupOperationLogTestDB(t)

	engine := gin.New()
	engine.Use(OperationLogMiddleware(db))
	engine.POST("/import", func(c *gin.Context) {
		common.SetAuditMetadata(c, "导入测试", common.BusinessImport)
		common.SetAuditParam(c, `{"fileName":"demo.csv","fileSize":128}`)
		common.SetAuditResult(c, `{"applied":false,"failed":2}`)
		common.SetAuditStatus(c, 2)
		common.SetAuditErrorMsg(c, "import.result.has_errors")
		common.Success(c, gin.H{
			"applied": false,
			"failed":  2,
		})
	})

	req := httptest.NewRequest(http.MethodPost, "/import", strings.NewReader("ignored"))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=demo")
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, req)
	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status code: %d", recorder.Code)
	}

	log := waitOperationLog(t, db)
	if log.Status != 2 {
		t.Fatalf("expected overridden status=2, got %d", log.Status)
	}
	if log.ErrorMsg != "import.result.has_errors" {
		t.Fatalf("expected overridden error msg, got %s", log.ErrorMsg)
	}
	if log.OperParam != `{"fileName":"demo.csv","fileSize":128}` {
		t.Fatalf("unexpected audit param: %s", log.OperParam)
	}
	if log.JsonResult != `{"applied":false,"failed":2}` {
		t.Fatalf("unexpected audit result: %s", log.JsonResult)
	}
}
