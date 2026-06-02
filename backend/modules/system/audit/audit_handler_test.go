package system

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseAuditUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: auditParamID, Value: "31"}}

		value, err := parseAuditUintPathParam(context, auditParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 31 {
			t.Fatalf("expected parsed value 31, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: auditParamID, Value: "invalid"}}

		if _, err := parseAuditUintPathParam(context, auditParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
