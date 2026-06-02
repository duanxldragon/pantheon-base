package config

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newSettingJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestSettingHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewSettingHandler(nil, nil)

	jsonCases := []func(*gin.Context){
		handler.UpdateSettingGroup,
		handler.RefreshSettingCache,
		handler.ExportSettingAudit,
	}
	for _, fn := range jsonCases {
		fn(newSettingJSONContext(http.MethodPost, "/", "{"))
	}
}
