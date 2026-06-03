package system

import (
	"testing"
	"time"
)

func TestAuditService_NilDBGuards(t *testing.T) {
	service := NewAuditService(nil)

	if err := service.Migrate(); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db migrate guard, got %v", err)
	}
	if _, err := service.ListOperationLogs(nil); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db list guard, got %v", err)
	}
	if _, err := service.GetOperationLog(1); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db detail guard, got %v", err)
	}
	if _, err := service.ExportOperationLogs(nil); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db export guard, got %v", err)
	}
	if err := service.DeleteOperationLog(1); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db delete guard, got %v", err)
	}
	if _, err := service.CleanupOperationLogs(1, "", ""); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db cleanup guard, got %v", err)
	}
	if _, err := service.BatchDeleteOperationLogs([]uint64{1}); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db batch delete guard, got %v", err)
	}
	if err := service.backfillOperationLogDerivedFields(); err == nil || err.Error() != "database.not_initialized" {
		t.Fatalf("expected nil-db backfill guard, got %v", err)
	}
}

func TestParseOperationCleanupWindowRejectsInvalidRanges(t *testing.T) {
	if _, err := parseOperationCleanupWindow("", "2026-01-01T00:00:00Z"); err == nil || err.Error() != "audit.operation_log.cleanup.range_invalid" {
		t.Fatalf("expected missing-start validation error, got %v", err)
	}
	if _, err := parseOperationCleanupWindow("not-a-time", "2026-01-01T00:00:00Z"); err == nil || err.Error() != "audit.operation_log.cleanup.range_invalid" {
		t.Fatalf("expected invalid-start validation error, got %v", err)
	}
	if _, err := parseOperationCleanupWindow("2026-01-02T00:00:00Z", "2026-01-01T00:00:00Z"); err == nil || err.Error() != "audit.operation_log.cleanup.range_invalid" {
		t.Fatalf("expected reversed-range validation error, got %v", err)
	}

	window, err := parseOperationCleanupWindow("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")
	if err != nil {
		t.Fatalf("expected valid cleanup window, got %v", err)
	}
	if window == nil || !window.EndedAt.After(window.StartedAt) {
		t.Fatalf("expected ordered cleanup window, got %+v", window)
	}
}

func TestAuditService_ValidationGuards(t *testing.T) {
	db := setupAuditTestDB(t)
	service := NewAuditService(db)

	if _, err := service.CleanupOperationLogs(99, "", ""); err == nil || err.Error() != "audit.operation_log.cleanup.days_invalid" {
		t.Fatalf("expected retention-days validation error, got %v", err)
	}
	if _, err := service.BatchDeleteOperationLogs(nil); err == nil || err.Error() != "audit.operation_log.delete.ids_required" {
		t.Fatalf("expected empty-id validation error, got %v", err)
	}

	_, err := service.CleanupOperationLogs(1, time.Now().Add(-time.Hour).Format(time.RFC3339), time.Now().Format(time.RFC3339))
	if err != nil {
		t.Fatalf("expected explicit time-range cleanup to pass, got %v", err)
	}
}
