package iam

import (
	"reflect"
	"testing"

	"pantheon-platform/backend/pkg/common"
)

func TestPermissionHelpers(t *testing.T) {
	t.Run("data scope helpers normalize modes and department ids", func(t *testing.T) {
		if normalizeDataScopeMode(" CUSTOM ") != "custom" {
			t.Fatal("expected normalized custom mode")
		}
		if !isValidDataScopeMode(common.DataScopeModeDeptAndChildren) || isValidDataScopeMode("invalid") {
			t.Fatal("unexpected data scope validation result")
		}

		got := parsePermissionDataScopeDeptIDs("3, 2, invalid, 3, 0, 1")
		want := []uint64{1, 2, 3}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("unexpected dept ids: %#v", got)
		}
	})

	t.Run("permission helpers normalize pagination and http method", func(t *testing.T) {
		page, pageSize := normalizePermissionPageQuery(nil)
		if page != 1 || pageSize != 10 {
			t.Fatalf("unexpected default pagination: %d %d", page, pageSize)
		}

		page, pageSize = normalizePermissionPageQuery(&PermissionPolicyQuery{Page: 2, PageSize: 999})
		if page != 2 || pageSize != 100 {
			t.Fatalf("unexpected capped pagination: %d %d", page, pageSize)
		}

		if normalizePolicyMethod(" patch ") != "PATCH" || normalizePolicyMethod("trace") != "" {
			t.Fatal("unexpected policy method normalization")
		}
	})
}
