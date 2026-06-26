package database

import (
	"context"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"pantheon-platform/backend/pkg/metrics"
)

// RDB is the global Redis client instance.
var RDB *redis.Client

// InitRedis initializes the Redis connection.
// This is an optional dependency; connection failure will not block server startup.
func InitRedis(addr string, password string, db int) {
	RDB = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password, // empty if no password
		DB:       db,       // default to DB 0
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := RDB.Ping(ctx).Result()
	if err != nil {
		slog.Warn("failed to connect redis (token blacklist will be disabled)", "error", err)
		RDB = nil
		return
	}

	// Start background goroutine to collect Redis connection pool metrics
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			stats := RDB.PoolStats()
			metrics.RedisConnectionsActive.Set(float64(stats.TotalConns - stats.IdleConns))
			metrics.RedisConnectionsIdle.Set(float64(stats.IdleConns))
		}
	}()

	slog.Info("Redis connection successful")
}

// SetEx sets a cache entry with expiration time.
// Useful for caching across the platform.
func SetEx(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return RDB.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a cache entry by key.
func Get(ctx context.Context, key string) (string, error) {
	return RDB.Get(ctx, key).Result()
}
