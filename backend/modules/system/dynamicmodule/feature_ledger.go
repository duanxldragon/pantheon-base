package dynamicmodule

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"pantheon-platform/backend/internal/scaffold"
)

const featureLedgerVersion = 1

type FeatureLedgerSnapshot struct {
	Version       int                  `json:"version"`
	SourceOfTruth FeatureLedgerSources `json:"sourceOfTruth"`
	Entries       []FeatureLedgerEntry `json:"entries"`
	Issues        []FeatureLedgerIssue `json:"issues,omitempty"`
}

type FeatureLedgerSources struct {
	Registrations string `json:"registrations"`
	Schemas       string `json:"schemas"`
	Snapshot      string `json:"snapshot"`
}

type FeatureLedgerEntry struct {
	ModuleKey      string `json:"moduleKey"`
	Name           string `json:"name"`
	Scope          string `json:"scope"`
	DisplayName    string `json:"displayName"`
	Owner          string `json:"owner"`
	BoundedContext string `json:"boundedContext"`
	SourceMode     string `json:"sourceMode"`
	Source         string `json:"source"`
	Maturity       string `json:"maturity"`
	Status         string `json:"status"`
	TableName      string `json:"tableName"`
	SchemaPath     string `json:"schemaPath"`
	BuiltIn        bool   `json:"builtIn"`
	AutoRecycle    bool   `json:"autoRecycle"`
}

type FeatureLedgerIssue struct {
	ModuleKey string `json:"moduleKey"`
	Severity  string `json:"severity"`
	Code      string `json:"code"`
	Field     string `json:"field,omitempty"`
	Detail    string `json:"detail"`
}

type featureLedgerSchemaFile struct {
	Scope        string
	Name         string
	RelativePath string
	AbsolutePath string
}

func (s *DynamicModuleService) refreshGeneratedWorkspaceArtifacts() (*FeatureLedgerSnapshot, int, error) {
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil, 0, errors.New("workspace.not_found")
	}

	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return nil, 0, err
	}
	if err := scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs); err != nil {
		return nil, 0, err
	}

	snapshot, err := s.buildFeatureLedgerSnapshot()
	if err != nil {
		return nil, 0, err
	}
	if err := scaffold.WriteGeneratedFeatureLedgerSnapshot(s.workspaceRoot, snapshot); err != nil {
		return nil, 0, err
	}
	return snapshot, len(refs), nil
}

func (s *DynamicModuleService) refreshGeneratedWorkspaceArtifactsIfAvailable() (*FeatureLedgerSnapshot, error) {
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil, nil
	}
	snapshot, _, err := s.refreshGeneratedWorkspaceArtifacts()
	return snapshot, err
}

func (s *DynamicModuleService) buildFeatureLedgerSnapshot() (*FeatureLedgerSnapshot, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}

	schemaFiles, err := s.collectFeatureLedgerSchemaFiles()
	if err != nil {
		return nil, err
	}
	registrations, err := s.collectFeatureLedgerRegistrations()
	if err != nil {
		return nil, err
	}

	entries := make([]FeatureLedgerEntry, 0, len(schemaFiles)+len(registrations))
	issues := make([]FeatureLedgerIssue, 0)
	seen := make(map[string]struct{}, len(schemaFiles))

	for _, file := range schemaFiles {
		moduleKey := buildModuleKey(file.Scope, file.Name)
		schema, schemaIssues := loadFeatureLedgerSchema(file.AbsolutePath)
		registration, hasRegistration := registrations[moduleKey]
		entry, entryIssues := buildFeatureLedgerEntry(file, schema, true, registration, hasRegistration)
		entries = append(entries, entry)
		for index := range schemaIssues {
			if schemaIssues[index].ModuleKey == "" {
				schemaIssues[index].ModuleKey = moduleKey
			}
		}
		issues = append(issues, schemaIssues...)
		issues = append(issues, entryIssues...)
		seen[moduleKey] = struct{}{}
	}

	for moduleKey, registration := range registrations {
		if _, ok := seen[moduleKey]; ok {
			continue
		}
		scope, name, err := splitModuleKey(moduleKey)
		if err != nil {
			issues = append(issues, FeatureLedgerIssue{
				ModuleKey: moduleKey,
				Severity:  "error",
				Code:      "registration_key_invalid",
				Detail:    err.Error(),
			})
			continue
		}
		file := featureLedgerSchemaFile{
			Scope:        scope,
			Name:         name,
			RelativePath: filepath.ToSlash(filepath.Join("schema", "generated", scope, name+".json")),
		}
		entry, entryIssues := buildFeatureLedgerEntry(file, nil, false, registration, true)
		entries = append(entries, entry)
		issues = append(issues, entryIssues...)
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].Scope == entries[j].Scope {
			return entries[i].Name < entries[j].Name
		}
		return entries[i].Scope < entries[j].Scope
	})
	sort.SliceStable(issues, func(i, j int) bool {
		if issues[i].ModuleKey != issues[j].ModuleKey {
			return issues[i].ModuleKey < issues[j].ModuleKey
		}
		if issues[i].Code != issues[j].Code {
			return issues[i].Code < issues[j].Code
		}
		if issues[i].Field != issues[j].Field {
			return issues[i].Field < issues[j].Field
		}
		if issues[i].Severity != issues[j].Severity {
			return issues[i].Severity < issues[j].Severity
		}
		return issues[i].Detail < issues[j].Detail
	})

	return &FeatureLedgerSnapshot{
		Version: featureLedgerVersion,
		SourceOfTruth: FeatureLedgerSources{
			Registrations: "system_module_registration",
			Schemas:       "schema/generated",
			Snapshot:      scaffold.GeneratedFeatureLedgerRelativePath,
		},
		Entries: entries,
		Issues:  issues,
	}, nil
}

func (s *DynamicModuleService) collectFeatureLedgerSchemaFiles() ([]featureLedgerSchemaFile, error) {
	schemaRoot := filepath.Join(s.workspaceRoot, "schema", "generated")
	info, err := os.Stat(schemaRoot)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []featureLedgerSchemaFile{}, nil
		}
		return nil, err
	}
	if !info.IsDir() {
		return nil, errors.New("workspace.schema_root_invalid")
	}

	files := make([]featureLedgerSchemaFile, 0)
	walkErr := filepath.WalkDir(schemaRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() || !strings.EqualFold(filepath.Ext(path), ".json") {
			return nil
		}
		if strings.EqualFold(filepath.Base(path), filepath.Base(scaffold.GeneratedFeatureLedgerRelativePath)) {
			return nil
		}

		relativePath, err := filepath.Rel(schemaRoot, path)
		if err != nil {
			return err
		}
		scope, name, ok := splitFeatureLedgerSchemaRelativePath(relativePath)
		if !ok {
			return nil
		}
		files = append(files, featureLedgerSchemaFile{
			Scope:        scope,
			Name:         name,
			RelativePath: filepath.ToSlash(relativePath),
			AbsolutePath: path,
		})
		return nil
	})
	if walkErr != nil {
		return nil, walkErr
	}

	sort.Slice(files, func(i, j int) bool {
		if files[i].Scope == files[j].Scope {
			return files[i].Name < files[j].Name
		}
		return files[i].Scope < files[j].Scope
	})

	return files, nil
}

func (s *DynamicModuleService) collectFeatureLedgerRegistrations() (map[string]ModuleRegistration, error) {
	var modules []ModuleRegistration
	if err := s.db.Where("table_name <> '' AND status <> ?", ModuleStatusUninstalled).Order("scope ASC").Order("name ASC").Find(&modules).Error; err != nil {
		return nil, err
	}

	registrations := make(map[string]ModuleRegistration, len(modules))
	for _, module := range modules {
		registrations[module.Name] = module
	}
	return registrations, nil
}

func loadFeatureLedgerSchema(path string) (*scaffold.ModuleSchema, []FeatureLedgerIssue) {
	issues := make([]FeatureLedgerIssue, 0, 1)
	content, err := os.ReadFile(path)
	if err != nil {
		issues = append(issues, FeatureLedgerIssue{
			Severity: "error",
			Code:     "schema_unreadable",
			Detail:   err.Error(),
		})
		return nil, issues
	}

	var schema scaffold.ModuleSchema
	if err := json.Unmarshal(content, &schema); err != nil {
		issues = append(issues, FeatureLedgerIssue{
			Severity: "error",
			Code:     "schema_invalid",
			Detail:   err.Error(),
		})
		return nil, issues
	}
	return &schema, issues
}

func buildFeatureLedgerEntry(file featureLedgerSchemaFile, schema *scaffold.ModuleSchema, schemaPresent bool, registration ModuleRegistration, hasRegistration bool) (FeatureLedgerEntry, []FeatureLedgerIssue) {
	moduleKey := buildModuleKey(file.Scope, file.Name)
	entry := FeatureLedgerEntry{
		ModuleKey:  moduleKey,
		Name:       file.Name,
		Scope:      file.Scope,
		SchemaPath: file.RelativePath,
	}
	issues := make([]FeatureLedgerIssue, 0, 8)

	if schema != nil {
		entry.DisplayName = strings.TrimSpace(schema.DisplayName)
		entry.Owner = strings.TrimSpace(schema.Metadata.Owner)
		entry.BoundedContext = strings.TrimSpace(schema.Metadata.BoundedContext)
		entry.SourceMode = strings.TrimSpace(schema.Metadata.SourceMode)
		entry.TableName = strings.TrimSpace(schema.Model.TableName)
		entry.AutoRecycle = schema.Metadata.AutoRecycle
		if strings.TrimSpace(schema.Name) != "" && strings.TrimSpace(schema.Name) != file.Name {
			issues = append(issues, featureLedgerMismatchIssue(moduleKey, "schema_name_mismatch", "name", schema.Name, file.Name))
		}
		if strings.TrimSpace(schema.Scope) != "" && strings.TrimSpace(schema.Scope) != file.Scope {
			issues = append(issues, featureLedgerMismatchIssue(moduleKey, "schema_scope_mismatch", "scope", schema.Scope, file.Scope))
		}
	} else if !schemaPresent {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "error",
			Code:      "schema_missing",
			Detail:    file.RelativePath,
		})
	}

	if hasRegistration {
		entry.Source = strings.TrimSpace(registration.Source)
		entry.Status = featureLedgerStatusLabel(registration.Status)
		entry.BuiltIn = registration.ModelTableName == ""
		if strings.TrimSpace(registration.DisplayName) != "" {
			if entry.DisplayName == "" {
				entry.DisplayName = strings.TrimSpace(registration.DisplayName)
			} else if strings.TrimSpace(registration.DisplayName) != entry.DisplayName {
				issues = append(issues, featureLedgerMismatchIssue(moduleKey, "display_name_mismatch", "displayName", registration.DisplayName, entry.DisplayName))
			}
		}
		if strings.TrimSpace(registration.Owner) != "" {
			if entry.Owner == "" {
				entry.Owner = strings.TrimSpace(registration.Owner)
			} else if strings.TrimSpace(registration.Owner) != entry.Owner {
				issues = append(issues, featureLedgerMismatchIssue(moduleKey, "owner_mismatch", "owner", registration.Owner, entry.Owner))
			}
		}
		if strings.TrimSpace(registration.BoundedContext) != "" {
			if entry.BoundedContext == "" {
				entry.BoundedContext = strings.TrimSpace(registration.BoundedContext)
			} else if strings.TrimSpace(registration.BoundedContext) != entry.BoundedContext {
				issues = append(issues, featureLedgerMismatchIssue(moduleKey, "bounded_context_mismatch", "boundedContext", registration.BoundedContext, entry.BoundedContext))
			}
		}
		if strings.TrimSpace(registration.ModelTableName) != "" {
			if entry.TableName == "" {
				entry.TableName = strings.TrimSpace(registration.ModelTableName)
			} else if strings.TrimSpace(registration.ModelTableName) != entry.TableName {
				issues = append(issues, featureLedgerMismatchIssue(moduleKey, "table_name_mismatch", "tableName", registration.ModelTableName, entry.TableName))
			}
		}
		if schema == nil {
			entry.AutoRecycle = registration.AutoRecycle
		} else if registration.AutoRecycle != entry.AutoRecycle {
			issues = append(issues, featureLedgerMismatchIssue(moduleKey, "auto_recycle_mismatch", "autoRecycle", fmt.Sprintf("%t", registration.AutoRecycle), fmt.Sprintf("%t", entry.AutoRecycle)))
		}
		if schema != nil {
			derivedSource := inferRegistrationSource(file.Scope, entry.SourceMode, file.Name, true)
			if strings.TrimSpace(registration.Source) != "" && strings.TrimSpace(registration.Source) != derivedSource {
				issues = append(issues, featureLedgerMismatchIssue(moduleKey, "source_mismatch", "source", registration.Source, derivedSource))
			}
			entry.Source = strings.TrimSpace(registration.Source)
			entry.Maturity = featureLedgerMaturity(registration)
		}
	} else {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "error",
			Code:      "registration_missing",
			Detail:    file.RelativePath,
		})
		if entry.Source == "" {
			entry.Source = inferRegistrationSource(file.Scope, entry.SourceMode, file.Name, true)
		}
		entry.Maturity = "draft"
		entry.Status = "missing_registration"
	}

	if hasRegistration && entry.Maturity == "" {
		entry.Maturity = featureLedgerMaturity(registration)
	}
	if strings.TrimSpace(entry.DisplayName) == "" {
		entry.DisplayName = moduleKey
	}
	if strings.TrimSpace(entry.Source) == "" {
		entry.Source = inferRegistrationSource(file.Scope, entry.SourceMode, file.Name, true)
	}
	if strings.TrimSpace(entry.Status) == "" && hasRegistration {
		entry.Status = featureLedgerStatusLabel(registration.Status)
	}

	if strings.TrimSpace(entry.Owner) == "" {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "warn",
			Code:      "owner_missing",
			Field:     "owner",
			Detail:    "owner is required for feature ledger completeness",
		})
	}
	if strings.TrimSpace(entry.BoundedContext) == "" {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "warn",
			Code:      "bounded_context_missing",
			Field:     "boundedContext",
			Detail:    "bounded context is required for feature ledger completeness",
		})
	}
	if strings.TrimSpace(entry.SourceMode) == "" {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "warn",
			Code:      "source_mode_missing",
			Field:     "sourceMode",
			Detail:    "source mode is required for feature ledger completeness",
		})
	}
	if strings.TrimSpace(entry.TableName) == "" {
		issues = append(issues, FeatureLedgerIssue{
			ModuleKey: moduleKey,
			Severity:  "warn",
			Code:      "table_name_missing",
			Field:     "tableName",
			Detail:    "table name is required for feature ledger completeness",
		})
	}

	if entry.Maturity == "" {
		entry.Maturity = "draft"
	}
	return entry, dedupeFeatureLedgerIssues(issues)
}

func featureLedgerMaturity(registration ModuleRegistration) string {
	if registration.ModelTableName == "" {
		return "core"
	}
	switch registration.Status {
	case ModuleStatusActive:
		return "stable"
	case ModuleStatusPendingActivation:
		return "experimental"
	case ModuleStatusFailed:
		return "draft"
	case ModuleStatusUninstalled:
		return "draft"
	default:
		return "draft"
	}
}

func featureLedgerStatusLabel(status int) string {
	switch status {
	case ModuleStatusActive:
		return "active"
	case ModuleStatusUninstalled:
		return "uninstalled"
	case ModuleStatusPendingActivation:
		return "pending_activation"
	case ModuleStatusFailed:
		return "failed"
	default:
		return "unknown"
	}
}

func featureLedgerMismatchIssue(moduleKey string, code string, field string, actual string, expected string) FeatureLedgerIssue {
	return FeatureLedgerIssue{
		ModuleKey: moduleKey,
		Severity:  "warn",
		Code:      code,
		Field:     field,
		Detail:    fmt.Sprintf("actual=%q expected=%q", strings.TrimSpace(actual), strings.TrimSpace(expected)),
	}
}

func dedupeFeatureLedgerIssues(issues []FeatureLedgerIssue) []FeatureLedgerIssue {
	if len(issues) <= 1 {
		return issues
	}
	seen := make(map[string]struct{}, len(issues))
	filtered := make([]FeatureLedgerIssue, 0, len(issues))
	for _, issue := range issues {
		key := issue.ModuleKey + "|" + issue.Code + "|" + issue.Field + "|" + issue.Detail + "|" + issue.Severity
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		filtered = append(filtered, issue)
	}
	return filtered
}

func splitFeatureLedgerSchemaRelativePath(relativePath string) (string, string, bool) {
	normalized := filepath.ToSlash(strings.TrimSpace(relativePath))
	if normalized == "" || strings.EqualFold(filepath.Base(normalized), filepath.Base(scaffold.GeneratedFeatureLedgerRelativePath)) {
		return "", "", false
	}
	parts := strings.Split(normalized, "/")
	if len(parts) < 2 {
		return "", "", false
	}
	scope := strings.TrimSpace(parts[0])
	if scope != "system" && scope != "business" {
		return "", "", false
	}
	name := strings.TrimSuffix(strings.Join(parts[1:], "/"), ".json")
	name = strings.TrimSpace(name)
	if name == "" {
		return "", "", false
	}
	return scope, name, true
}
