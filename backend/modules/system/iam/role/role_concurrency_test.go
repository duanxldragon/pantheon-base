package role

import (
	"errors"
	"fmt"
	"sync"
	"testing"

	"github.com/duanxldragon/pantheon-base/backend/pkg/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestConcurrentCreateRoleMapsLoserToConflict covers the race the role-key
// pre-check cannot close: both callers pass the check and the UNIQUE index
// decides. The loser must receive the 409 the pre-check would have produced,
// not a 500 with the driver's duplicate-entry message.
func TestConcurrentCreateRoleMapsLoserToConflict(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

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
			_, errs[i] = service.CreateRole(&RoleCreateReq{
				RoleName: fmt.Sprintf("Race %d", i),
				RoleKey:  "race-role",
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
		assert.Equal(t, "role.key.exists", common.ErrMessage(err))
	}
	assert.Equal(t, 1, succeeded, "exactly one contender may create the role")

	var rows int64
	require.NoError(t, db.Model(&SystemRole{}).Where("role_key = ?", "race-role").Count(&rows).Error)
	assert.EqualValues(t, 1, rows, "the unique index must leave exactly one role row")
}

// TestConcurrentRenameRoleMapsLoserToConflict exercises the same contract on
// the update path: renaming two roles to one key must yield a conflict, not a
// driver error.
func TestConcurrentRenameRoleMapsLoserToConflict(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

	first, err := service.CreateRole(&RoleCreateReq{RoleName: "First", RoleKey: "first-role", Status: 1})
	require.NoError(t, err)
	second, err := service.CreateRole(&RoleCreateReq{RoleName: "Second", RoleKey: "second-role", Status: 1})
	require.NoError(t, err)

	var (
		wg    sync.WaitGroup
		start = make(chan struct{})
		errs  = make([]error, 2)
	)
	renames := []uint64{first.ID, second.ID}
	for i, roleID := range renames {
		wg.Add(1)
		go func(i int, roleID uint64) {
			defer wg.Done()
			<-start
			_, errs[i] = service.UpdateRole(roleID, &RoleUpdateReq{
				RoleName: fmt.Sprintf("Renamed %d", i),
				RoleKey:  "renamed-role",
				Status:   1,
			})
		}(i, roleID)
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
		assert.Equal(t, "role.key.exists", common.ErrMessage(err))
	}
	assert.Equal(t, 1, succeeded, "exactly one rename may take the key")

	var rows int64
	require.NoError(t, db.Model(&SystemRole{}).Where("role_key = ?", "renamed-role").Count(&rows).Error)
	assert.EqualValues(t, 1, rows, "the unique index must leave exactly one role with the new key")
}
