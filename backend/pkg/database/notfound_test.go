package database

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestNotFoundIfMissingTranslatesRecordNotFound(t *testing.T) {
	got := NotFoundIfMissing(gorm.ErrRecordNotFound, "user.not_found")
	require.EqualError(t, got, "user.not_found")
}

func TestNotFoundIfMissingTranslatesWrappedRecordNotFound(t *testing.T) {
	wrapped := fmt.Errorf("query users: %w", gorm.ErrRecordNotFound)
	got := NotFoundIfMissing(wrapped, "tenant.not_found")
	require.EqualError(t, got, "tenant.not_found")
}

func TestNotFoundIfMissingPassesOtherErrorsThroughUnchanged(t *testing.T) {
	other := errors.New("connection refused")
	require.Same(t, other, NotFoundIfMissing(other, "user.not_found"))

	plainNotFound := errors.New("user not found")
	require.Same(t, plainNotFound, NotFoundIfMissing(plainNotFound, "user.not_found"))
}

func TestNotFoundIfMissingNilStaysNil(t *testing.T) {
	require.NoError(t, NotFoundIfMissing(nil, "user.not_found"))
}
