package tenant

import (
	"strings"
	"testing"
)

// TestScoperScopeSemantics pins the read-filter SQL the shared Scoper renders
// for the three contexts the services must keep apart: nil (platform-internal,
// no predicate), compat (hard pin tenant_id = 0) and multi (hard pin the
// claim). This is the before-snapshot for the s3 tenant-scope unification: a
// converted service that lost its predicate or converged compat into nil
// changes these statements.
func TestScoperScopeSemantics(t *testing.T) {
	db := newOfflineDryRunDB(t)

	multiCtx := &Context{TenantID: 101, Mode: ModeMulti}
	compatCtx := &Context{TenantID: PlatformGlobalTenantID, Mode: ModeCompat}

	cases := []struct {
		name       string
		ctx        *Context
		wantClause bool
		wantArg    uint64
	}{
		{name: "nil context stays unfiltered", ctx: nil, wantClause: false},
		{name: "compat pins tenant_id = 0", ctx: compatCtx, wantClause: true, wantArg: 0},
		{name: "multi pins the claimed tenant", ctx: multiCtx, wantClause: true, wantArg: 101},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			scoper := Scoper{TenantCtx: tc.ctx}
			var rows []scopeSQLRow
			stmt := scoper.Scoped(db.Model(&scopeSQLRow{})).Find(&rows).Statement
			sql := stmt.SQL.String()
			if !tc.wantClause {
				if strings.Contains(sql, "tenant_id") {
					t.Fatalf("nil context must not filter, got SQL %q", sql)
				}
				return
			}
			if !strings.Contains(sql, "tenant_id = ?") {
				t.Fatalf("expected a tenant_id = ? predicate in SQL %q", sql)
			}
			found := false
			for _, v := range stmt.Vars {
				if arg, ok := v.(uint64); ok && arg == tc.wantArg {
					found = true
				}
			}
			if !found {
				t.Fatalf("vars %v do not carry tenant pin %d", stmt.Vars, tc.wantArg)
			}
		})
	}
}

// TestScoperOwnerTenantID pins the write-owner rule (contract §3.3: ownership
// comes from the context, never from the request body) for the same three
// contexts, in both the method and the function form.
func TestScoperOwnerTenantID(t *testing.T) {
	multiCtx := &Context{TenantID: 202, Mode: ModeMulti}
	compatCtx := &Context{TenantID: PlatformGlobalTenantID, Mode: ModeCompat}

	cases := []struct {
		name string
		ctx  *Context
		want uint64
	}{
		{name: "nil context is platform-internal", ctx: nil, want: 0},
		{name: "compat owns the platform-global population", ctx: compatCtx, want: 0},
		{name: "multi owns the claimed tenant", ctx: multiCtx, want: 202},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := (Scoper{TenantCtx: tc.ctx}).TenantOwnerID(); got != tc.want {
				t.Fatalf("Scoper.TenantOwnerID() = %d, want %d", got, tc.want)
			}
			if got := OwnerTenantID(tc.ctx); got != tc.want {
				t.Fatalf("OwnerTenantID() = %d, want %d", got, tc.want)
			}
		})
	}
}
