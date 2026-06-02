package system

import "testing"

func TestRefreshTopicsFromQuery(t *testing.T) {
	query := RefreshStateQuery{Topics: "a,b"}

	topics := refreshTopicsFromQuery(query)
	if len(topics) != 2 || topics[0] != "a" || topics[1] != "b" {
		t.Fatalf("unexpected topics: %#v", topics)
	}
}
