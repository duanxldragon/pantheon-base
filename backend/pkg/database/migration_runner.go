package database

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type SystemSchemaMigration struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement"`
	Module    string    `gorm:"size:64;not null;uniqueIndex:idx_system_schema_migration_unique,priority:1"`
	Version   string    `gorm:"size:128;not null;uniqueIndex:idx_system_schema_migration_unique,priority:2"`
	AppliedAt time.Time `gorm:"not null"`
	CreatedAt time.Time
}

func (SystemSchemaMigration) TableName() string {
	return "system_schema_migration"
}

type MigrationStep struct {
	Version string
	Apply   func(tx *gorm.DB) error
}

func RunMigrations(db *gorm.DB, module string, steps []MigrationStep) error {
	if db == nil {
		return errors.New("database.not_initialized")
	}

	module = strings.TrimSpace(module)
	if module == "" {
		return errors.New("migration.module_required")
	}
	if len(steps) == 0 {
		return nil
	}

	if err := db.AutoMigrate(&SystemSchemaMigration{}); err != nil {
		return err
	}

	for _, step := range steps {
		version := strings.TrimSpace(step.Version)
		if version == "" {
			return errors.New("migration.version_required")
		}
		if step.Apply == nil {
			return errors.New("migration.apply_required")
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			var count int64
			if err := tx.Model(&SystemSchemaMigration{}).
				Where("module = ? AND version = ?", module, version).
				Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return nil
			}
			if err := step.Apply(tx); err != nil {
				return err
			}
			return tx.Create(&SystemSchemaMigration{
				Module:    module,
				Version:   version,
				AppliedAt: time.Now(),
			}).Error
		}); err != nil {
			return err
		}
	}

	return nil
}

func EnsureIndexes(db *gorm.DB, model any, indexNames ...string) error {
	if db == nil {
		return errors.New("database.not_initialized")
	}
	for _, indexName := range indexNames {
		indexName = strings.TrimSpace(indexName)
		if indexName == "" {
			continue
		}
		if db.Migrator().HasIndex(model, indexName) {
			continue
		}
		if err := db.Migrator().CreateIndex(model, indexName); err != nil {
			return err
		}
	}
	return nil
}
