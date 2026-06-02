package org

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newPostJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestPostHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewPostHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.CreatePost,
		handler.BatchUpdatePostStatus,
		handler.BatchDeletePosts,
		handler.ExportPosts,
	}
	for _, fn := range jsonCases {
		fn(newPostJSONContext(http.MethodPost, "/", "{"))
	}

	handler.GetPostList(newPostJSONContext(http.MethodGet, "/?page=bad", ""))

	context := newPostJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: postParamID, Value: "bad"}}
	handler.UpdatePost(context)

	context = newPostJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: postParamID, Value: "bad"}}
	handler.DeletePost(context)
}
