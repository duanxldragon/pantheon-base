package authtoken

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"pantheon-platform/backend/pkg/testredis"
)

func TestValidateSessionRejectsInvalidJSON(t *testing.T) {
	rdb := testredis.Open(t)
	ctx := context.Background()
	token := "bad-session-token"
	if err := rdb.Set(ctx, SessionKey(token), []byte("{"), time.Minute).Err(); err != nil {
		t.Fatalf("seed invalid session token: %v", err)
	}

	_, err := ValidateSession(ctx, rdb, token)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("expected ErrInvalid, got %v", err)
	}
}

func TestValidateRefreshRejectsInvalidJSON(t *testing.T) {
	rdb := testredis.Open(t)
	ctx := context.Background()
	token := "bad-refresh-token"
	if err := rdb.Set(ctx, RefreshKey(token), []byte("{"), time.Minute).Err(); err != nil {
		t.Fatalf("seed invalid refresh token: %v", err)
	}

	_, _, err := ValidateRefresh(ctx, rdb, token)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("expected ErrInvalid, got %v", err)
	}
}

func TestValidateOperationRejectsInvalidJSON(t *testing.T) {
	rdb := testredis.Open(t)
	ctx := context.Background()
	token := "bad-operation-token"
	if err := rdb.Set(ctx, OperationKey(token), []byte("{"), time.Minute).Err(); err != nil {
		t.Fatalf("seed invalid operation token: %v", err)
	}

	_, err := ValidateOperation(ctx, rdb, token)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("expected ErrInvalid, got %v", err)
	}
}

func TestDeleteSessionPairAllowsNilRedis(t *testing.T) {
	if err := DeleteSessionPair(context.Background(), (*redis.Client)(nil), "access", "refresh"); err != nil {
		t.Fatalf("expected nil redis delete to be ignored, got %v", err)
	}
}
