package dynamicmodule

import (
	"path/filepath"
	"testing"
)

func TestGeneratedModulePathRejectsTraversal(t *testing.T) {
	root := t.TempDir()
	cases := [][]string{
		{"schema", "generated", "business", "../secret.json"},
		{"schema", "generated", "business", "cmdb/../secret.json"},
		{"schema", "generated", "business", `C:\windows\system.ini`},
	}
	for _, parts := range cases {
		if _, err := generatedModulePath(root, parts...); err == nil {
			t.Fatalf("expected traversal to be rejected for %v", parts)
		}
	}
}

func TestGeneratedModulePathAllowsNestedModuleSchema(t *testing.T) {
	root := t.TempDir()
	target, err := generatedModulePath(root, "schema", "generated", "business", "cmdb/host.json")
	if err != nil {
		t.Fatalf("build generated module path: %v", err)
	}
	expected := filepath.Join(root, "schema", "generated", "business", "cmdb", "host.json")
	if target != expected {
		t.Fatalf("expected %s, got %s", expected, target)
	}
}
