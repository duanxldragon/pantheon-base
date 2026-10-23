package user

import (
	"errors"
	"fmt"
	"sync"
	"testing"

	"github.com/duanxldragon/pantheon-base/backend/pkg/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestConcurrentCreateUserMapsLoserToConflict covers the race the username
// pre-check cannot close: both callers see no row and only the UNIQUE index
// decides. The loser must receive the same 409 the pre-check would have
// produced, not a 500 carrying the MySQL duplicate-entry message.
func TestConcurrentCreateUserMapsLoserToConflict(t *testing.T) {
	db := setupUserTestDB(t)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	// setupUserTestDB pins one connection for deterministic fixtures; the race
	// needs two transactions in flight at the same time.
	sqlDB.SetMaxOpenConns(4)

	service := NewUserService(db)
	const contenders = 4
	var (
		wg    sync.WaitGroup
		start = make(chan struct{})
		errs  = make([]error, contenders)
	)
	for i := 0; i < contenders; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			_, errs[i] = service.CreateUser(&UserCreateReq{
				Username: "race-user",
				Password: "password123",
				Nickname: fmt.Sprintf("Race %d", i),
				Status:   1,
			})
		}(i)
	}
	close(start)
	wg.Wait()

	succeeded := 0
	for i, err := range errs {
		if err == nil {
			succeeded++
			continue
		}
		require.Truef(t, errors.Is(err, common.ErrConflict),
			"contender %d must fail as a conflict, got %v", i, err)
		assert.Equal(t, "user.create.error.username_exists", common.ErrMessage(err))
	}
	assert.Equal(t, 1, succeeded, "exactly one contender may create the user")

	var rows int64
	require.NoError(t, db.Model(&SystemUser{}).Where("username = ?", "race-user").Count(&rows).Error)
	assert.EqualValues(t, 1, rows, "the unique index must leave exactly one user row")
}
