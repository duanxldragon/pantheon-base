package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"pantheon-platform/backend/pkg/common"

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

func TestAuthHandlerServiceErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewAuthHandler(NewAuthService(nil))

	context, _ := newAuthJSONContext(http.MethodPost, "/", `{"username":"demo","password":"ChangeMe123"}`)
	context.Request.Header.Set(userAgentHeaderKey, "Codex/Test")
	handler.LoginHandler(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"challengeId":"challenge-1","code":"123456"}`)
	context.Request.Header.Set(userAgentHeaderKey, "Codex/Test")
	handler.VerifyMFAHandler(context)

	refreshToken, _, err := common.GenerateRefreshToken(1, "demo", nil, "session-1", "refresh-1")
	if err != nil {
		t.Fatalf("generate refresh token: %v", err)
	}
	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"refreshToken":"`+refreshToken+`"}`)
	context.Request.Header.Set(userAgentHeaderKey, "Codex/Test")
	handler.RefreshTokenHandler(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	context.Set("userID", uint64(1))
	handler.GetCurrentUserInfo(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"oldPassword":"oldpassword","newPassword":"ChangeMe123"}`)
	context.Set("userID", uint64(1))
	context.Set(sessionIDContextKey, "session-1")
	handler.UpdatePassword(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	handler.GetLoginLogList(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	handler.GetSecurityEventList(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"acknowledgementNote":"handled"}`)
	context.Set("userID", uint64(1))
	context.Set(usernameContextKey, "admin")
	context.Params = gin.Params{{Key: idParamKey, Value: "1"}}
	handler.AcknowledgeSecurityEvent(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{}`)
	handler.ExportLoginLogs(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"retentionDays":30}`)
	handler.CleanupLoginLogs(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"retentionDays":30}`)
	handler.CleanupHistoricSessions(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"sessionIds":["session-2"]}`)
	context.Set(sessionIDContextKey, "session-1")
	handler.BatchRevokeSessions(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"ids":[1]}`)
	handler.BatchDeleteLoginLogs(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	handler.GetSessionList(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", "")
	context.Set(sessionIDContextKey, "session-1")
	context.Params = gin.Params{{Key: idParamKey, Value: "session-2"}}
	handler.RevokeAnySession(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	context.Set("userID", uint64(1))
	context.Set(usernameContextKey, "admin")
	context.Set(sessionIDContextKey, "session-1")
	handler.GetSecurityOverview(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", `{"password":"ChangeMe123"}`)
	context.Set("userID", uint64(1))
	context.Set(sessionIDContextKey, "session-1")
	handler.VerifyOperationPassword(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", "")
	context.Set("userID", uint64(1))
	context.Set(sessionIDContextKey, "session-1")
	context.Request.Header.Set(userAgentHeaderKey, "Codex/Test")
	handler.TouchActivity(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", "")
	context.Set(sessionIDContextKey, "session-1")
	handler.LogoutHandler(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	context.Set("userID", uint64(1))
	context.Set(sessionIDContextKey, "session-1")
	handler.GetSessions(context)

	context, _ = newAuthJSONContext(http.MethodPost, "/", "")
	context.Params = gin.Params{{Key: idParamKey, Value: "session-2"}}
	handler.RevokeSession(context)

	context, _ = newAuthJSONContext(http.MethodGet, "/", "")
	context.Set(usernameContextKey, "admin")
	handler.GetOwnLoginLogs(context)
}
