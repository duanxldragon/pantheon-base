package dashboard

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRegisterDashboardRoutes_UsesDashboardPathAndKeepsLegacyPlatformPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	engine := gin.New()
	api := engine.Group("/api/v1")
	handler := NewDashboardHandler(NewDashboardService(nil))
	auth := func(c *gin.Context) {
		c.Set("userId", uint64(1))
		c.Next()
	}

	registerDashboardRoutes(api, auth, handler)

	for _, path := range []string{"/api/v1/dashboard/summary", "/api/v1/platform/dashboard/summary"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			recorder := httptest.NewRecorder()

			engine.ServeHTTP(recorder, req)

			if recorder.Code == http.StatusNotFound {
				t.Fatalf("expected dashboard route to be registered for %s", path)
			}
		})
	}
}
