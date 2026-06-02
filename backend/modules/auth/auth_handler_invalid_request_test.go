package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newAuthJSONContext(method, target, body string) (*gin.Context, *httptest.ResponseRecorder) {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context, recorder
}

func TestAuthHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewAuthHandler(nil)

	t.Run("invalid json and query requests return early", func(t *testing.T) {
		jsonCases := []func(*gin.Context){
			handler.LoginHandler,
			handler.VerifyMFAHandler,
			handler.RefreshTokenHandler,
			handler.UpdateCurrentUserPreferences,
			handler.UpdatePassword,
			handler.ExportLoginLogs,
			handler.CleanupLoginLogs,
			handler.CleanupHistoricSessions,
			handler.BatchRevokeSessions,
			handler.BatchDeleteLoginLogs,
			handler.VerifyOperationPassword,
		}

		for _, fn := range jsonCases {
			context, _ := newAuthJSONContext(http.MethodPost, "/", "{")
			fn(context)
		}

		queryCases := []func(*gin.Context){
			handler.GetLoginLogList,
			handler.GetSecurityEventList,
			handler.GetSessionList,
			handler.GetOwnLoginLogs,
		}

		for _, fn := range queryCases {
			context, _ := newAuthJSONContext(http.MethodGet, "/?page=bad", "")
			fn(context)
		}
	})

	t.Run("invalid path params return early", func(t *testing.T) {
		context, _ := newAuthJSONContext(http.MethodPost, "/", `{"acknowledgementNote":"ok"}`)
		context.Params = gin.Params{{Key: idParamKey, Value: "bad"}}
		handler.AcknowledgeSecurityEvent(context)
	})
}
