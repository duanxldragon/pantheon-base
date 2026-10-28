package database

import (
	"errors"

	"gorm.io/gorm"
)

// NotFoundIfMissing translates gorm.ErrRecordNotFound into the caller's i18n
// message key and passes every other error through unchanged. It lives in
// pkg/database rather than pkg/common because pkg/common is gorm-free and
// stays that way; the service layer that already imports gorm takes the
// dependency here.
func NotFoundIfMissing(err error, key string) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return errors.New(key)
	}
	return err
}
