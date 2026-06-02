package org

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestParseDeptUintPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: deptParamID, Value: "15"}}

		value, err := parseDeptUintPathParam(context, deptParamID)
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if value != 15 {
			t.Fatalf("expected parsed value 15, got %d", value)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Params = gin.Params{{Key: deptParamID, Value: "invalid"}}

		if _, err := parseDeptUintPathParam(context, deptParamID); err == nil {
			t.Fatal("expected parse error for invalid id")
		}
	})
}
