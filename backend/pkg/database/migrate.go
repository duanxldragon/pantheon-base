package database

import (
	"embed"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// RunMigrations executes all pending database migrations.
// It uses the golang-migrate library with embedded SQL files.
// Returns nil if all migrations applied successfully, or an error on failure.
func RunMigrations(dsn string) error {
	d, err := iofs.New(migrationFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	migrateDSN, err := buildMigrateDSN(dsn)
	if err != nil {
		return fmt.Errorf("failed to build migration DSN: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, migrateDSN)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	if err == migrate.ErrNoChange {
		slog.Info("database migrations: no new migrations to apply")
	} else {
		slog.Info("database migrations: all migrations applied successfully")
	}

	return nil
}

// RunAutoMigrate runs GORM AutoMigrate for all registered models.
// This is the legacy migration path, used when PANTHEON_AUTO_MIGRATE=true.
func RunAutoMigrate(db *gorm.DB, models ...interface{}) error {
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("auto-migrate failed: %w", err)
	}
	slog.Info("auto-migrate completed successfully")
	return nil
}

// ShouldAutoMigrate returns true if the PANTHEON_AUTO_MIGRATE env var is set to "true".
// When true, the application uses GORM AutoMigrate instead of versioned migrations.
func ShouldAutoMigrate() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv("PANTHEON_AUTO_MIGRATE")), "true")
}

// buildMigrateDSN converts a go-sql-driver/mysql DSN string into the URL format
// expected by golang-migrate's mysql driver.
// golang-migrate expects: mysql://user:password@tcp(host:port)/dbname?params
func buildMigrateDSN(dsn string) (string, error) {
	cfg, err := mysqlDriver.ParseDSN(dsn)
	if err != nil {
		return "", fmt.Errorf("invalid mysql dsn: %w", err)
	}

	passwordPart := ""
	if cfg.Passwd != "" {
		passwordPart = ":" + cfg.Passwd
	}

	params := ""
	if len(cfg.Params) > 0 {
		parts := make([]string, 0, len(cfg.Params))
		for k, v := range cfg.Params {
			parts = append(parts, fmt.Sprintf("%s=%s", k, v))
		}
		params = "?" + strings.Join(parts, "&")
	}

	migrateDSN := fmt.Sprintf("mysql://%s%s@tcp(%s)/%s%s",
		cfg.User,
		passwordPart,
		cfg.Addr,
		cfg.DBName,
		params,
	)

	return migrateDSN, nil
}
