package generator

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/internal/scaffold"
)

func TestGeneratorHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewGeneratorHandler(NewGeneratorService(nil))

	handler.ListDatasources(newGeneratorJSONContext(http.MethodGet, "/", ""))
	handler.CreateDatasource(newGeneratorJSONContext(http.MethodPost, "/", `{"name":"primary","driver":"mysql","host":"127.0.0.1","databaseName":"pantheon","username":"root","password":"secret"}`))

	context := newGeneratorJSONContext(http.MethodPost, "/", `{"name":"primary","driver":"mysql","host":"127.0.0.1","databaseName":"pantheon","username":"root"}`)
	context.Params = gin.Params{{Key: generatorParamID, Value: "1"}}
	handler.UpdateDatasource(context)

	context = newGeneratorJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: generatorParamID, Value: "1"}}
	handler.DeleteDatasource(context)

	context = newGeneratorJSONContext(http.MethodPost, "/", "")
	context.Params = gin.Params{{Key: generatorParamID, Value: "1"}}
	handler.TestDatasource(context)

	handler.ListTables(newGeneratorJSONContext(http.MethodGet, "/?datasourceId=1", ""))
	handler.PreviewTable(newGeneratorJSONContext(http.MethodGet, "/?datasourceId=1&tableName=demo_table", ""))
	handler.PreviewGeneratedFiles(newGeneratorJSONContext(http.MethodPost, "/", `{"schema":{"scope":"business","name":"demo","displayName":"Demo","model":{"tableName":"biz_demo"}}}`))
	handler.DownloadGeneratedSource(newGeneratorJSONContext(http.MethodPost, "/", `{"schema":{"scope":"business","name":"demo","displayName":"Demo","model":{"tableName":"biz_demo"}}}`))
}

func TestGeneratorService_GuardBranches(t *testing.T) {
	service := &GeneratorService{workspaceRoot: ""}

	if _, err := service.PreviewGeneratedFiles(nil); err == nil || err.Error() != "module.generate.invalid_payload" {
		t.Fatalf("expected invalid schema payload error, got %v", err)
	}
	validSchema := &scaffold.ModuleSchema{}
	validSchema.Scope = "business"
	validSchema.Name = "demo"
	validSchema.DisplayName = "Demo"
	validSchema.Model.TableName = "biz_demo"
	if _, err := service.PreviewGeneratedFiles(validSchema); err == nil || err.Error() != "workspace.not_found" {
		t.Fatalf("expected workspace-not-found preview error, got %v", err)
	}
	if _, err := service.PreviewTable("", ""); err == nil || err.Error() != "generator.table.required" {
		t.Fatalf("expected empty table error, got %v", err)
	}
	if _, err := service.PreviewTable("", "bad-name!"); err == nil || err.Error() != "generator.table.invalid" {
		t.Fatalf("expected invalid table name error, got %v", err)
	}
	if _, err := normalizeDatasourceReq(nil, true); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected nil datasource req error, got %v", err)
	}
	if _, err := normalizeDatasourceReq(&UpsertGeneratorDatasourceReq{}, true); err == nil || err.Error() != "generator.datasource.required" {
		t.Fatalf("expected required datasource fields error, got %v", err)
	}
	if _, err := normalizeDatasourceReq(&UpsertGeneratorDatasourceReq{Name: "demo", Driver: "postgres", Host: "127.0.0.1", DatabaseName: "pantheon", Username: "root", Password: "secret"}, true); err == nil || err.Error() != "generator.datasource.driver_unsupported" {
		t.Fatalf("expected unsupported driver error, got %v", err)
	}
	if _, err := normalizeDatasourceReq(&UpsertGeneratorDatasourceReq{Name: "demo", Driver: "mysql", Host: "db.example.com", Port: 70000, DatabaseName: "pantheon", Username: "root", Password: "secret"}, true); err == nil || err.Error() != "generator.datasource.port_invalid" {
		t.Fatalf("expected invalid port error, got %v", err)
	}
	if _, err := normalizeDatasourceReq(&UpsertGeneratorDatasourceReq{Name: "demo", Driver: "mysql", Host: "db.example.com", DatabaseName: "pantheon", Username: "root"}, true); err == nil || err.Error() != "generator.datasource.password_required" {
		t.Fatalf("expected missing password error, got %v", err)
	}
	if err := validateDatasourceHost("localhost"); err == nil || err.Error() != generatorDatasourceHostInvalidKey {
		t.Fatalf("expected localhost host error, got %v", err)
	}
	if _, err := parseDatasourceNumericID(" "); err == nil || err.Error() != generatorDatasourceNotFoundKey {
		t.Fatalf("expected blank datasource id error, got %v", err)
	}
}

func TestGeneratorService_NilDBDatasourceGuards(t *testing.T) {
	service := NewGeneratorService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"list datasources", func() error { _, err := service.ListDatasources(); return err }},
		{"create datasource", func() error {
			_, err := service.CreateDatasource(&UpsertGeneratorDatasourceReq{Name: "primary", Driver: "mysql", Host: "db.example.com", DatabaseName: "pantheon", Username: "root", Password: "secret"})
			return err
		}},
		{"update datasource", func() error {
			_, err := service.UpdateDatasource("1", &UpsertGeneratorDatasourceReq{Name: "primary", Driver: "mysql", Host: "db.example.com", DatabaseName: "pantheon", Username: "root"})
			return err
		}},
		{"delete datasource", func() error { return service.DeleteDatasource("1") }},
		{"test datasource", func() error { _, err := service.TestDatasource("1"); return err }},
		{"open schema reader", func() error { _, err := service.openSchemaReader("1"); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != generatorDatasourceDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", generatorDatasourceDatabaseNotInitializedKey, err)
			}
		})
	}
}
