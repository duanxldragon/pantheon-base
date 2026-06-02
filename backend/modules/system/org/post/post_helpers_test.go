package org

import (
	"reflect"
	"testing"
)

func TestPostHelpers(t *testing.T) {
	t.Run("post pagination sorting and status use safe defaults", func(t *testing.T) {
		page, pageSize := normalizePostPageQuery(nil)
		if page != 1 || pageSize != 10 {
			t.Fatalf("unexpected default pagination: %d %d", page, pageSize)
		}

		page, pageSize = normalizePostPageQuery(&PostListQuery{Page: 2, PageSize: 999})
		if page != 2 || pageSize != 100 {
			t.Fatalf("unexpected normalized pagination: %d %d", page, pageSize)
		}

		column, desc := normalizePostSort(&PostListQuery{SortField: " postName ", SortOrder: " DESC "})
		if column != "post_name" || !desc {
			t.Fatalf("unexpected post sort: %s %v", column, desc)
		}

		if normalizePostStatus(0) != 1 || normalizePostStatus(2) != 2 {
			t.Fatal("unexpected post status normalization")
		}
	})

	t.Run("post governance helpers describe in-use and disabled state", func(t *testing.T) {
		if !reflect.DeepEqual(normalizePostIDs([]uint64{0, 4, 4, 9}), []uint64{4, 9}) {
			t.Fatal("unexpected post ids")
		}
		if !reflect.DeepEqual(buildPostGovernanceTags(2, 3), []string{"in-use", "disabled"}) {
			t.Fatal("unexpected governance tags")
		}
		if !reflect.DeepEqual(buildPostGovernanceBlockers(1), []string{"users"}) {
			t.Fatal("unexpected governance blockers")
		}
		if !reflect.DeepEqual(buildPostGovernanceActions(2, 1), []string{"reassign-users", "review-status"}) {
			t.Fatal("unexpected governance actions")
		}
		if !reflect.DeepEqual(buildPostGovernanceActions(1, 0), []string{"keep-observing"}) {
			t.Fatal("expected clean post to keep observing")
		}
	})
}
