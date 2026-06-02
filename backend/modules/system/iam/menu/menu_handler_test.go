package iam

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseMenuUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: menuParamID, Value: "7"}}

		value, err := parseMenuUintPathParam(context, menuParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 7 {
			t.Fatalf("expected parsed value 7, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: menuParamID, Value: "invalid"}}

		if _, err := parseMenuUintPathParam(context, menuParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
