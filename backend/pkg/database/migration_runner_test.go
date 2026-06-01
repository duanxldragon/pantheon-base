package database

import (
	"testing"

	"gorm.io/gorm"
	"pantheon-platform/backend/pkg/testmysql"
)

type migrationRunnerTestRow struct {
	ID       uint64 `gorm:"primaryKey;autoIncrement"`
	DeptID   uint64 `gorm:"index:idx_migration_runner_dept_status,priority:1"`
	Status   int    `gorm:"index:idx_migration_runner_dept_status,priority:2"`
	Nickname string `gorm:"size:64"`
}

func (migrationRunnerTestRow) TableName() string {
	return "migration_runner_test_row"
}

func TestRunMigrationsAppliesStepOnlyOnce(t *testing.T) {
	db := testmysql.Open(t)
	if err := db.AutoMigrate(&migrationRunnerTestRow{}); err != nil {
		t.Fatalf("migrate test row: %v", err)
	}

	appliedCount := 0
	steps := []MigrationStep{
		{
			Version: "20260601_query_indexes",
			Apply: func(tx *gorm.DB) error {
				appliedCount++
				return EnsureIndexes(tx, &migrationRunnerTestRow{}, "idx_migration_runner_dept_status")
			},
		},
	}

	if err := RunMigrations(db, "test.migration-runner", steps); err != nil {
		t.Fatalf("first run migrations: %v", err)
	}
	if err := RunMigrations(db, "test.migration-runner", steps); err != nil {
		t.Fatalf("second run migrations: %v", err)
	}
	if appliedCount != 1 {
		t.Fatalf("expected migration apply called once, got %d", appliedCount)
	}
	if !db.Migrator().HasIndex(&migrationRunnerTestRow{}, "idx_migration_runner_dept_status") {
		t.Fatalf("expected idx_migration_runner_dept_status to exist")
	}

	var rowCount int64
	if err := db.Model(&SystemSchemaMigration{}).
		Where("module = ? AND version = ?", "test.migration-runner", "20260601_query_indexes").
		Count(&rowCount).Error; err != nil {
		t.Fatalf("count migration rows: %v", err)
	}
	if rowCount != 1 {
		t.Fatalf("expected one migration row, got %d", rowCount)
	}
}

func TestRunMigrationsValidatesInput(t *testing.T) {
	db := testmysql.Open(t)

	if err := RunMigrations(db, "", []MigrationStep{}); err == nil || err.Error() != "migration.module_required" {
		t.Fatalf("expected migration.module_required, got %v", err)
	}
	if err := RunMigrations(db, "test", []MigrationStep{{Version: "", Apply: func(*gorm.DB) error { return nil }}}); err == nil || err.Error() != "migration.version_required" {
		t.Fatalf("expected migration.version_required, got %v", err)
	}
	if err := RunMigrations(db, "test", []MigrationStep{{Version: "20260601"}}); err == nil || err.Error() != "migration.apply_required" {
		t.Fatalf("expected migration.apply_required, got %v", err)
	}
}
