package iam

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParsePermissionUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: permissionParamID, Value: "42"}}

		value, err := parsePermissionUintPathParam(context, permissionParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 42 {
			t.Fatalf("expected parsed value 42, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: permissionParamID, Value: "invalid"}}

		if _, err := parsePermissionUintPathParam(context, permissionParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
