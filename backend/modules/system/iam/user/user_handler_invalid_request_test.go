package iam

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newUserJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestUserHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewUserHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.UpdateProfile,
		handler.ExportUsers,
		handler.CreateUser,
		handler.BatchUpdateUserStatus,
		handler.BatchDeleteUsers,
	}
	for _, fn := range jsonCases {
		fn(newUserJSONContext(http.MethodPost, "/", "{"))
	}

	queryCases := []func(*gin.Context){
		handler.GetUserList,
	}
	for _, fn := range queryCases {
		fn(newUserJSONContext(http.MethodGet, "/?page=bad", ""))
	}

	pathCases := []func(*gin.Context){
		handler.GetUserDetail,
		handler.DeleteUser,
	}
	for _, fn := range pathCases {
		context := newUserJSONContext(http.MethodDelete, "/", "")
		context.Params = gin.Params{{Key: userParamID, Value: "bad"}}
		fn(context)
	}

	context := newUserJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: userParamID, Value: "bad"}}
	handler.UpdateUser(context)

	context = newUserJSONContext(http.MethodPost, "/", "{")
	context.Params = gin.Params{{Key: userParamID, Value: "bad"}}
	handler.ResetPassword(context)
}
