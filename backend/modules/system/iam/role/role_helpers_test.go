package iam

import (
	"reflect"
	"testing"
)

func TestRoleHelpers(t *testing.T) {
	t.Run("status pagination and sorting use stable defaults", func(t *testing.T) {
		if normalizeRoleStatus(0) != 1 || normalizeRoleStatus(2) != 2 {
			t.Fatal("unexpected role status normalization")
		}

		page, pageSize := normalizeRolePageQuery(nil)
		if page != 1 || pageSize != 10 {
			t.Fatalf("unexpected default role pagination: %d %d", page, pageSize)
		}

		page, pageSize = normalizeRoleMemberPageQuery(&RoleMemberQuery{Page: 3, PageSize: 500})
		if page != 3 || pageSize != 100 {
			t.Fatalf("unexpected member pagination: %d %d", page, pageSize)
		}

		column, desc := normalizeRoleSort(&RoleListQuery{SortField: " roleName ", SortOrder: " DESC "})
		if column != "role_name" || !desc {
			t.Fatalf("unexpected role sort: %s %v", column, desc)
		}
	})

	t.Run("id and permission key normalizers trim and deduplicate", func(t *testing.T) {
		if got := normalizeUint64IDs(nil); !reflect.DeepEqual(got, []uint64{}) {
			t.Fatalf("expected empty id slice, got %#v", got)
		}

		ids := normalizeUint64IDs([]uint64{3, 0, 3, 1})
		if !reflect.DeepEqual(ids, []uint64{3, 1}) {
			t.Fatalf("unexpected ids: %#v", ids)
		}

		keys := normalizePermissionKeys([]string{" system:user:list ", "", "system:user:list", "system:role:list"})
		if !reflect.DeepEqual(keys, []string{"system:user:list", "system:role:list"}) {
			t.Fatalf("unexpected permission keys: %#v", keys)
		}
	})
}
