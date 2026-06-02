package generator

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGeneratorPathParam(t *testing.T) {
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Params = gin.Params{{Key: generatorParamID, Value: "ds-001"}}

	if value := generatorPathParam(context, generatorParamID); value != "ds-001" {
		t.Fatalf("expected path param ds-001, got %q", value)
	}
}
