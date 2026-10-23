package role

import (
	"sync"
	"testing"
	"time"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow covers the
// delete-then-insert residual deterministically.
//
// replaceRolePermissions deletes every grant for a role and re-inserts the
// requested set. Two replacers that interleave (both delete, then both insert)
// leave a merged set or deadlock on the index gap; that interleaving cannot be
// forced through the function itself, because MySQL's own row locks change the
// timing. So the test asserts the mechanism instead: while one replace is in
// flight, the role row is locked, and a second transaction cannot acquire it.
// That lock is what makes the delete-then-insert sequence atomic per role.
func TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

	created, err := service.CreateRole(&RoleCreateReq{
		RoleName: "Concurrent Replace",
		RoleKey:  "concurrent_replace",
		Status:   1,
	})
	require.NoError(t, err)

	var (
		wg             sync.WaitGroup
		releaseFirstCh = make(chan struct{})
		releaseFirst   = sync.OnceFunc(func() { close(releaseFirstCh) })
		firstStarted   = make(chan struct{})
		firstDone      = make(chan error, 1)
		secondDone     = make(chan error, 1)
	)
	t.Cleanup(func() {
		releaseFirst()
		wg.Wait()
	})

	wg.Add(1)
	go func() {
		defer wg.Done()
		firstDone <- db.Transaction(func(tx *gorm.DB) error {
			if err := service.replaceRolePermissions(tx, created.ID, []string{"concurrent:first"}); err != nil {
				return err
			}
			close(firstStarted)
			<-releaseFirstCh
			return nil
		})
	}()
	<-firstStarted

	probeErr := db.Transaction(func(tx *gorm.DB) error {
		var id uint64
		return tx.Table("system_role").
			Select("id").
			Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
			Where("id = ?", created.ID).
			Scan(&id).Error
	})
	var mysqlErr *mysqlDriver.MySQLError
	require.ErrorAs(t, probeErr, &mysqlErr,
		"the role row must stay locked while replaceRolePermissions is in flight")
	require.EqualValues(t, 3572, mysqlErr.Number,
		"expected the NOWAIT lock conflict, got %v", probeErr)

	wg.Add(1)
	go func() {
		defer wg.Done()
		secondDone <- db.Transaction(func(tx *gorm.DB) error {
			return service.replaceRolePermissions(tx, created.ID, []string{"concurrent:second"})
		})
	}()
	select {
	case err := <-secondDone:
		t.Fatalf("second replacer completed while the first still held the role row (err=%v)", err)
	case <-time.After(200 * time.Millisecond):
	}

	releaseFirst()
	require.NoError(t, <-firstDone)
	require.NoError(t, <-secondDone)

	// The last writer wins with its complete set - no merge, no duplicate.
	var stored []string
	require.NoError(t, db.Table("system_role_permission").
		Where("role_id = ?", created.ID).
		Order("permission_key asc").
		Pluck("permission_key", &stored).Error)
	assert.Equal(t, []string{"concurrent:second"}, stored)
}
