package config

import (
	"reflect"
	"testing"
)

func TestDictHelpers(t *testing.T) {
	t.Run("dict helpers normalize status module paging codes ids and clones", func(t *testing.T) {
		if normalizeDictStatus(0) != 1 || normalizeDictStatus(2) != 2 {
			t.Fatal("unexpected dict status normalization")
		}
		if normalizeDictModule("  ") != "system" || normalizeDictModule(" business ") != "business" {
			t.Fatal("unexpected dict module normalization")
		}

		page, pageSize := normalizeDictItemPageQuery(&DictItemListQuery{Page: 2, PageSize: 999})
		if page != 2 || pageSize != 100 {
			t.Fatalf("unexpected dict pagination: %d %d", page, pageSize)
		}

		codes := normalizeDictCodes([]string{" status ", "", "status", " color "})
		if !reflect.DeepEqual(codes, []string{"status", "color"}) {
			t.Fatalf("unexpected dict codes: %#v", codes)
		}

		ids := normalizeUint64IDs([]uint64{0, 8, 8, 5})
		if !reflect.DeepEqual(ids, []uint64{8, 5}) {
			t.Fatalf("unexpected dict ids: %#v", ids)
		}

		original := []DictOptionResp{{LabelKey: "dict.ok", Value: "ok", Color: "green"}}
		cloned := cloneDictOptions(original)
		cloned[0].Value = "changed"
		if original[0].Value != "ok" {
			t.Fatalf("expected clone to be independent, got %#v", original)
		}
	})
}
