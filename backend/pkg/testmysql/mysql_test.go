package testmysql

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"
	"sync/atomic"
	"testing"
)

func TestBuildTestDBNameSanitizesSegments(t *testing.T) {
	name, err := buildTestDBName(" Main DB ", "suite/Test Case")
	if err != nil {
		t.Fatalf("buildTestDBName() error = %v", err)
	}
	if !strings.HasPrefix(name, "main_db_suite_test_case_") {
		t.Fatalf("buildTestDBName() prefix = %q", name)
	}
	if len(name) > 60 {
		t.Fatalf("buildTestDBName() length = %d, want <= 60", len(name))
	}
}

func TestQuoteMySQLIdentifierRejectsUnsafeNames(t *testing.T) {
	defer func() {
		recovered := recover()
		if recovered == nil {
			t.Fatal("quoteMySQLIdentifier() should panic for unsafe identifiers")
		}
	}()

	quoteMySQLIdentifier("unsafe-name")
}

func TestQuoteMySQLIdentifierWrapsSafeNames(t *testing.T) {
	if got := quoteMySQLIdentifier("safe_name_01"); got != "`safe_name_01`" {
		t.Fatalf("quoteMySQLIdentifier() = %q", got)
	}
}

func TestCreateDatabaseUsesSingleDDLStatement(t *testing.T) {
	db, recorder := openRecordingDB(t)

	if err := createDatabase(db, "safe_name_01"); err != nil {
		t.Fatalf("createDatabase() error = %v", err)
	}

	want := "CREATE DATABASE `safe_name_01` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
	if recorder.query != want {
		t.Fatalf("createDatabase() query = %q, want %q", recorder.query, want)
	}
	if len(recorder.args) != 0 {
		t.Fatalf("createDatabase() args = %v, want no bound args", recorder.args)
	}
}

func TestDropDatabaseUsesSingleDDLStatement(t *testing.T) {
	db, recorder := openRecordingDB(t)

	if err := dropDatabase(db, "safe_name_01"); err != nil {
		t.Fatalf("dropDatabase() error = %v", err)
	}

	want := "DROP DATABASE IF EXISTS `safe_name_01`"
	if recorder.query != want {
		t.Fatalf("dropDatabase() query = %q, want %q", recorder.query, want)
	}
	if len(recorder.args) != 0 {
		t.Fatalf("dropDatabase() args = %v, want no bound args", recorder.args)
	}
}

type execRecorder struct {
	query string
	args  []driver.NamedValue
}

type recordingDriver struct {
	recorder *execRecorder
}

type recordingConn struct {
	recorder *execRecorder
}

var recordingDriverCounter atomic.Uint64

func openRecordingDB(t *testing.T) (*sql.DB, *execRecorder) {
	t.Helper()

	recorder := &execRecorder{}
	driverName := fmt.Sprintf("recording-%d", recordingDriverCounter.Add(1))
	sql.Register(driverName, &recordingDriver{recorder: recorder})

	db, err := sql.Open(driverName, "")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
	})
	return db, recorder
}

func (d *recordingDriver) Open(string) (driver.Conn, error) {
	return &recordingConn{recorder: d.recorder}, nil
}

func (c *recordingConn) Prepare(string) (driver.Stmt, error) {
	return nil, driver.ErrSkip
}

func (c *recordingConn) Close() error {
	return nil
}

func (c *recordingConn) Begin() (driver.Tx, error) {
	return nil, driver.ErrSkip
}

func (c *recordingConn) ExecContext(_ context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	c.recorder.query = query
	c.recorder.args = append([]driver.NamedValue(nil), args...)
	return driver.RowsAffected(0), nil
}
