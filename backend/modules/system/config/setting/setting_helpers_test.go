package config

import (
	"reflect"
	"testing"
)

func TestSettingHelpers(t *testing.T) {
	t.Run("clone helpers deep copy mutable fields", func(t *testing.T) {
		list := cloneSettingRespList([]SettingResp{{SettingKey: "site.name"}})
		list[0].SettingKey = "changed"
		if got := cloneSettingRespList([]SettingResp{}); !reflect.DeepEqual(got, []SettingResp{}) {
			t.Fatalf("expected empty clone result, got %#v", got)
		}

		group := cloneSettingGroupResp(&SettingGroupResp{GroupKey: "basic", Items: []SettingResp{{SettingKey: "site.name"}}})
		group.Items[0].SettingKey = "changed"
		if group == nil || cloneSettingGroupResp(nil) != nil {
			t.Fatal("unexpected group clone behavior")
		}

		public := clonePublicSettingResp(&PublicSettingResp{Settings: map[string]string{"site.name": "Pantheon"}})
		public.Settings["site.name"] = "Changed"
		if public == nil || clonePublicSettingResp(nil) != nil {
			t.Fatal("unexpected public clone behavior")
		}
	})

	t.Run("setting helpers normalize groups audit retention seeds and audit payload", func(t *testing.T) {
		groups := normalizeSettingGroups([]string{" basic ", "", "basic", "security "})
		if !reflect.DeepEqual(groups, []string{"basic", "security"}) {
			t.Fatalf("unexpected setting groups: %#v", groups)
		}

		normalized, err := normalizeAuditRetentionOptions(`[30,7,30,90]`)
		if err != nil {
			t.Fatalf("normalize audit retention options: %v", err)
		}
		if normalized != "[7,30,90]" {
			t.Fatalf("unexpected normalized audit retention options: %s", normalized)
		}
		if _, err := normalizeAuditRetentionOptions(`[0]`); err == nil {
			t.Fatal("expected invalid retention option error")
		}

		seeds := buildDefaultSettingSeedMap([]defaultSettingSeed{{SettingKey: "site.name", SettingValue: "Pantheon"}, {SettingKey: "site.logo", SettingValue: ""}})
		if len(seeds) != 2 || seeds["site.name"].SettingValue != "Pantheon" {
			t.Fatalf("unexpected default seed map: %#v", seeds)
		}

		groupKey, changes := parseSettingAuditPayload(`{"groupKey":"security","changes":[{"settingKey":"login.mfa_enabled","oldValue":"false","newValue":"true"}]}`)
		if groupKey != "security" || len(changes) != 1 || changes[0].SettingKey != "login.mfa_enabled" {
			t.Fatalf("unexpected parsed audit payload: %s %#v", groupKey, changes)
		}

		emptyGroup, emptyChanges := parseSettingAuditPayload(`invalid-json`)
		if emptyGroup != "" || len(emptyChanges) != 0 {
			t.Fatalf("expected invalid audit payload fallback, got %q %#v", emptyGroup, emptyChanges)
		}
	})
}
