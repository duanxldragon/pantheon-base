package iam

import (
	"reflect"
	"testing"
)

func TestUserHelpers(t *testing.T) {
	t.Run("preference parsing and normalization keep supported values", func(t *testing.T) {
		preferences, err := parseRawUserPlatformPreferences(`{"theme":"indigo","locale":"en-US","navigationMode":"horizontal","density":"compact"}`)
		if err != nil {
			t.Fatalf("parse raw preferences: %v", err)
		}
		if preferences.Language != "en-US" || preferences.LayoutMode != "horizontal" || preferences.DensityMode != "compact" {
			t.Fatalf("unexpected parsed preferences: %#v", preferences)
		}

		if normalizePreferenceValue("light", allowedPreferenceThemes) != "" {
			t.Fatal("expected unsupported preference value to be dropped")
		}
	})

	t.Run("user paging sort and ids normalize", func(t *testing.T) {
		if normalizeStatus(0) != 1 || normalizeStatus(2) != 2 {
			t.Fatal("unexpected user status normalization")
		}

		page, pageSize := normalizeUserPageQuery(&UserListQuery{Page: 2, PageSize: 999})
		if page != 2 || pageSize != 100 {
			t.Fatalf("unexpected page normalization: %d %d", page, pageSize)
		}

		column, desc := normalizeUserSort(&UserListQuery{SortField: " username ", SortOrder: " DESC "})
		if column != "username" || !desc {
			t.Fatalf("unexpected user sort: %s %v", column, desc)
		}

		ids := normalizeUint64IDs([]uint64{0, 9, 9, 7})
		if !reflect.DeepEqual(ids, []uint64{9, 7}) {
			t.Fatalf("unexpected ids: %#v", ids)
		}
	})
}
