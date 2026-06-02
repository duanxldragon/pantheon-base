package system

import (
	"reflect"
	"testing"
)

func TestI18nHelpers(t *testing.T) {
	t.Run("normalizeI18nQuery applies defaults and trims fields", func(t *testing.T) {
		query := normalizeI18nQuery(&I18nQuery{
			Module:    " system.config ",
			Group:     " messages ",
			Locale:    " zh-CN ",
			Key:       " hello ",
			SortBy:    " key ",
			SortOrder: " desc ",
			Page:      0,
			PageSize:  999,
		})

		if query.Page != 1 || query.PageSize != 200 {
			t.Fatalf("unexpected pagination: %#v", query)
		}
		if query.Module != "system.config" || query.Group != "messages" || query.Locale != "zh-CN" || query.Key != "hello" || query.SortBy != "key" || query.SortOrder != "desc" {
			t.Fatalf("expected trimmed query, got %#v", query)
		}
	})

	t.Run("cloneLangPack creates an independent copy", func(t *testing.T) {
		original := map[string]string{"a": "1"}
		cloned := cloneLangPack(original)
		cloned["a"] = "2"
		if original["a"] != "1" {
			t.Fatalf("expected original pack to remain unchanged, got %#v", original)
		}
	})

	t.Run("stored and effective locale value helpers ignore placeholders", func(t *testing.T) {
		if hasStoredLocaleValue("[system.menu.user]") {
			t.Fatal("expected placeholder to be treated as missing")
		}
		if !hasStoredLocaleValue("Users") {
			t.Fatal("expected concrete value to be stored")
		}
		if !hasEffectiveLocaleValue("en-US", "system.menu.user", "[system.menu.user]") {
			t.Fatal("expected builtin fallback to count as effective value")
		}
	})

	t.Run("ignored i18n usage files skip generated and dependency paths", func(t *testing.T) {
		if !isIgnoredI18nUsageFile("/repo/frontend/node_modules/react/index.js") {
			t.Fatal("expected node_modules path to be ignored")
		}
		if isIgnoredI18nUsageFile("/repo/frontend/src/modules/system/i18n/list.tsx") {
			t.Fatal("expected source file to remain scannable")
		}
	})

	t.Run("query clone remains stable", func(t *testing.T) {
		got := cloneLangPack(map[string]string{"one": "1", "two": "2"})
		if !reflect.DeepEqual(got, map[string]string{"one": "1", "two": "2"}) {
			t.Fatalf("unexpected clone: %#v", got)
		}
	})
}
