package config

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseDictUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: dictParamID, Value: "23"}}

		value, err := parseDictUintPathParam(context, dictParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 23 {
			t.Fatalf("expected parsed value 23, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: dictParamID, Value: "invalid"}}

		if _, err := parseDictUintPathParam(context, dictParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
