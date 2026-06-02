package dynamicmodule

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newDynamicModuleJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestDynamicModuleHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewDynamicModuleHandler(nil)

	handler.RegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", "{"))
	handler.GenerateAndRegisterModule(newDynamicModuleJSONContext(http.MethodPost, "/", "{"))
}
