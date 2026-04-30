package platform

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/testmysql"

	"github.com/gin-gonic/gin"
)

func TestRegisterHealthRoutes_ReturnsDependencyState(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testmysql.Open(t)

	engine := gin.New()
	engine.Use(middleware.RequestContextMiddleware())
	api := engine.Group("/api/v1")
	RegisterHealthRoutes(api, db)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	req.Header.Set("X-Request-ID", "req-health-001")
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, req)
	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status code: %d", recorder.Code)
	}

	var resp struct {
		Status       string `json:"status"`
		RequestID    string `json:"requestId"`
		Dependencies map[string]struct {
			Status string `json:"status"`
		} `json:"dependencies"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal health response: %v", err)
	}
	if resp.Status != "ok" {
		t.Fatalf("expected ok health, got %s", resp.Status)
	}
	if resp.RequestID != "req-health-001" {
		t.Fatalf("expected request id in response, got %s", resp.RequestID)
	}
	if resp.Dependencies["database"].Status != "ok" {
		t.Fatalf("expected database dependency ok, got %+v", resp.Dependencies["database"])
	}
}
