package iam

import "testing"

func TestMenuHelpers(t *testing.T) {
	t.Run("normalizers collapse invalid values to defaults", func(t *testing.T) {
		if normalizeVisible(9) != 1 || normalizeVisible(0) != 0 {
			t.Fatal("unexpected visible normalization")
		}
		if normalizeMenuType("X") != "C" || normalizeMenuType("M") != "M" {
			t.Fatal("unexpected menu type normalization")
		}
		if normalizeMenuFlag(9) != 0 || normalizeMenuFlag(1) != 1 {
			t.Fatal("unexpected menu flag normalization")
		}
		if normalizeMenuModule("  ") != "system" {
			t.Fatal("expected empty module to default to system")
		}
		if normalizeMenuRouteName(" dashboard ") != "dashboard" || normalizeMenuPerm(" system:user:list ") != "system:user:list" || normalizeMenuActiveMenu(" /home ") != "/home" {
			t.Fatal("expected string helpers to trim whitespace")
		}
	})

	t.Run("normalizeMenuSort and scope honor allowlist", func(t *testing.T) {
		column, desc := normalizeMenuSort(nil)
		if column != "sort" || desc {
			t.Fatalf("unexpected default sort: %s %v", column, desc)
		}

		column, desc = normalizeMenuSort(&MenuListQuery{SortField: " routeName ", SortOrder: " DESC "})
		if column != "route_name" || !desc {
			t.Fatalf("unexpected explicit sort: %s %v", column, desc)
		}

		if normalizeMenuScope(nil) != "nav" || normalizeMenuScope(&MenuListQuery{Scope: " manage "}) != "manage" {
			t.Fatal("unexpected menu scope normalization")
		}
	})

	t.Run("hasRoleKey and external path validation", func(t *testing.T) {
		if !hasRoleKey([]string{"admin", "auditor"}, "admin") || hasRoleKey([]string{"admin"}, "guest") {
			t.Fatal("unexpected role-key lookup result")
		}
		if !isValidExternalMenuPath("https://example.com/app") {
			t.Fatal("expected https url to be valid")
		}
		if isValidExternalMenuPath("ftp://example.com/app") || isValidExternalMenuPath("/internal/path") {
			t.Fatal("expected non-http external path to be invalid")
		}
	})
}
