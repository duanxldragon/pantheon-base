package scaffold

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateRegisterRequestHonorsScopeSpecificModuleNameRules(t *testing.T) {
	tests := []struct {
		name      string
		req       *RegisterGeneratedModuleRequest
		wantError string
	}{
		{
			name: "business scope allows nested path",
			req: &RegisterGeneratedModuleRequest{
				Schema: ModuleSchema{
					Name:        "cmdb/host",
					Scope:       "business",
					DisplayName: "主机管理",
					Model: struct {
						TableName string        `json:"tableName"`
						ModelName string        `json:"modelName"`
						Fields    []ModuleField `json:"fields"`
					}{
						TableName: "biz_cmdb_host",
					},
				},
				Files: []GeneratedFile{{Path: "backend/modules/business/cmdb/host/module.go", Content: "package host"}},
			},
		},
		{
			name: "system scope rejects nested path",
			req: &RegisterGeneratedModuleRequest{
				Schema: ModuleSchema{
					Name:        "config/audit",
					Scope:       "system",
					DisplayName: "审计配置",
					Model: struct {
						TableName string        `json:"tableName"`
						ModelName string        `json:"modelName"`
						Fields    []ModuleField `json:"fields"`
					}{
						TableName: "system_config_audit",
					},
				},
				Files: []GeneratedFile{{Path: "backend/modules/system/config/audit/module.go", Content: "package system"}},
			},
			wantError: "module.generate.invalid_name",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRegisterRequest(tt.req)
			if tt.wantError == "" && err != nil {
				t.Fatalf("expected success, got %v", err)
			}
			if tt.wantError != "" {
				if err == nil || err.Error() != tt.wantError {
					t.Fatalf("expected %s, got %v", tt.wantError, err)
				}
			}
		})
	}
}

func TestWriteGeneratedFallbackResourcesBuildsGeneratedLocaleFiles(t *testing.T) {
	root := t.TempDir()
	schemaDir := filepath.Join(root, "schema", "generated", "business", "cmdb")
	if err := os.MkdirAll(schemaDir, 0o755); err != nil {
		t.Fatalf("mkdir schema dir: %v", err)
	}
	schemaContent := `{
  "name": "cmdb/host",
  "displayName": "主机管理",
  "scope": "business",
  "model": {
    "tableName": "biz_cmdb_host",
    "modelName": "CmdbHost",
    "fields": []
  },
  "i18n": {
    "namespace": "business.cmdb.host",
    "translations": {
      "zh": {
        "business.cmdb.host.title": "主机管理",
        "business.cmdb.host.permission.export": "导出主机管理"
      },
      "en": {
        "business.cmdb.host.title": "Host Management",
        "business.cmdb.host.permission.export": "Export Host Management"
      }
    }
  }
}`
	if err := os.WriteFile(filepath.Join(schemaDir, "host.json"), []byte(schemaContent), 0o644); err != nil {
		t.Fatalf("write schema: %v", err)
	}

	if err := WriteGeneratedFallbackResources(root); err != nil {
		t.Fatalf("write generated fallback resources: %v", err)
	}

	zhContent, err := os.ReadFile(filepath.Join(root, "frontend", "src", "i18n", "resources", "generated", "zh-CN.ts"))
	if err != nil {
		t.Fatalf("read zh generated file: %v", err)
	}
	if !strings.Contains(string(zhContent), `"business.cmdb.host.permission.export": "导出主机管理"`) {
		t.Fatalf("expected zh generated fallback to include host export permission, got %s", string(zhContent))
	}

	enContent, err := os.ReadFile(filepath.Join(root, "frontend", "src", "i18n", "resources", "generated", "en-US.ts"))
	if err != nil {
		t.Fatalf("read en generated file: %v", err)
	}
	if !strings.Contains(string(enContent), `"business.cmdb.host.title": "Host Management"`) {
		t.Fatalf("expected en generated fallback to include host title, got %s", string(enContent))
	}

	jaContent, err := os.ReadFile(filepath.Join(root, "frontend", "src", "i18n", "resources", "generated", "ja-JP.ts"))
	if err != nil {
		t.Fatalf("read ja generated file: %v", err)
	}
	if !strings.Contains(string(jaContent), "{}") {
		t.Fatalf("expected unsupported locale generated fallback to stay empty, got %s", string(jaContent))
	}
}
