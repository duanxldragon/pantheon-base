package dynamicmodule

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"pantheon-platform/backend/internal/scaffold"
)

func generatedModulePath(root string, parts ...string) (string, error) {
	trimmedRoot := strings.TrimSpace(root)
	if trimmedRoot == "" {
		return "", errors.New("workspace.not_found")
	}
	absRoot, err := filepath.Abs(trimmedRoot)
	if err != nil {
		return "", errors.New("workspace.invalid")
	}

	cleaned := make([]string, 0, len(parts)+1)
	cleaned = append(cleaned, absRoot)
	for _, part := range parts {
		normalized := strings.Trim(strings.ReplaceAll(strings.TrimSpace(part), "\\", "/"), "/")
		if normalized == "" || !filepath.IsLocal(filepath.FromSlash(normalized)) {
			return "", errors.New("module.invalid_name")
		}
		for _, segment := range strings.Split(normalized, "/") {
			if segment == "" || segment == "." || segment == ".." || strings.Contains(segment, "..") || strings.ContainsAny(segment, `<>:"|?*`) {
				return "", errors.New("module.invalid_name")
			}
			cleaned = append(cleaned, segment)
		}
	}
	target := filepath.Join(cleaned...)
	rel, err := filepath.Rel(absRoot, target)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) || filepath.IsAbs(rel) {
		return "", errors.New("module.invalid_name")
	}
	return target, nil
}

func (s *DynamicModuleService) RebuildGeneratedRegistries() error {
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return errors.New("workspace.not_found")
	}
	if _, err := s.syncGeneratedModuleRegistrations(); err != nil {
		return err
	}
	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return err
	}
	return scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs)
}

func (s *DynamicModuleService) listGeneratedModuleRefs() ([]scaffold.GeneratedModuleRef, error) {
	var modules []ModuleRegistration
	if err := s.db.Where("table_name <> '' AND status <> ?", ModuleStatusUninstalled).Find(&modules).Error; err != nil {
		return nil, err
	}
	refs := make([]scaffold.GeneratedModuleRef, 0, len(modules))
	for _, module := range modules {
		scope, name, err := splitModuleKey(module.Name)
		if err != nil {
			continue
		}
		if !s.generatedModuleArtifactsExist(scope, name) {
			continue
		}
		refs = append(refs, scaffold.GeneratedModuleRef{Name: name, Scope: scope})
	}
	return refs, nil
}

func (s *DynamicModuleService) generatedModuleArtifactsExist(scope string, name string) bool {
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return false
	}
	backendPath, err := generatedModulePath(s.workspaceRoot, "backend", "modules", scope, name)
	if err != nil {
		return false
	}
	frontendPath, err := generatedModulePath(s.workspaceRoot, "frontend", "src", "modules", scope, name)
	if err != nil {
		return false
	}
	schemaPath, err := generatedModulePath(s.workspaceRoot, "schema", "generated", scope, name+".json")
	if err != nil {
		return false
	}
	return generatedDirExists(backendPath) &&
		generatedDirExists(frontendPath) &&
		generatedPathExists(schemaPath)
}

func (s *DynamicModuleService) loadGeneratedModuleSchema(scope string, name string) (*scaffold.ModuleSchema, error) {
	target, err := generatedModulePath(s.workspaceRoot, "schema", "generated", scope, name+".json")
	if err != nil {
		return nil, err
	}
	content, err := os.ReadFile(target)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, errors.New("module.register.source_missing")
		}
		return nil, err
	}
	var schema scaffold.ModuleSchema
	if err := json.Unmarshal(content, &schema); err != nil {
		return nil, errors.New("module.register.schema_invalid")
	}
	if strings.TrimSpace(schema.Name) == "" || strings.TrimSpace(schema.Scope) == "" || strings.TrimSpace(schema.Model.TableName) == "" {
		return nil, errors.New("module.register.schema_invalid")
	}
	return &schema, nil
}

func generatedPathExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func generatedDirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func generatedFileContainsAll(path string, fragments ...string) bool {
	content, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	body := string(content)
	for _, fragment := range fragments {
		if strings.TrimSpace(fragment) == "" {
			continue
		}
		if !strings.Contains(body, fragment) {
			return false
		}
	}
	return true
}
