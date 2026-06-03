package testmysql

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"os"
	"regexp"
	"strings"
	"testing"
	"time"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func Open(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := strings.TrimSpace(os.Getenv("PANTHEON_TEST_DSN"))
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("PANTHEON_DSN"))
	}
	if dsn == "" {
		t.Skip("mysql test dsn is not configured")
	}

	cfg, err := mysqlDriver.ParseDSN(dsn)
	if err != nil {
		t.Fatalf("parse mysql dsn: %v", err)
	}
	if strings.TrimSpace(cfg.DBName) == "" {
		t.Fatalf("mysql test dsn must include database name")
	}

	adminCfg := *cfg
	adminCfg.DBName = ""
	adminCfg.MultiStatements = true
	adminDB, err := sql.Open("mysql", adminCfg.FormatDSN())
	if err != nil {
		t.Fatalf("open mysql admin connection: %v", err)
	}
	t.Cleanup(func() { _ = adminDB.Close() })

	testDBName, err := buildTestDBName(cfg.DBName, t.Name())
	if err != nil {
		t.Fatalf("build test database name: %v", err)
	}
	if err := createDatabase(adminDB, testDBName); err != nil {
		t.Fatalf("create test database %s: %v", testDBName, err)
	}
	t.Cleanup(func() {
		_ = dropDatabase(adminDB, testDBName)
	})

	testCfg := *cfg
	testCfg.DBName = testDBName
	testCfg.ParseTime = true
	if testCfg.Loc == nil {
		testCfg.Loc = time.Local
	}
	if testCfg.Params == nil {
		testCfg.Params = map[string]string{}
	}
	if _, ok := testCfg.Params["charset"]; !ok {
		testCfg.Params["charset"] = "utf8mb4"
	}

	db, err := gorm.Open(mysql.Open(testCfg.FormatDSN()), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open gorm mysql connection: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve sql db: %v", err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	return db
}

var testDBNameSanitizer = regexp.MustCompile(`[^a-z0-9]+`)
var validMySQLIdentifierPattern = regexp.MustCompile(`^[a-z0-9_]+$`)

func buildTestDBName(base, testName string) (string, error) {
	normalizedBase := normalizeDBNameSegment(base, "pantheon")
	if normalizedBase == "" {
		normalizedBase = "pantheon"
	}
	normalizedName := normalizeDBNameSegment(strings.ReplaceAll(testName, "/", "_"), "test")
	if normalizedName == "" {
		normalizedName = "test"
	}

	suffix, err := randomSuffix()
	if err != nil {
		return "", err
	}
	name := fmt.Sprintf("%s_%s_%s", normalizedBase, normalizedName, suffix)
	if len(name) > 60 {
		name = name[:60]
	}
	name = strings.TrimRight(name, "_")
	if !validMySQLIdentifierPattern.MatchString(name) {
		return "", fmt.Errorf("invalid generated database name %q", name)
	}
	return name, nil
}

func normalizeDBNameSegment(value, fallback string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = testDBNameSanitizer.ReplaceAllString(normalized, "_")
	normalized = strings.Trim(normalized, "_")
	if normalized == "" {
		return fallback
	}
	return normalized
}

func randomSuffix() (string, error) {
	value, err := rand.Int(rand.Reader, big.NewInt(10000))
	if err != nil {
		return "", fmt.Errorf("generate random suffix: %w", err)
	}
	return fmt.Sprintf("%d_%04d", time.Now().UnixNano(), value.Int64()), nil
}

func createDatabase(db *sql.DB, name string) error {
	if err := validateMySQLIdentifier(name); err != nil {
		return err
	}
	_, err := db.Exec("CREATE DATABASE " + quoteMySQLIdentifier(name) + " CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")
	return err
}

func dropDatabase(db *sql.DB, name string) error {
	if err := validateMySQLIdentifier(name); err != nil {
		return err
	}
	_, err := db.Exec("DROP DATABASE IF EXISTS " + quoteMySQLIdentifier(name))
	return err
}

func validateMySQLIdentifier(name string) error {
	normalized := strings.TrimSpace(name)
	if !validMySQLIdentifierPattern.MatchString(normalized) {
		return fmt.Errorf("unsafe mysql identifier %q", name)
	}
	return nil
}

func quoteMySQLIdentifier(name string) string {
	if err := validateMySQLIdentifier(name); err != nil {
		panic(err.Error())
	}
	return "`" + strings.TrimSpace(name) + "`"
}
