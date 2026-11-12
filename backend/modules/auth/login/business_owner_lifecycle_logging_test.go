package login

import (
	"bytes"
	"context"
	"log"
	"testing"

	"github.com/duanxldragon/pantheon-base/backend/pkg/contracts/businessauth"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestBusinessOwnerLifecycleLoggingIsPrivateAndSessionScoped(t *testing.T) {
	for _, tc := range []struct {
		name, missingTable string
		level              logger.LogLevel
	}{
		{"actor_query_error", "system_user", logger.Warn},
		{"tenant_query_error", "tenants", logger.Warn},
		{"successful_info_queries", "", logger.Info},
	} {
		t.Run(tc.name, func(t *testing.T) {
			db, _ := newOwnerLifecycleFixture(t)
			var captured bytes.Buffer
			originalLogger := logger.New(log.New(&captured, "", 0), logger.Config{LogLevel: tc.level})
			db = db.Session(&gorm.Session{Logger: originalLogger})
			runtime := NewRuntime(db, nil)
			reader, ok := NewBusinessAuthorizationReader(runtime, nil, nil).(businessauth.OwnerLifecycleReader)
			if !ok {
				t.Fatal("actual public authorization adapter has no owner lifecycle port")
			}
			if tc.missingTable != "" {
				// Only this test's isolated synthetic schema is renamed.
				if err := db.Exec("RENAME TABLE " + tc.missingTable + " TO fixture_retained_owner_table").Error; err != nil {
					t.Fatal(err)
				}
			}
			captured.Reset()
			facts, err := reader.ReadOwnerLifecycle(context.Background(), 101, 7)
			if tc.missingTable != "" {
				if err != businessauth.ErrOwnerLifecycleUnavailable || facts != (businessauth.OwnerLifecycle{}) {
					t.Fatal("SQL failure must return the fixed error and unknown owner projection")
				}
			} else if err != nil || facts != (businessauth.OwnerLifecycle{TenantExists: true, ActorExists: true}) {
				t.Fatal("metadata logging isolation changed authoritative owner existence")
			}
			if captured.Len() != 0 {
				t.Errorf("private lifecycle query produced %d bytes of SQL/owner diagnostics", captured.Len())
			}
			if db.Logger != originalLogger {
				t.Fatal("owner lifecycle reader replaced the shared auth logger")
			}
			// Normal auth policy reads retain their existing logger. The minimal
			// owner fixture has no settings schema, so real SQL errors are logged.
			captured.Reset()
			_ = runtime.ReloadSettings()
			if captured.Len() == 0 {
				t.Fatal("owner lifecycle logging isolation suppressed normal auth diagnostics")
			}
		})
	}
}
