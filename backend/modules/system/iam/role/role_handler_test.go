package iam

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseRoleUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: roleParamID, Value: "11"}}

		value, err := parseRoleUintPathParam(context, roleParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 11 {
			t.Fatalf("expected parsed value 11, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: roleParamID, Value: "invalid"}}

		if _, err := parseRoleUintPathParam(context, roleParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
