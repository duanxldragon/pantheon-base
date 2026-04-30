package generator

import "testing"

func TestSuggestModuleNameMatchesScopeConventions(t *testing.T) {
	tests := []struct {
		tableName string
		want      string
	}{
		{tableName: "biz_cmdb_host", want: "cmdb/host"},
		{tableName: "biz_vendor", want: "vendor"},
		{tableName: "system_login_log", want: "login_log"},
	}

	for _, tt := range tests {
		t.Run(tt.tableName, func(t *testing.T) {
			if got := suggestModuleName(tt.tableName); got != tt.want {
				t.Fatalf("suggestModuleName(%q) = %q, want %q", tt.tableName, got, tt.want)
			}
		})
	}
}

func TestMapColumnToFieldInfersEnvironmentEnumFromVarchar(t *testing.T) {
	field := mapColumnToField(columnRow{
		ColumnName: "environment",
		DataType:   "varchar",
		ColumnType: "varchar(50)",
		IsNullable: "NO",
	})

	if field.Type != "enum" {
		t.Fatalf("expected environment field type enum, got %q", field.Type)
	}
	if field.DictCode != "environment" {
		t.Fatalf("expected dictCode environment, got %q", field.DictCode)
	}
	if len(field.EnumOptions) != 4 {
		t.Fatalf("expected 4 enum options, got %d", len(field.EnumOptions))
	}
	if field.Validation == nil || len(field.Validation.Enum) != 4 {
		t.Fatalf("expected validation enum to be populated")
	}
}

func TestMapColumnToFieldInfersStatusEnumFromVarchar(t *testing.T) {
	field := mapColumnToField(columnRow{
		ColumnName: "status",
		DataType:   "varchar",
		ColumnType: "varchar(50)",
		IsNullable: "YES",
	})

	if field.Type != "enum" {
		t.Fatalf("expected status field type enum, got %q", field.Type)
	}
	if field.DictCode != "status" {
		t.Fatalf("expected dictCode status, got %q", field.DictCode)
	}
	if len(field.EnumOptions) != 2 {
		t.Fatalf("expected 2 enum options, got %d", len(field.EnumOptions))
	}
}
