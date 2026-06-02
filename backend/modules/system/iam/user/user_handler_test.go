package iam

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseUserUintParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: userParamID, Value: "19"}}

		value, err := parseUserUintParam(context, userParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 19 {
			t.Fatalf("expected parsed value 19, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: userParamID, Value: "invalid"}}

		if _, err := parseUserUintParam(context, userParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
