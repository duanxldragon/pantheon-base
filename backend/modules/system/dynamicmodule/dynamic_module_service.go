package dynamicmodule

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"pantheon-platform/backend/internal/scaffold"
	"pantheon-platform/backend/pkg/contracts"

	"gorm.io/gorm"
)

const (
	ModuleStatusActive            = 1
	ModuleStatusUninstalled       = 2
	ModuleStatusPendingActivation = 3
)

// DynamicModuleService 动态模块管理服务
type DynamicModuleService struct {
	db            *gorm.DB
	workspaceRoot string
}

// NewDynamicModuleService 创建服务实例
func NewDynamicModuleService(db *gorm.DB) *DynamicModuleService {
	workspaceRoot, _ := scaffold.ResolveWorkspaceRoot("")
	return &DynamicModuleService{db: db, workspaceRoot: workspaceRoot}
}

// ModuleRegistration 模块注册信息
type ModuleRegistration struct {
	ID             uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string `gorm:"size:64;uniqueIndex" json:"name"`
	DisplayName    string `gorm:"size:128" json:"displayName"`
	Scope          string `gorm:"size:32" json:"scope"`
	Source         string `gorm:"size:32" json:"source"`
	Owner          string `gorm:"size:128" json:"owner"`
	BoundedContext string `gorm:"size:128;column:bounded_context" json:"boundedContext"`
	Summary        string `gorm:"size:255" json:"summary"`
	SourceTable    string `gorm:"size:128;column:source_table" json:"sourceTable"`
	ModelTableName string `gorm:"size:128;column:table_name" json:"tableName"`
	Status         int    `gorm:"default:1" json:"status"` // 1:已激活, 2:已卸载, 3:待激活
	InstalledAt    string `json:"installedAt"`
	UninstalledAt  string `json:"uninstalledAt,omitempty"`
	BuiltIn        bool   `gorm:"-" json:"builtIn"`
}

type GeneratedModuleVerification struct {
	Code       string `json:"code"`
	Status     string `json:"status"`
	MessageKey string `json:"messageKey"`
	Detail     string `json:"detail"`
}

type GeneratedModuleRegistrationSummary struct {
	ModuleKey             string                        `json:"moduleKey"`
	RoutePath             string                        `json:"routePath"`
	RouteName             string                        `json:"routeName"`
	ComponentKey          string                        `json:"componentKey"`
	PermissionPrefix      string                        `json:"permissionPrefix"`
	ParentMenuPath        string                        `json:"parentMenuPath"`
	ParentMenuSource      string                        `json:"parentMenuSource"`
	ParentMenuExists      bool                          `json:"parentMenuExists"`
	BackendModulePath     string                        `json:"backendModulePath"`
	FrontendModulePath    string                        `json:"frontendModulePath"`
	SchemaPath            string                        `json:"schemaPath"`
	RequiresRestart       bool                          `json:"requiresRestart"`
	RequiresFrontendBuild bool                          `json:"requiresFrontendBuild"`
	Verifications         []GeneratedModuleVerification `json:"verifications"`
}

type RegistryRepairSummary struct {
	CheckedModules            int `json:"checkedModules"`
	GeneratedRegistryRefs     int `json:"generatedRegistryRefs"`
	MarkedUninstalledModules  int `json:"markedUninstalledModules"`
	ArtifactReadyModules      int `json:"artifactReadyModules"`
	PreservedUninstalledCount int `json:"preservedUninstalledCount"`
}

// TableName 指定表名
func (ModuleRegistration) TableName() string {
	return "system_module_registration"
}

// RegisterModule 注册新模块
// 1. 执行数据库迁移
// 2. 导入菜单/权限/i18n
// 3. 注册到模块注册表
// 4. 返回安装状态
func (s *DynamicModuleService) RegisterModule(module contracts.BackendModule) error {
	if s.db == nil {
		return nil
	}

	moduleName := module.Name()

	var count int64
	if err := s.db.Table("system_module_registration").
		Where("name = ? AND status = ?", moduleName, ModuleStatusActive).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	if err := module.Migrate(s.db); err != nil {
		return err
	}
	if err := module.SeedMenus(s.db); err != nil {
		return err
	}
	if err := module.SeedPerms(s.db); err != nil {
		return err
	}
	if err := module.SeedI18n(s.db); err != nil {
		return err
	}

	registration := ModuleRegistration{
		Name:        moduleName,
		Status:      ModuleStatusActive,
		InstalledAt: time.Now().Format(time.RFC3339),
	}
	return s.db.Table("system_module_registration").Create(&registration).Error
}

func (s *DynamicModuleService) RegisterGeneratedModule(req *scaffold.RegisterGeneratedModuleRequest) (*ModuleRegistration, []string, *GeneratedModuleRegistrationSummary, error) {
	if s.db == nil {
		return nil, nil, nil, errors.New("database.not_initialized")
	}
	if err := scaffold.ValidateRegisterRequest(req); err != nil {
		return nil, nil, nil, err
	}
	if strings.TrimSpace(req.Schema.Scope) != "business" {
		return nil, nil, nil, errors.New("module.generate.business_only")
	}
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil, nil, nil, errors.New("workspace.not_found")
	}

	moduleKey := buildModuleKey(req.Schema.Scope, req.Schema.Name)

	var existing ModuleRegistration
	err := s.db.Where("name = ?", moduleKey).First(&existing).Error
	if err == nil && strings.TrimSpace(existing.ModelTableName) == "" {
		return nil, nil, nil, errors.New("module.generate.reserved")
	}
	if err == nil && existing.Status != ModuleStatusUninstalled && !req.Overwrite {
		return nil, nil, nil, errors.New("module.generate.already_exists")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, nil, err
	}

	writtenFiles, err := scaffold.WriteGeneratedModuleSource(s.workspaceRoot, req)
	if err != nil {
		return nil, nil, nil, err
	}

	now := time.Now().Format(time.RFC3339)
	existing.Name = moduleKey
	existing.DisplayName = req.Schema.DisplayName
	existing.Scope = req.Schema.Scope
	existing.Source = inferRegistrationSource(req.Schema.Scope, req.Schema.Metadata.SourceMode, req.Schema.Name, true)
	existing.Owner = strings.TrimSpace(req.Schema.Metadata.Owner)
	existing.BoundedContext = strings.TrimSpace(req.Schema.Metadata.BoundedContext)
	existing.Summary = strings.TrimSpace(req.Schema.Metadata.Summary)
	existing.SourceTable = strings.TrimSpace(req.Schema.Metadata.SourceTable)
	existing.ModelTableName = req.Schema.Model.TableName
	existing.Status = ModuleStatusPendingActivation
	existing.InstalledAt = now
	existing.UninstalledAt = ""
	if err := s.db.Save(&existing).Error; err != nil {
		return nil, nil, nil, err
	}

	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return nil, nil, nil, err
	}
	if err := scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs); err != nil {
		return nil, nil, nil, err
	}

	existing.BuiltIn = false
	summary := s.buildGeneratedModuleSummary(req, writtenFiles)
	return &existing, writtenFiles, summary, nil
}

func (s *DynamicModuleService) RegisterManagedModule(moduleName string) (*ModuleRegistration, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	scope, shortName, err := splitModuleKey(moduleName)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil, errors.New("workspace.not_found")
	}

	var registration ModuleRegistration
	err = s.db.Where("name = ?", moduleName).First(&registration).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if err == nil && strings.TrimSpace(registration.ModelTableName) == "" {
		return nil, errors.New("module.register.builtin_forbidden")
	}
	if err == nil && registration.Status == ModuleStatusActive {
		registration.BuiltIn = false
		return &registration, nil
	}

	schema, err := s.loadGeneratedModuleSchema(scope, shortName)
	if err != nil {
		return nil, err
	}
	if !generatedDirExists(filepath.Join(s.workspaceRoot, "backend", "modules", scope, shortName)) ||
		!generatedDirExists(filepath.Join(s.workspaceRoot, "frontend", "src", "modules", scope, shortName)) {
		return nil, errors.New("module.register.source_missing")
	}

	registration.Name = moduleName
	registration.DisplayName = strings.TrimSpace(schema.DisplayName)
	registration.Scope = strings.TrimSpace(schema.Scope)
	registration.Source = inferRegistrationSource(schema.Scope, schema.Metadata.SourceMode, schema.Name, true)
	registration.Owner = strings.TrimSpace(schema.Metadata.Owner)
	registration.BoundedContext = strings.TrimSpace(schema.Metadata.BoundedContext)
	registration.Summary = strings.TrimSpace(schema.Metadata.Summary)
	registration.SourceTable = strings.TrimSpace(schema.Metadata.SourceTable)
	registration.ModelTableName = strings.TrimSpace(schema.Model.TableName)
	registration.Status = ModuleStatusPendingActivation
	registration.InstalledAt = time.Now().Format(time.RFC3339)
	registration.UninstalledAt = ""
	if err := s.db.Save(&registration).Error; err != nil {
		return nil, err
	}

	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return nil, err
	}
	if err := scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs); err != nil {
		return nil, err
	}

	registration.BuiltIn = false
	return &registration, nil
}

func (s *DynamicModuleService) SyncBuiltInModules() error {
	if s.db == nil {
		return nil
	}
	if err := s.db.AutoMigrate(&ModuleRegistration{}); err != nil {
		return err
	}
	if _, err := s.syncGeneratedModuleRegistrations(); err != nil {
		return err
	}
	if err := s.RebuildGeneratedRegistries(); err != nil {
		return err
	}
	if !s.db.Migrator().HasTable("system_menu") {
		return nil
	}

	type menuModuleRow struct {
		Module string
	}

	var rows []menuModuleRow
	if err := s.db.Table("system_menu").
		Select("DISTINCT module AS module").
		Where("module <> '' AND type IN ?", []string{"M", "C"}).
		Order("module ASC").
		Scan(&rows).Error; err != nil {
		return err
	}

	now := time.Now().Format(time.RFC3339)
	for _, row := range rows {
		moduleName := strings.TrimSpace(row.Module)
		if moduleName == "" {
			continue
		}

		registration := ModuleRegistration{
			Name:           moduleName,
			DisplayName:    moduleName,
			Scope:          inferModuleScope(moduleName),
			Source:         inferStaticModuleSource(moduleName),
			ModelTableName: "",
			Status:         ModuleStatusActive,
			InstalledAt:    now,
		}

		var existing ModuleRegistration
		err := s.db.Where("name = ?", moduleName).First(&existing).Error
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			if err := s.db.Create(&registration).Error; err != nil {
				return err
			}
		case err != nil:
			return err
		default:
			updates := map[string]interface{}{
				"status": ModuleStatusActive,
			}
			if strings.TrimSpace(existing.DisplayName) == "" {
				updates["display_name"] = registration.DisplayName
			}
			if strings.TrimSpace(existing.Scope) == "" {
				updates["scope"] = registration.Scope
			}
			if strings.TrimSpace(existing.Source) == "" {
				updates["source"] = registration.Source
			}
			if strings.TrimSpace(existing.InstalledAt) == "" {
				updates["installed_at"] = registration.InstalledAt
			}
			if len(updates) > 0 {
				if err := s.db.Model(&existing).Updates(updates).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func (s *DynamicModuleService) AuditAndRepairGeneratedRegistries() (*RegistryRepairSummary, error) {
	if s.db == nil {
		return nil, nil
	}
	if err := s.db.AutoMigrate(&ModuleRegistration{}); err != nil {
		return nil, err
	}
	markedUninstalled, err := s.syncGeneratedModuleRegistrations()
	if err != nil {
		return nil, err
	}
	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil, errors.New("workspace.not_found")
	}
	if err := scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs); err != nil {
		return nil, err
	}

	var modules []ModuleRegistration
	if err := s.db.Where("table_name <> ''").Find(&modules).Error; err != nil {
		return nil, err
	}

	summary := &RegistryRepairSummary{
		CheckedModules:           len(modules),
		GeneratedRegistryRefs:    len(refs),
		MarkedUninstalledModules: markedUninstalled,
	}
	for _, module := range modules {
		scope, name, err := splitModuleKey(module.Name)
		if err != nil {
			continue
		}
		if s.generatedModuleArtifactsExist(scope, name) {
			summary.ArtifactReadyModules++
		}
		if module.Status == ModuleStatusUninstalled {
			summary.PreservedUninstalledCount++
		}
	}
	return summary, nil
}

func (s *DynamicModuleService) syncGeneratedModuleRegistrations() (int, error) {
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return 0, nil
	}
	generatedSchemaRoot := filepath.Join(s.workspaceRoot, "schema", "generated")
	info, err := os.Stat(generatedSchemaRoot)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return 0, nil
		}
		return 0, err
	}
	if !info.IsDir() {
		return 0, nil
	}

	type generatedSchema struct {
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Scope       string `json:"scope"`
		Metadata    struct {
			BoundedContext string `json:"boundedContext"`
			Owner          string `json:"owner"`
			Summary        string `json:"summary"`
			SourceMode     string `json:"sourceMode"`
			SourceTable    string `json:"sourceTable"`
		} `json:"metadata"`
		Model struct {
			TableName string `json:"tableName"`
		} `json:"model"`
	}

	now := time.Now().Format(time.RFC3339)
	discovered := make(map[string]struct{})
	markedUninstalled := 0

	walkErr := filepath.WalkDir(generatedSchemaRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() || !strings.EqualFold(filepath.Ext(path), ".json") {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		var schema generatedSchema
		if err := json.Unmarshal(content, &schema); err != nil {
			return err
		}
		scope := strings.TrimSpace(schema.Scope)
		name := strings.TrimSpace(schema.Name)
		tableName := strings.TrimSpace(schema.Model.TableName)
		if (scope != "system" && scope != "business") || name == "" || tableName == "" {
			return nil
		}

		moduleKey := buildModuleKey(scope, name)
		if !s.generatedModuleArtifactsExist(scope, name) {
			return nil
		}
		discovered[moduleKey] = struct{}{}
		displayName := strings.TrimSpace(schema.DisplayName)
		if displayName == "" {
			displayName = moduleKey
		}

		registration := ModuleRegistration{
			Name:           moduleKey,
			DisplayName:    displayName,
			Scope:          scope,
			Source:         inferRegistrationSource(scope, schema.Metadata.SourceMode, schema.Name, true),
			Owner:          strings.TrimSpace(schema.Metadata.Owner),
			BoundedContext: strings.TrimSpace(schema.Metadata.BoundedContext),
			Summary:        strings.TrimSpace(schema.Metadata.Summary),
			SourceTable:    strings.TrimSpace(schema.Metadata.SourceTable),
			ModelTableName: tableName,
			Status:         ModuleStatusActive,
			InstalledAt:    now,
		}

		var existing ModuleRegistration
		err = s.db.Where("name = ?", moduleKey).First(&existing).Error
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			return s.db.Create(&registration).Error
		case err != nil:
			return err
		default:
			updates := map[string]interface{}{
				"display_name":    displayName,
				"scope":           scope,
				"source":          registration.Source,
				"owner":           registration.Owner,
				"bounded_context": registration.BoundedContext,
				"summary":         registration.Summary,
				"source_table":    registration.SourceTable,
				"table_name":      tableName,
			}
			if existing.Status != ModuleStatusUninstalled {
				updates["status"] = ModuleStatusActive
			}
			if strings.TrimSpace(existing.InstalledAt) == "" {
				updates["installed_at"] = registration.InstalledAt
			}
			return s.db.Model(&existing).Updates(updates).Error
		}
	})
	if walkErr != nil {
		return 0, walkErr
	}

	var managedModules []ModuleRegistration
	if err := s.db.Where("table_name <> ''").Find(&managedModules).Error; err != nil {
		return 0, err
	}
	for _, module := range managedModules {
		scope, name, err := splitModuleKey(module.Name)
		if err != nil {
			continue
		}
		_, found := discovered[module.Name]
		if found || s.generatedModuleArtifactsExist(scope, name) {
			continue
		}
		if module.Status == ModuleStatusUninstalled {
			continue
		}
		updates := map[string]interface{}{
			"status":         ModuleStatusUninstalled,
			"uninstalled_at": now,
		}
		if err := s.db.Model(&module).Updates(updates).Error; err != nil {
			return 0, err
		}
		markedUninstalled++
	}
	return markedUninstalled, nil
}

// UnregisterModule 卸载模块
// 1. 删除菜单/权限
// 2. 可选删除数据表
// 3. 从注册表标记为卸载
func (s *DynamicModuleService) UnregisterModule(moduleName string, dropTable bool, purgeSource bool) error {
	if s.db == nil {
		return nil
	}

	var registration ModuleRegistration
	if err := s.db.Where("name = ?", moduleName).First(&registration).Error; err == nil {
		if strings.TrimSpace(registration.ModelTableName) == "" {
			return errors.New("module.unregister.builtin_forbidden")
		}
	}

	scope, shortName, err := splitModuleKey(moduleName)
	if err != nil {
		return err
	}

	if s.db.Migrator().HasTable("system_menu") {
		if err := s.db.Table("system_menu").
			Where("module = ?", moduleName).
			Delete(nil).Error; err != nil {
			return err
		}
	}

	if s.db.Migrator().HasTable("system_role_permission") {
		if err := s.db.Table("system_role_permission").
			Where("permission_key LIKE ?", scope+":"+shortName+":%").
			Delete(nil).Error; err != nil {
			return err
		}
	}

	if dropTable {
		var tableName string
		if err := s.db.Table("system_module_registration").
			Select("table_name").
			Where("name = ?", moduleName).
			Pluck("table_name", &tableName).Error; err != nil {
			return err
		}

		if tableName != "" {
			s.db.Exec("DROP TABLE IF EXISTS " + tableName)
		}
	}

	if err := s.db.Table("system_module_registration").
		Where("name = ?", moduleName).
		Updates(map[string]interface{}{
			"status":         ModuleStatusUninstalled,
			"uninstalled_at": time.Now().Format(time.RFC3339),
		}).Error; err != nil {
		return err
	}

	return s.FinalizeUnregister(moduleName, purgeSource)
}

func (s *DynamicModuleService) DeleteModuleRecord(moduleName string) error {
	if s.db == nil {
		return nil
	}

	var registration ModuleRegistration
	if err := s.db.Where("name = ?", moduleName).First(&registration).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("module.not_found")
		}
		return err
	}
	if strings.TrimSpace(registration.ModelTableName) == "" {
		return errors.New("module.unregister.builtin_forbidden")
	}
	if registration.Status != ModuleStatusUninstalled {
		return errors.New("module.delete_record.requires_uninstalled")
	}

	if err := s.db.Delete(&registration).Error; err != nil {
		return err
	}

	if strings.TrimSpace(s.workspaceRoot) == "" {
		return nil
	}
	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return err
	}
	return scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs)
}

func (s *DynamicModuleService) PurgeModule(moduleName string, dropTable bool, purgeSource bool) error {
	if s.db == nil {
		return nil
	}

	var registration ModuleRegistration
	if err := s.db.Where("name = ?", moduleName).First(&registration).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("module.not_found")
		}
		return err
	}
	if strings.TrimSpace(registration.ModelTableName) == "" {
		return errors.New("module.unregister.builtin_forbidden")
	}

	if registration.Status != ModuleStatusUninstalled {
		if err := s.UnregisterModule(moduleName, dropTable, false); err != nil {
			return err
		}
	} else if dropTable && strings.TrimSpace(registration.ModelTableName) != "" {
		s.db.Exec("DROP TABLE IF EXISTS " + registration.ModelTableName)
	}

	if err := s.db.Delete(&registration).Error; err != nil {
		return err
	}
	return s.FinalizeUnregister(moduleName, purgeSource)
}

// ListRegisteredModules 获取已注册模块列表
func (s *DynamicModuleService) ListRegisteredModules() ([]ModuleRegistration, error) {
	if err := s.SyncBuiltInModules(); err != nil {
		return nil, err
	}
	var modules []ModuleRegistration
	if err := s.db.Table("system_module_registration").
		Order("scope ASC").
		Order("name ASC").
		Find(&modules).Error; err != nil {
		return nil, err
	}
	for index := range modules {
		modules[index].BuiltIn = strings.TrimSpace(modules[index].ModelTableName) == ""
	}
	return modules, nil
}

// GetModuleStatus 获取模块状态
func (s *DynamicModuleService) GetModuleStatus(moduleName string) (*ModuleRegistration, error) {
	if err := s.SyncBuiltInModules(); err != nil {
		return nil, err
	}
	var module ModuleRegistration
	if err := s.db.Table("system_module_registration").
		Where("name = ?", moduleName).
		First(&module).Error; err != nil {
		return nil, err
	}
	module.BuiltIn = strings.TrimSpace(module.ModelTableName) == ""
	return &module, nil
}

func (s *DynamicModuleService) FinalizeUnregister(moduleName string, purgeSource bool) error {
	scope, shortName, err := splitModuleKey(moduleName)
	if err != nil {
		return err
	}
	if strings.TrimSpace(s.workspaceRoot) == "" {
		return errors.New("workspace.not_found")
	}
	if purgeSource {
		if err := scaffold.RemoveGeneratedModuleSource(s.workspaceRoot, scope, shortName); err != nil {
			return err
		}
	}
	refs, err := s.listGeneratedModuleRefs()
	if err != nil {
		return err
	}
	return scaffold.WriteGeneratedRegistries(s.workspaceRoot, refs)
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
	return generatedDirExists(filepath.Join(s.workspaceRoot, "backend", "modules", scope, name)) &&
		generatedDirExists(filepath.Join(s.workspaceRoot, "frontend", "src", "modules", scope, name)) &&
		generatedPathExists(filepath.Join(s.workspaceRoot, "schema", "generated", scope, name+".json"))
}

func (s *DynamicModuleService) loadGeneratedModuleSchema(scope string, name string) (*scaffold.ModuleSchema, error) {
	target := filepath.Join(s.workspaceRoot, "schema", "generated", scope, name+".json")
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

func inferModuleScope(moduleName string) string {
	if strings.HasPrefix(moduleName, "business.") {
		return "business"
	}
	if strings.HasPrefix(moduleName, "platform") {
		return "platform"
	}
	return "system"
}

func splitModuleKey(moduleName string) (string, string, error) {
	normalized := strings.TrimSpace(moduleName)
	if normalized == "" {
		return "", "", errors.New("module.invalid_name")
	}
	parts := strings.SplitN(normalized, ".", 2)
	if len(parts) != 2 {
		return "", "", errors.New("module.invalid_name")
	}
	scope := strings.TrimSpace(parts[0])
	name := strings.TrimSpace(strings.ReplaceAll(parts[1], ".", "/"))
	if (scope != "system" && scope != "business") || name == "" {
		return "", "", errors.New("module.invalid_name")
	}
	return scope, name, nil
}

func buildModuleKey(scope string, name string) string {
	return strings.TrimSpace(scope) + "." + strings.ReplaceAll(strings.Trim(strings.TrimSpace(name), "/"), "/", ".")
}

func (s *DynamicModuleService) buildGeneratedModuleSummary(req *scaffold.RegisterGeneratedModuleRequest, writtenFiles []string) *GeneratedModuleRegistrationSummary {
	scope := strings.TrimSpace(req.Schema.Scope)
	name := normalizeGeneratedModulePath(req.Schema.Name)
	moduleKey := buildModuleKey(scope, name)
	modelName := inferGeneratedModelName(name, req.Schema.Model.ModelName)
	routePath := "/" + scope + "/" + strings.ReplaceAll(name, "\\", "/")
	routeName := scope + "-" + strings.ReplaceAll(name, "/", "-")
	componentKey := scope + "/" + name + "/" + modelName + "List"
	permissionPrefix := scope + ":" + strings.ReplaceAll(name, "/", ":")
	parentMenuPath, parentMenuSource := resolveGeneratedParentMenu(scope, name, req.Schema.ParentMenu)
	parentMenuExists := s.generatedParentMenuExists(parentMenuPath)

	summary := &GeneratedModuleRegistrationSummary{
		ModuleKey:             moduleKey,
		RoutePath:             routePath,
		RouteName:             routeName,
		ComponentKey:          componentKey,
		PermissionPrefix:      permissionPrefix,
		ParentMenuPath:        parentMenuPath,
		ParentMenuSource:      parentMenuSource,
		ParentMenuExists:      parentMenuExists,
		BackendModulePath:     filepath.ToSlash(filepath.Join("backend", "modules", scope, name)),
		FrontendModulePath:    filepath.ToSlash(filepath.Join("frontend", "src", "modules", scope, name)),
		SchemaPath:            filepath.ToSlash(filepath.Join("schema", "generated", scope, name+".json")),
		RequiresRestart:       true,
		RequiresFrontendBuild: true,
	}

	summary.Verifications = []GeneratedModuleVerification{
		s.verifyGeneratedFilesWritten(writtenFiles),
		s.verifyRegistryFile(
			"backend_registry",
			"pass",
			"module.generate.verify.backend_registry_updated",
			filepath.Join("backend", "modules", scope, "generated_registry.go"),
			fmt.Sprintf("backend/modules/%s/%s", scope, name),
			fmt.Sprintf("Init%sModule", toGeneratedPascal(name)),
		),
		s.verifyRegistryFile(
			"frontend_registry",
			"pass",
			"module.generate.verify.frontend_registry_updated",
			filepath.Join("frontend", "src", "modules", "generated", scope+".ts"),
			toGeneratedPascal(name)+"Module",
		),
		s.verifyRegistryFile(
			"frontend_component_registry",
			"pass",
			"module.generate.verify.component_registry_updated",
			filepath.Join("frontend", "src", "core", "router", "generatedComponentRegistry.ts"),
			componentKey,
		),
		s.verifyRegistryFile(
			"backend_component_registry",
			"pass",
			"module.generate.verify.backend_component_registry_updated",
			filepath.Join("backend", "modules", "system", "iam", "menu", "generated_component_registry.go"),
			componentKey,
		),
		s.verifyParentMenu(parentMenuPath, parentMenuSource, parentMenuExists),
		{
			Code:       "pending_activation",
			Status:     "info",
			MessageKey: "module.generate.verify.pending_activation",
			Detail:     "status=pending_activation",
		},
		{
			Code:       "restart_required",
			Status:     "info",
			MessageKey: "module.generate.verify.restart_required",
			Detail:     "backend_restart_required=true",
		},
		{
			Code:       "frontend_build_required",
			Status:     "info",
			MessageKey: "module.generate.verify.frontend_build_required",
			Detail:     "frontend_build_required=true",
		},
	}

	return summary
}

func (s *DynamicModuleService) verifyGeneratedFilesWritten(writtenFiles []string) GeneratedModuleVerification {
	missing := make([]string, 0)
	for _, relativePath := range writtenFiles {
		if !generatedPathExists(filepath.Join(s.workspaceRoot, filepath.FromSlash(relativePath))) {
			missing = append(missing, relativePath)
		}
	}
	if len(missing) == 0 {
		return GeneratedModuleVerification{
			Code:       "source_written",
			Status:     "pass",
			MessageKey: "module.generate.verify.source_written",
			Detail:     fmt.Sprintf("%d files written", len(writtenFiles)),
		}
	}
	return GeneratedModuleVerification{
		Code:       "source_written",
		Status:     "warn",
		MessageKey: "module.generate.verify.source_write_incomplete",
		Detail:     strings.Join(missing, ", "),
	}
}

func (s *DynamicModuleService) verifyRegistryFile(code string, passStatus string, passKey string, relativePath string, fragments ...string) GeneratedModuleVerification {
	target := filepath.Join(s.workspaceRoot, relativePath)
	if generatedFileContainsAll(target, fragments...) {
		return GeneratedModuleVerification{
			Code:       code,
			Status:     passStatus,
			MessageKey: passKey,
			Detail:     filepath.ToSlash(relativePath),
		}
	}
	return GeneratedModuleVerification{
		Code:       code,
		Status:     "warn",
		MessageKey: "module.generate.verify.registry_check_failed",
		Detail:     filepath.ToSlash(relativePath),
	}
}

func (s *DynamicModuleService) verifyParentMenu(parentMenuPath string, parentMenuSource string, parentMenuExists bool) GeneratedModuleVerification {
	if parentMenuSource == "top_level" {
		return GeneratedModuleVerification{
			Code:       "parent_menu",
			Status:     "info",
			MessageKey: "module.generate.verify.parent_menu_top_level",
			Detail:     "top_level",
		}
	}
	if parentMenuExists {
		return GeneratedModuleVerification{
			Code:       "parent_menu",
			Status:     "pass",
			MessageKey: "module.generate.verify.parent_menu_found",
			Detail:     parentMenuPath,
		}
	}
	return GeneratedModuleVerification{
		Code:       "parent_menu",
		Status:     "warn",
		MessageKey: "module.generate.verify.parent_menu_missing",
		Detail:     parentMenuPath,
	}
}

func (s *DynamicModuleService) generatedParentMenuExists(parentMenuPath string) bool {
	if strings.TrimSpace(parentMenuPath) == "" || s.db == nil || !s.db.Migrator().HasTable("system_menu") {
		return false
	}
	var count int64
	if err := s.db.Table("system_menu").Where("path = ?", strings.TrimSpace(parentMenuPath)).Count(&count).Error; err != nil {
		return false
	}
	return count > 0
}

func resolveGeneratedParentMenu(scope string, name string, explicitParent string) (string, string) {
	parentMenuPath := normalizeGeneratedMenuPath(explicitParent)
	if parentMenuPath != "" {
		return parentMenuPath, "explicit"
	}
	segments := strings.Split(normalizeGeneratedModulePath(name), "/")
	if len(segments) <= 1 {
		return "", "top_level"
	}
	return "/" + strings.TrimSpace(scope) + "/" + strings.Join(segments[:len(segments)-1], "/"), "inferred"
}

func inferGeneratedModelName(name string, explicit string) string {
	if strings.TrimSpace(explicit) != "" {
		return strings.TrimSpace(explicit)
	}
	return toGeneratedPascal(name)
}

func normalizeGeneratedModulePath(name string) string {
	return strings.Trim(strings.ReplaceAll(strings.TrimSpace(name), "\\", "/"), "/")
}

func normalizeGeneratedMenuPath(path string) string {
	normalized := strings.TrimSpace(strings.ReplaceAll(path, "\\", "/"))
	if normalized == "" {
		return ""
	}
	return "/" + strings.TrimLeft(normalized, "/")
}

func toGeneratedPascal(value string) string {
	parts := strings.FieldsFunc(value, func(char rune) bool {
		return char == '_' || char == '-' || char == ' ' || char == '/' || char == '\\'
	})
	var builder strings.Builder
	for _, part := range parts {
		runes := []rune(part)
		if len(runes) == 0 {
			continue
		}
		runes[0] = unicode.ToUpper(runes[0])
		for index := 1; index < len(runes); index++ {
			runes[index] = unicode.ToLower(runes[index])
		}
		builder.WriteString(string(runes))
	}
	return builder.String()
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
	text := string(content)
	for _, fragment := range fragments {
		if fragment == "" {
			continue
		}
		if !strings.Contains(text, fragment) {
			return false
		}
	}
	return true
}

func inferStaticModuleSource(moduleName string) string {
	if strings.HasPrefix(moduleName, "business.") {
		return "static"
	}
	return "core"
}

func inferRegistrationSource(scope string, sourceMode string, name string, managed bool) string {
	normalizedMode := strings.TrimSpace(strings.ToLower(sourceMode))
	switch normalizedMode {
	case "database":
		return "database"
	case "manual":
		return "manual"
	}
	if managed {
		return "generated"
	}
	if strings.TrimSpace(scope) == "business" && !strings.Contains(strings.TrimSpace(name), "/") {
		return "static"
	}
	return "core"
}
