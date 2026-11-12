package authtoken

import (
	"context"
	"errors"
	"reflect"
	"strconv"
	"testing"
	"time"

	"github.com/duanxldragon/pantheon-base/backend/pkg/testredis"
	"github.com/redis/go-redis/v9"
)

func activitySession() *SessionData {
	return &SessionData{UserID: 42, Username: "activity", SessionID: "activity-session",
		TenantID: 7, RoleKeys: []string{"reader", "auditor"}, LastIP: "127.0.0.1",
		UserAgent: "activity-test", LastActivityAt: time.Now().Add(-2 * time.Minute).Unix()}
}

func TestRefreshSessionActivityRejectsMissingAfterRead(t *testing.T) {
	for _, mode := range []string{"deleted", "expired"} {
		t.Run(mode, func(t *testing.T) {
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			if err := StoreSession(ctx, rdb, token, activitySession(), time.Minute); err != nil {
				t.Fatal(err)
			}
			stale, err := ValidateSession(ctx, rdb, token)
			if err != nil {
				t.Fatal(err)
			}
			if mode == "deleted" {
				err = DeleteSession(ctx, rdb, token)
			} else {
				// Expire using Redis' own clock, without a timing-sensitive sleep.
				err = rdb.PExpireAt(ctx, SessionKey(token), time.Unix(1, 0)).Err()
			}
			if err != nil {
				t.Fatal(err)
			}
			stale.LastActivityAt = time.Now().Unix()
			if err := RefreshSessionActivity(ctx, rdb, token, stale); !errors.Is(err, ErrNotFound) {
				t.Errorf("expected ErrNotFound, got %v", err)
			}
			if _, err := ValidateSession(ctx, rdb, token); !errors.Is(err, ErrNotFound) {
				t.Error("independent validation accepted a resurrected session")
			}
			if n, err := rdb.Exists(ctx, SessionKey(token)).Result(); err != nil || n != 0 {
				t.Error("missing key was recreated")
			}
		})
	}
}

func TestRefreshSessionActivityRejectsPersistentOrInvalidPayload(t *testing.T) {
	for _, mode := range []string{"persistent", "malformed", "null"} {
		t.Run(mode, func(t *testing.T) {
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			if err := StoreSession(ctx, rdb, token, activitySession(), time.Minute); err != nil {
				t.Fatal(err)
			}
			switch mode {
			case "persistent":
				if err := rdb.Persist(ctx, SessionKey(token)).Err(); err != nil {
					t.Fatal(err)
				}
			case "malformed", "null":
				payload := "{"
				if mode == "null" {
					payload = "null"
				}
				if err := rdb.Set(ctx, SessionKey(token), payload, time.Minute).Err(); err != nil {
					t.Fatal(err)
				}
			}
			before, err := rdb.Get(ctx, SessionKey(token)).Result()
			if err != nil {
				t.Fatal(err)
			}
			deadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil {
				t.Fatal(err)
			}
			if err := RefreshSessionActivity(ctx, rdb, token, activitySession()); !errors.Is(err, ErrInvalid) {
				t.Errorf("expected ErrInvalid, got %v", err)
			}
			after, err := rdb.Get(ctx, SessionKey(token)).Result()
			if err != nil || before != after {
				t.Error("rejected refresh changed the stored payload")
			}
			afterDeadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil || deadline != afterDeadline {
				t.Error("rejected refresh changed the expiration")
			}
		})
	}
}

func TestRefreshSessionActivityRejectsDifferentIdentity(t *testing.T) {
	changes := []struct {
		name string
		edit func(*SessionData)
	}{
		{"user", func(d *SessionData) { d.UserID++ }},
		{"large-user", func(d *SessionData) { d.UserID = 1<<53 + 1 }},
		{"session", func(d *SessionData) { d.SessionID = "replacement-session" }},
		{"username", func(d *SessionData) { d.Username = "replacement-user" }},
		{"tenant", func(d *SessionData) { d.TenantID++ }},
		{"large-tenant", func(d *SessionData) { d.TenantID = 1<<53 + 1 }},
		{"roles", func(d *SessionData) { d.RoleKeys = []string{"admin"} }},
		{"role-order", func(d *SessionData) { d.RoleKeys = []string{"auditor", "reader"} }},
	}
	for _, change := range changes {
		t.Run(change.name, func(t *testing.T) {
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			stale := activitySession()
			if change.name == "large-user" {
				stale.UserID = 1 << 53
			}
			if change.name == "large-tenant" {
				stale.TenantID = 1 << 53
			}
			if err := StoreSession(ctx, rdb, token, stale, time.Minute); err != nil {
				t.Fatal(err)
			}
			stale, err := ValidateSession(ctx, rdb, token)
			if err != nil {
				t.Fatal(err)
			}
			replacement := *stale
			change.edit(&replacement)
			if err := StoreSession(ctx, rdb, token, &replacement, time.Minute); err != nil {
				t.Fatal(err)
			}
			stale.LastActivityAt = time.Now().Unix()
			if err := RefreshSessionActivity(ctx, rdb, token, stale); !errors.Is(err, ErrInvalid) {
				t.Errorf("expected ErrInvalid, got %v", err)
			}
			current, err := ValidateSession(ctx, rdb, token)
			if err != nil || !reflect.DeepEqual(current, &replacement) {
				t.Error("stale refresh overwrote the replacement identity")
			}
		})
	}
}

func TestRefreshSessionActivityPreservesMillisecondExpiration(t *testing.T) {
	for _, tenantID := range []uint64{0, 7, 1<<53 + 1} {
		t.Run(strconv.FormatUint(tenantID, 10), func(t *testing.T) {
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			data := activitySession()
			data.TenantID = tenantID
			if err := StoreSession(ctx, rdb, token, data, 1750*time.Millisecond); err != nil {
				t.Fatal(err)
			}
			deadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil {
				t.Fatal(err)
			}
			before, err := rdb.PTTL(ctx, SessionKey(token)).Result()
			if err != nil || before <= 0 {
				t.Fatal("expected positive millisecond TTL")
			}
			data.LastActivityAt = time.Now().Unix()
			if err := RefreshSessionActivity(ctx, rdb, token, data); err != nil {
				t.Fatal(err)
			}
			afterDeadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil || afterDeadline != deadline {
				t.Error("refresh changed the exact millisecond expiration")
			}
			after, err := rdb.PTTL(ctx, SessionKey(token)).Result()
			if err != nil || after <= 0 || after > before {
				t.Error("refresh extended or lost the remaining TTL")
			}
			current, err := ValidateSession(ctx, rdb, token)
			if err != nil || !reflect.DeepEqual(current, data) {
				t.Error("independent validation did not see the updated same-session payload")
			}
		})
	}
}

func TestRefreshSessionActivityRejectsNilAndStoreErrors(t *testing.T) {
	for _, mode := range []string{"nil-store", "nil-data", "nil-context", "canceled", "closed-store", "wrong-type"} {
		t.Run(mode, func(t *testing.T) {
			defer func() {
				if recover() != nil {
					t.Error("refresh panicked instead of returning an explicit error")
				}
			}()
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			data := activitySession()
			if err := StoreSession(ctx, rdb, token, data, time.Minute); err != nil {
				t.Fatal(err)
			}
			client, callCtx, proposed := rdb, ctx, data
			want := ErrInvalid
			switch mode {
			case "nil-store":
				client, want = nil, ErrStoreNotInitialized
			case "nil-data":
				proposed = nil
			case "nil-context":
				callCtx = nil
			case "canceled":
				var cancel context.CancelFunc
				callCtx, cancel = context.WithCancel(ctx)
				cancel()
				want = context.Canceled
			case "closed-store":
				client = redis.NewClient(rdb.Options())
				if err := client.Close(); err != nil {
					t.Fatal(err)
				}
				want = redis.ErrClosed
			case "wrong-type":
				if err := rdb.Del(ctx, SessionKey(token)).Err(); err != nil {
					t.Fatal(err)
				}
				if err := rdb.LPush(ctx, SessionKey(token), "test").Err(); err != nil {
					t.Fatal(err)
				}
				want = nil // Redis WRONGTYPE must propagate, never become success.
			}
			before, err := rdb.Dump(ctx, SessionKey(token)).Result()
			if err != nil {
				t.Fatal(err)
			}
			deadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil {
				t.Fatal(err)
			}
			err = RefreshSessionActivity(callCtx, client, token, proposed)
			if err == nil || (want != nil && !errors.Is(err, want)) {
				t.Errorf("expected explicit rejection, got %v", err)
			}
			after, err := rdb.Dump(ctx, SessionKey(token)).Result()
			if err != nil || after != before {
				t.Error("rejected refresh changed the stored value")
			}
			afterDeadline, err := rdb.Do(ctx, "PEXPIRETIME", SessionKey(token)).Int64()
			if err != nil || afterDeadline != deadline {
				t.Error("rejected refresh changed the expiration")
			}
		})
	}
}

// Run the mutation after the writer's GET has returned its original bytes but
// before its next Redis command, exercising the atomic comparison boundary.
type activityReadHook struct {
	afterRead func()
}

func (h *activityReadHook) DialHook(next redis.DialHook) redis.DialHook { return next }
func (h *activityReadHook) ProcessPipelineHook(next redis.ProcessPipelineHook) redis.ProcessPipelineHook {
	return next
}
func (h *activityReadHook) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, cmd redis.Cmder) error {
		err := next(ctx, cmd)
		if err == nil && cmd.Name() == "get" && h.afterRead != nil {
			action := h.afterRead
			h.afterRead = nil
			action()
		}
		return err
	}
}

var _ redis.Hook = (*activityReadHook)(nil)

func TestRefreshSessionActivityAtomicReadWriteInterleaving(t *testing.T) {
	for _, mode := range []string{"deleted", "expired", "persistent", "replaced", "canceled", "store-error"} {
		t.Run(mode, func(t *testing.T) {
			rdb := testredis.OpenDB(t, testredis.DBAuthToken)
			ctx := context.Background()
			token := NewAccessToken()
			stale := activitySession()
			if err := StoreSession(ctx, rdb, token, stale, time.Minute); err != nil {
				t.Fatal(err)
			}
			writer := redis.NewClient(rdb.Options())
			t.Cleanup(func() { _ = writer.Close() })
			callCtx, cancel := context.WithCancel(ctx)
			defer cancel()
			replacement := *stale
			replacement.SessionID = "replacement-session"
			fired := false
			writer.AddHook(&activityReadHook{afterRead: func() {
				fired = true
				var err error
				switch mode {
				case "deleted":
					err = DeleteSession(ctx, rdb, token)
				case "expired":
					err = rdb.PExpireAt(ctx, SessionKey(token), time.Unix(1, 0)).Err()
				case "persistent":
					err = rdb.Persist(ctx, SessionKey(token)).Err()
				case "replaced":
					err = StoreSession(ctx, rdb, token, &replacement, time.Minute)
				case "canceled":
					cancel()
				case "store-error":
					err = writer.Close()
				}
				if err != nil {
					t.Fatal(err)
				}
			}})
			stale.LastActivityAt = time.Now().Unix()
			want := ErrInvalid
			switch mode {
			case "deleted", "expired":
				want = ErrNotFound
			case "canceled":
				want = context.Canceled
			case "store-error":
				want = redis.ErrClosed
			}
			if err := RefreshSessionActivity(callCtx, writer, token, stale); !errors.Is(err, want) {
				t.Errorf("expected atomic rejection, got %v", err)
			}
			if !fired {
				t.Fatal("writer did not exercise the read/write interleaving")
			}
			current, err := ValidateSession(ctx, rdb, token)
			switch mode {
			case "deleted", "expired":
				if !errors.Is(err, ErrNotFound) {
					t.Error("atomic refresh recreated a missing session")
				}
			case "replaced":
				if err != nil || !reflect.DeepEqual(current, &replacement) {
					t.Error("atomic refresh overwrote a concurrent replacement")
				}
			case "persistent", "canceled", "store-error":
				if err != nil || current.LastActivityAt == stale.LastActivityAt {
					t.Error("rejected atomic refresh updated the session")
				}
			}
		})
	}
}
