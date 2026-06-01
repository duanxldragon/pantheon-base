package dynamicmodule

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"pantheon-platform/backend/internal/scaffold"
)

func generatedModulePath(root string, parts ...string) string {
	cleaned := make([]string, 0, len(parts)+1)
	cleaned = append(cleaned, filepath.Clean(root))
	for _, part := range parts {
		trimmed := strings.Trim(strings.ReplaceAll(strings.TrimSpace(part), "\\", "/"), "/")
		if trimmed == "" || trimmed == "." || trimmed == ".." || strings.Contains(trimmed, "..") {
			continue
		}
		cleaned = append(cleaned, trimmed)
	}
	return filepath.Join(cleaned...)
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
	backendRelativePath := filepath.ToSlash(filepath.Join("backend", "modules", scope, name))
	frontendRelativePath := filepath.ToSlash(filepath.Join("frontend", "src", "modules", scope, name))
	schemaRelativePath := filepath.ToSlash(filepath.Join("schema", "generated", scope, name+".json"))
	if !filepath.IsLocal(backendRelativePath) || !filepath.IsLocal(frontendRelativePath) || !filepath.IsLocal(schemaRelativePath) {
		return false
	}
	return generatedDirExists(s.workspaceRoot, backendRelativePath) &&
		generatedDirExists(s.workspaceRoot, frontendRelativePath) &&
		generatedPathExists(s.workspaceRoot, schemaRelativePath)
}

func (s *DynamicModuleService) loadGeneratedModuleSchema(scope string, name string) (*scaffold.ModuleSchema, error) {
	relativeTarget := filepath.ToSlash(filepath.Join("schema", "generated", scope, name+".json"))
	if !filepath.IsLocal(relativeTarget) {
		return nil, errors.New("module.register.schema_invalid")
	}
	target, ok := resolveGeneratedWorkspacePath(s.workspaceRoot, relativeTarget)
	if !ok {
		return nil, errors.New("module.register.schema_invalid")
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

func resolveGeneratedWorkspacePath(workspaceRoot string, relativePath string) (string, bool) {
	normalizedRoot := filepath.Clean(strings.TrimSpace(workspaceRoot))
	normalizedRelative := filepath.ToSlash(strings.TrimSpace(relativePath))
	if normalizedRoot == "" || normalizedRelative == "" {
		return "", false
	}
	if strings.Contains(normalizedRelative, "..") || !filepath.IsLocal(normalizedRelative) {
		return "", false
	}
	target := filepath.Join(normalizedRoot, filepath.FromSlash(normalizedRelative))
	relativeToRoot, err := filepath.Rel(normalizedRoot, target)
	if err != nil || relativeToRoot == ".." || strings.HasPrefix(relativeToRoot, ".."+string(os.PathSeparator)) {
		return "", false
	}
	return target, true
}

func generatedPathExists(workspaceRoot string, relativePath string) bool {
	path, ok := resolveGeneratedWorkspacePath(workspaceRoot, relativePath)
	if !ok {
		return false
	}
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func generatedDirExists(workspaceRoot string, relativePath string) bool {
	path, ok := resolveGeneratedWorkspacePath(workspaceRoot, relativePath)
	if !ok {
		return false
	}
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func generatedFileContainsAll(workspaceRoot string, relativePath string, fragments ...string) bool {
	path, ok := resolveGeneratedWorkspacePath(workspaceRoot, relativePath)
	if !ok {
		return false
	}
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
