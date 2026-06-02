package org

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParsePostUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: postParamID, Value: "8"}}

		value, err := parsePostUintPathParam(context, postParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 8 {
			t.Fatalf("expected parsed value 8, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: postParamID, Value: "invalid"}}

		if _, err := parsePostUintPathParam(context, postParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
