package testredis

import (
	"context"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// Address sources, in priority order. PANTHEON_TEST_REDIS_ADDR is the dedicated
// test variable; PANTHEON_REDIS_ADDR is the runtime variable the server itself
// reads and the one most CI jobs and local .env files set. Accepting both means a
// Redis-backed test can no longer silently skip just because the runtime name was
// used (see docs/operations/RUNBOOK.md §Redis-backed tests).
var addressEnvVars = []string{
	"PANTHEON_TEST_REDIS_ADDR",
	"PANTHEON_REDIS_ADDR",
	"REDIS_ADDR",
}

var passwordEnvVars = []string{
	"PANTHEON_TEST_REDIS_PASSWORD",
	"PANTHEON_REDIS_PASSWORD",
	"REDIS_PASSWORD",
}

// requiredEnvVar switches Open from "skip when unconfigured" to "fail". Set it in
// any job that provisions Redis so a typo'd or renamed variable fails the build
// instead of reducing coverage silently.
const requiredEnvVar = "PANTHEON_TEST_REDIS_REQUIRED"

// dbEnvVar selects the Redis logical database for a test process. The default
// (1) is shared by every package, which is fine for tests that only write and
// read within one call, but not for tests asserting that a key survives a
// concurrent `go test ./...` run: another package's cleanup flushes the DB.
const dbEnvVar = "PANTHEON_TEST_REDIS_DB"

func isTruthy(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

func firstEnv(names []string) (string, string) {
	for _, name := range names {
		if value := strings.TrimSpace(os.Getenv(name)); value != "" {
			return value, name
		}
	}
	return "", ""
}

// reporter is the subset of *testing.T that open needs. Taking the narrow
// interface (instead of *testing.T directly) keeps the fail-vs-skip decision
// testable: t.Fatalf/t.Skipf end the calling goroutine, so a test cannot assert
// on a real *testing.T.
type reporter interface {
	Helper()
	Fatalf(format string, args ...any)
	Skipf(format string, args ...any)
	Cleanup(func())
}

// Open creates a Redis client for integration tests.
func Open(t *testing.T) *redis.Client {
	return open(t)
}

func open(t reporter) *redis.Client {
	t.Helper()

	addr, addrVar := firstEnv(addressEnvVars)
	if addr == "" {
		if isTruthy(os.Getenv(requiredEnvVar)) {
			t.Fatalf(
				"redis is required (%s is set) but none of %s is configured; a misconfigured variable would otherwise skip this test silently",
				requiredEnvVar,
				strings.Join(addressEnvVars, ", "),
			)
		} else {
			t.Skipf("redis addr is not configured (%s unset)", strings.Join(addressEnvVars, ", "))
		}
		// Both reporters terminate the test, but return explicitly so the decision
		// stays correct for a reporter that records instead of stopping.
		return nil
	}

	password, _ := firstEnv(passwordEnvVars)

	// DB 1 is the shared default, but `go test ./...` runs packages in
	// parallel and every Open flushes its database on cleanup, so a test that
	// asserts a key survives a call can be wiped by another package mid-run.
	// A test that needs isolation can pick its own database (0-15) through
	// PANTHEON_TEST_REDIS_DB; the env var is per test process, so parallel
	// packages cannot race on it.
	dbIndex := 1
	if raw := strings.TrimSpace(os.Getenv(dbEnvVar)); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 0 || parsed > 15 {
			t.Fatalf("%s must be an integer 0-15, got %q", dbEnvVar, raw)
		}
		dbIndex = parsed
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       dbIndex,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		// A reachable address that refuses the connection is always a failure: the
		// caller configured Redis, so the test must not be skipped.
		t.Fatalf("ping redis at %s (from %s): %v", addr, addrVar, err)
	}

	t.Cleanup(func() {
		// Flush test DB
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = rdb.FlushDB(ctx).Err()
		_ = rdb.Close()
	})

	return rdb
}
