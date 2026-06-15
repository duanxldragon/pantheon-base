package dynamicmodule

import (
	"path/filepath"
	"reflect"
	"sort"
	"testing"
)

func TestBuildFeatureLedgerSnapshot_ProjectsGeneratedModuleMetadata(t *testing.T) {
	db := openDynamicModuleTestDB(t)
	workspaceRoot := prepareDynamicModuleWorkspace(t)

	service := &DynamicModuleService{
		db:            db,
		workspaceRoot: workspaceRoot,
	}

	req := newGeneratedModuleRequest("business", "ticket", "工单管理", "biz_ticket")
	req.Schema.Metadata.Owner = "platform"
	req.Schema.Metadata.BoundedContext = "ticketing"
	req.Schema.Metadata.SourceMode = "manual"
	req.Schema.Metadata.SourceTable = "biz_ticket_source"

	if _, _, _, err := service.RegisterGeneratedModule(req); err != nil {
		t.Fatalf("register generated module: %v", err)
	}

	snapshot, err := service.buildFeatureLedgerSnapshot()
	if err != nil {
		t.Fatalf("build feature ledger snapshot: %v", err)
	}
	if snapshot.Version != featureLedgerVersion {
		t.Fatalf("unexpected ledger version: %d", snapshot.Version)
	}
	if len(snapshot.Entries) != 1 {
		t.Fatalf("unexpected ledger entry count: %d", len(snapshot.Entries))
	}
	if len(snapshot.Issues) != 0 {
		t.Fatalf("expected clean snapshot, got issues: %#v", snapshot.Issues)
	}

	entry := snapshot.Entries[0]
	if entry.ModuleKey != "business.ticket" {
		t.Fatalf("unexpected module key: %s", entry.ModuleKey)
	}
	if entry.Owner != "platform" {
		t.Fatalf("unexpected owner: %s", entry.Owner)
	}
	if entry.BoundedContext != "ticketing" {
		t.Fatalf("unexpected bounded context: %s", entry.BoundedContext)
	}
	if entry.SourceMode != "manual" {
		t.Fatalf("unexpected source mode: %s", entry.SourceMode)
	}
	if entry.Source != "manual" {
		t.Fatalf("unexpected source: %s", entry.Source)
	}
	if entry.Maturity != "experimental" {
		t.Fatalf("unexpected maturity: %s", entry.Maturity)
	}

	assertFileContains(t, filepath.Join(workspaceRoot, "schema", "generated", "feature-ledger.json"), `"moduleKey": "business.ticket"`)
	assertFileContains(t, filepath.Join(workspaceRoot, "schema", "generated", "feature-ledger.json"), `"sourceMode": "manual"`)
}

func TestBuildFeatureLedgerSnapshot_ReportsMissingGeneratedMetadata(t *testing.T) {
	db := openDynamicModuleTestDB(t)
	workspaceRoot := prepareDynamicModuleWorkspace(t)

	service := &DynamicModuleService{
		db:            db,
		workspaceRoot: workspaceRoot,
	}

	req := newGeneratedModuleRequest("business", "ticket", "工单管理", "biz_ticket")

	if _, _, _, err := service.RegisterGeneratedModule(req); err != nil {
		t.Fatalf("register generated module: %v", err)
	}

	snapshot, err := service.buildFeatureLedgerSnapshot()
	if err != nil {
		t.Fatalf("build feature ledger snapshot: %v", err)
	}
	if len(snapshot.Entries) != 1 {
		t.Fatalf("unexpected ledger entry count: %d", len(snapshot.Entries))
	}
	if len(snapshot.Issues) == 0 {
		t.Fatal("expected ledger drift issues")
	}
	assertFeatureLedgerIssue(t, snapshot.Issues, "business.ticket", "owner_missing")
	assertFeatureLedgerIssue(t, snapshot.Issues, "business.ticket", "bounded_context_missing")
	assertFeatureLedgerIssue(t, snapshot.Issues, "business.ticket", "source_mode_missing")

	assertFileContains(t, filepath.Join(workspaceRoot, "schema", "generated", "feature-ledger.json"), `"issues": [`)
	assertFileContains(t, filepath.Join(workspaceRoot, "schema", "generated", "feature-ledger.json"), `"owner_missing"`)
}

func TestBuildFeatureLedgerSnapshot_SortsIssuesDeterministically(t *testing.T) {
	db := openDynamicModuleTestDB(t)
	workspaceRoot := prepareDynamicModuleWorkspace(t)

	mustWriteFile(t, filepath.Join(workspaceRoot, "schema", "generated", "business", "zeta.json"), `{
  "name": "zeta",
  "scope": "business",
  "displayName": "Zeta",
  "metadata": {},
  "model": {
    "tableName": "biz_zeta"
  }
}`)

	if err := db.Create(&ModuleRegistration{
		Name:           "business.alpha",
		DisplayName:    "Alpha",
		Scope:          "business",
		Source:         "generated",
		ModelTableName: "biz_alpha",
		Status:         ModuleStatusActive,
		InstalledAt:    "2026-06-12T00:00:00Z",
	}).Error; err != nil {
		t.Fatalf("seed registration: %v", err)
	}

	service := &DynamicModuleService{
		db:            db,
		workspaceRoot: workspaceRoot,
	}

	snapshot, err := service.buildFeatureLedgerSnapshot()
	if err != nil {
		t.Fatalf("build feature ledger snapshot: %v", err)
	}

	sortedIssues := append([]FeatureLedgerIssue(nil), snapshot.Issues...)
	sort.Slice(sortedIssues, func(i, j int) bool {
		if sortedIssues[i].ModuleKey == sortedIssues[j].ModuleKey {
			if sortedIssues[i].Code == sortedIssues[j].Code {
				if sortedIssues[i].Field == sortedIssues[j].Field {
					if sortedIssues[i].Severity == sortedIssues[j].Severity {
						return sortedIssues[i].Detail < sortedIssues[j].Detail
					}
					return sortedIssues[i].Severity < sortedIssues[j].Severity
				}
				return sortedIssues[i].Field < sortedIssues[j].Field
			}
			return sortedIssues[i].Code < sortedIssues[j].Code
		}
		return sortedIssues[i].ModuleKey < sortedIssues[j].ModuleKey
	})

	if !reflect.DeepEqual(snapshot.Issues, sortedIssues) {
		t.Fatalf("expected issues to be sorted deterministically, got %#v want %#v", snapshot.Issues, sortedIssues)
	}
}

func assertFeatureLedgerIssue(t *testing.T, issues []FeatureLedgerIssue, moduleKey string, code string) {
	t.Helper()
	for _, issue := range issues {
		if issue.ModuleKey == moduleKey && issue.Code == code {
			return
		}
	}
	t.Fatalf("expected ledger issue %s for %s, got %#v", code, moduleKey, issues)
}
