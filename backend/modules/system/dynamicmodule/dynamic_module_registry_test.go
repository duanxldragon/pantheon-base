package dynamicmodule

import (
	"path/filepath"
	"testing"
)

func TestGeneratedWorkspacePathRejectsTraversal(t *testing.T) {
	workspaceRoot := prepareDynamicModuleWorkspace(t)

	if target, ok := resolveGeneratedWorkspacePath(workspaceRoot, "../escape.txt"); ok || target != "" {
		t.Fatalf("expected traversal path to be rejected, got target=%q ok=%v", target, ok)
	}
	if generatedPathExists(workspaceRoot, "../escape.txt") {
		t.Fatal("expected traversal file lookup to fail")
	}
	if generatedDirExists(workspaceRoot, "../escape.txt") {
		t.Fatal("expected traversal directory lookup to fail")
	}
	if generatedFileContainsAll(workspaceRoot, "../escape.txt", "escape") {
		t.Fatal("expected traversal file read to fail")
	}
}

func TestGeneratedWorkspacePathHelpersUseWorkspaceRoot(t *testing.T) {
	workspaceRoot := prepareDynamicModuleWorkspace(t)

	dirRelativePath := filepath.Join("backend", "modules", "business", "ticket")
	fileRelativePath := filepath.Join("schema", "generated", "business", "ticket.json")

	mustWriteFile(t, filepath.Join(workspaceRoot, dirRelativePath, "module.go"), "package ticket\n")
	mustWriteFile(t, filepath.Join(workspaceRoot, fileRelativePath), `{"name":"ticket","scope":"business"}`)

	if !generatedDirExists(workspaceRoot, dirRelativePath) {
		t.Fatal("expected generated directory lookup to succeed")
	}
	if !generatedPathExists(workspaceRoot, fileRelativePath) {
		t.Fatal("expected generated file lookup to succeed")
	}
	if !generatedFileContainsAll(workspaceRoot, fileRelativePath, `"name":"ticket"`, `"scope":"business"`) {
		t.Fatal("expected generated file contents check to succeed")
	}
}
