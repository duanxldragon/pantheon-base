package auth

import (
	"errors"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"pantheon-platform/backend/pkg/common"

	"github.com/gin-gonic/gin"
)

func TestFailOnCSRFCookieErrorReturnsFalseWhenErrorIsNil(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)

	if failOnCSRFCookieError(context, nil) {
		t.Fatal("expected nil csrf error to be ignored")
	}
}

func TestFailOnCSRFCookieErrorWritesErrorResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)

	if !failOnCSRFCookieError(context, errors.New("csrf unavailable")) {
		t.Fatal("expected csrf error to be handled")
	}
	if recorder.Code != 200 {
		t.Fatalf("expected common failure payload status 200, got %d", recorder.Code)
	}
	if recorder.Body.Len() == 0 {
		t.Fatal("expected failure response body to be written")
	}
	if got := recorder.Header().Get("Content-Type"); got == "" {
		t.Fatal("expected failure response content type to be set")
	}
	if body := recorder.Body.String(); body == "" || !strings.Contains(body, `"code":`+strconv.Itoa(common.CodeError)) {
		t.Fatalf("expected failure response to include code %d, got %q", common.CodeError, body)
	}
}
