package org

import (
	"reflect"
	"testing"
)

func TestDeptHelpers(t *testing.T) {
	t.Run("governance helpers build stable tags blockers actions and summaries", func(t *testing.T) {
		rootTags := buildDeptGovernanceTags(SystemDept{IsRoot: 1}, 0, 0)
		if !reflect.DeepEqual(rootTags, []string{"root"}) {
			t.Fatalf("unexpected root tags: %#v", rootTags)
		}

		tags := buildDeptGovernanceTags(SystemDept{IsRoot: 0, LeaderUserID: 0}, 0, 0)
		if !reflect.DeepEqual(tags, []string{"leaderless", "no-post", "empty"}) {
			t.Fatalf("unexpected governance tags: %#v", tags)
		}

		blockers := buildDeptDeleteBlockers(1, 2, 3)
		if !reflect.DeepEqual(blockers, []string{"children", "posts", "users"}) {
			t.Fatalf("unexpected blockers: %#v", blockers)
		}

		actions := buildDeptGovernanceActions([]string{"leaderless", "empty"}, []string{"children", "users"})
		if !reflect.DeepEqual(actions, []string{"assign-leader", "review-merge-or-delete", "clear-child-depts", "clear-users"}) {
			t.Fatalf("unexpected actions: %#v", actions)
		}

		summary := buildGovernanceTaskQuerySummary(&DeptGovernanceTaskQuery{Scope: "dept", Keyword: "ops", Governance: "empty", BlockedBy: "users", Action: "assign-leader"})
		if summary != "scope=dept; keyword=ops; governance=empty; blockedBy=users; action=assign-leader" {
			t.Fatalf("unexpected summary: %q", summary)
		}
	})

	t.Run("dept normalizers trim and deduplicate", func(t *testing.T) {
		column, desc := normalizeDeptSort(&DeptListQuery{SortField: " deptName ", SortOrder: " DESC "})
		if column != "dept_name" || !desc {
			t.Fatalf("unexpected dept sort: %s %v", column, desc)
		}

		if normalizeSystemStatus(0) != 1 || normalizeSystemStatus(2) != 2 || normalizeDeptRootFlag(9) != 0 || normalizeDeptRootFlag(1) != 1 {
			t.Fatal("unexpected dept/system normalization")
		}

		ids := normalizeDeptIDs([]uint64{0, 5, 5, 8})
		if !reflect.DeepEqual(ids, []uint64{5, 8}) {
			t.Fatalf("unexpected dept ids: %#v", ids)
		}

		items := normalizeDeptLeaderItems([]DeptBatchLeaderItem{{DeptID: 0}, {DeptID: 7, LeaderUserID: 2}, {DeptID: 7, LeaderUserID: 9}, {DeptID: 8, LeaderUserID: 3}})
		if !reflect.DeepEqual(items, []DeptBatchLeaderItem{{DeptID: 7, LeaderUserID: 2}, {DeptID: 8, LeaderUserID: 3}}) {
			t.Fatalf("unexpected leader items: %#v", items)
		}
	})
}
