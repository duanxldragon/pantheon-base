package system

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRefreshTopicsFromQuery(t *testing.T) {
	query := RefreshStateQuery{Topics: "a,b"}

	topics := refreshTopicsFromQuery(query)
	if len(topics) != 2 || topics[0] != "a" || topics[1] != "b" {
		t.Fatalf("unexpected topics: %#v", topics)
	}
}

func TestRefreshSyncHelpers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("parse and normalize refresh topics", func(t *testing.T) {
		if parseRefreshTopicQuery("   ") != nil {
			t.Fatal("expected empty topic query to return nil")
		}

		topics := normalizeRefreshTopics([]string{" system:user:changed ", "", "system:menu:changed", "system:user:changed"})
		if !reflect.DeepEqual(topics, []string{"system:menu:changed", "system:user:changed"}) {
			t.Fatalf("unexpected normalized topics: %#v", topics)
		}
	})

	t.Run("isRefreshSyncSuccess tracks response status", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Status(http.StatusNoContent)
		if !isRefreshSyncSuccess(context) {
			t.Fatal("expected <400 status to be successful")
		}

		recorder = httptest.NewRecorder()
		context, _ = gin.CreateTestContext(recorder)
		context.Status(http.StatusBadRequest)
		if isRefreshSyncSuccess(context) {
			t.Fatal("expected >=400 status to be unsuccessful")
		}
	})
}
