package common

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
	"pantheon-platform/backend/pkg/common/http"
)

const (
	TokenTypeAccess    = "access"
	TokenTypeRefresh   = "refresh"
	TokenTypeOperation = "operation"

	// DefaultAccessTokenTTL is the default lifetime for access tokens.
	DefaultAccessTokenTTL = 15 * time.Minute
	// DefaultRefreshTokenTTL is the default lifetime for refresh tokens.
	DefaultRefreshTokenTTL = 7 * 24 * time.Hour
)

const (
	tokenSessionPrefix   = "pantheon:session:"
	tokenRefreshPrefix  = "pantheon:refresh:"
	tokenOperationPrefix = "pantheon:op:"
)

var (
	// AccessTokenTTL is the effective TTL for access tokens, overridable via SetTokenTTL.
	AccessTokenTTL = http.AccessTokenTTL
	// RefreshTokenTTL is the effective TTL for refresh tokens, overridable via SetTokenTTL.
	RefreshTokenTTL = http.RefreshTokenTTL

	ErrTokenInvalid = NewUnauthorized("token.invalid")
	ErrTokenExpired = NewUnauthorized("token.expired")
	ErrTokenType    = NewUnauthorized("token.type.invalid")
)

// SetTokenTTL overrides the effective token TTLs. Pass zero to use defaults.
func SetTokenTTL(accessTTL, refreshTTL time.Duration) {
	http.SetTokenTTL(accessTTL, refreshTTL)
	if accessTTL > 0 {
		AccessTokenTTL = accessTTL
	}
	if refreshTTL > 0 {
		RefreshTokenTTL = refreshTTL
	}
}

type TokenPair struct {
	AccessToken      string    `json:"accessToken"`
	RefreshToken     string    `json:"refreshToken"`
	TokenType       string    `json:"tokenType"`
	AccessExpiresAt time.Time `json:"accessExpiresAt"`
	RefreshExpiresAt time.Time `json:"refreshExpiresAt"`
	SessionID       string    `json:"sessionId"`
}

type TokenSessionData struct {
	UserID         uint64   `json:"uid"`
	Username       string   `json:"un"`
	RoleKeys       []string `json:"rk"`
	SessionID      string   `json:"sid"`
	LastIP         string   `json:"ip"`
	UserAgent      string   `json:"ua"`
	LastActivityAt int64    `json:"lat"`
}

type tokenRefreshEntry struct {
	UserID    uint64 `json:"uid"`
	SessionID string `json:"sid"`
}

type OperationTokenData struct {
	UserID    uint64 `json:"uid"`
	SessionID string `json:"sid"`
	Scope     string `json:"scope"`
}

func TokenSessionKey(tok string) string    { return tokenSessionPrefix + tok }
func TokenRefreshKey(tok string) string   { return tokenRefreshPrefix + tok }
func TokenOperationKey(tok string) string { return tokenOperationPrefix + tok }

func NewAccessToken() string   { return randHex(32) }
func NewRefreshToken() string  { return randHex(32) }
func NewOperationToken() string { return randHex(32) }

func randHex(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func TokenStoreSession(ctx context.Context, rdb *redis.Client, tok string, d *TokenSessionData, ttl time.Duration) error {
	b, _ := json.Marshal(d)
	return rdb.Set(ctx, TokenSessionKey(tok), b, ttl).Err()
}

func TokenValidateSession(ctx context.Context, rdb *redis.Client, tok string) (*TokenSessionData, error) {
	b, err := rdb.Get(ctx, TokenSessionKey(tok)).Bytes()
	if err == redis.Nil {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	var d TokenSessionData
	json.Unmarshal(b, &d)
	return &d, nil
}

func TokenDeleteSession(ctx context.Context, rdb *redis.Client, tok string) error {
	return rdb.Del(ctx, TokenSessionKey(tok)).Err()
}

func TokenRefreshSessionActivity(ctx context.Context, rdb *redis.Client, tok string, d *TokenSessionData) error {
	b, _ := json.Marshal(d)
	ttl, err := rdb.TTL(ctx, TokenSessionKey(tok)).Result()
	if err != nil || ttl <= 0 {
		ttl = AccessTokenTTL
	}
	return rdb.Set(ctx, TokenSessionKey(tok), b, ttl).Err()
}

func TokenStoreRefresh(ctx context.Context, rdb *redis.Client, tok string, uid uint64, sid string, ttl time.Duration) error {
	b, _ := json.Marshal(tokenRefreshEntry{UserID: uid, SessionID: sid})
	return rdb.Set(ctx, TokenRefreshKey(tok), b, ttl).Err()
}

func TokenValidateRefresh(ctx context.Context, rdb *redis.Client, tok string) (uint64, string, error) {
	b, err := rdb.Get(ctx, TokenRefreshKey(tok)).Bytes()
	if err == redis.Nil {
		return 0, "", ErrNotFound
	}
	if err != nil {
		return 0, "", err
	}
	var e tokenRefreshEntry
	json.Unmarshal(b, &e)
	return e.UserID, e.SessionID, nil
}

func TokenDeleteRefresh(ctx context.Context, rdb *redis.Client, tok string) error {
	return rdb.Del(ctx, TokenRefreshKey(tok)).Err()
}

func TokenDeleteSessionPair(ctx context.Context, rdb *redis.Client, accessToken, refreshToken string) error {
	if rdb == nil {
		return nil
	}
	pipe := rdb.Pipeline()
	pipe.Del(ctx, TokenSessionKey(accessToken))
	pipe.Del(ctx, TokenRefreshKey(refreshToken))
	_, err := pipe.Exec(ctx)
	return err
}

func TokenStoreOperation(ctx context.Context, rdb *redis.Client, tok string, data *OperationTokenData, ttl time.Duration) error {
	b, _ := json.Marshal(data)
	return rdb.Set(ctx, TokenOperationKey(tok), b, ttl).Err()
}

func TokenValidateOperation(ctx context.Context, rdb *redis.Client, tok string) (*OperationTokenData, error) {
	b, err := rdb.Get(ctx, TokenOperationKey(tok)).Bytes()
	if err == redis.Nil {
		return nil, errors.New("operation token not found or expired")
	}
	if err != nil {
		return nil, err
	}
	var d OperationTokenData
	json.Unmarshal(b, &d)
	return &d, nil
}

func TokenDeleteOperation(ctx context.Context, rdb *redis.Client, tok string) error {
	return rdb.Del(ctx, TokenOperationKey(tok)).Err()
}

// GenerateOperationToken creates a Redis-based operation token.
// Deprecated: Use AuthService.VerifyPasswordForOperationToken instead.
func GenerateOperationToken(userID uint64, sessionID string, operationScope string, ttl time.Duration, rdb *redis.Client) (string, error) {
	opToken := NewOperationToken()
	data := &OperationTokenData{
		UserID:    userID,
		SessionID: sessionID,
		Scope:     operationScope,
	}
	ctx := context.Background()
	if err := TokenStoreOperation(ctx, rdb, opToken, data, ttl); err != nil {
		return "", err
	}
	return opToken, nil
}

// ParseOperationToken validates a Redis-based operation token.
func ParseOperationToken(tokenString string, rdb *redis.Client) (*OperationTokenData, error) {
	if rdb == nil {
		return nil, ErrDatabaseNotInitialized
	}
	return TokenValidateOperation(context.Background(), rdb, tokenString)
}
