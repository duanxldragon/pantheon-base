package host

import (
	"testing"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/testmysql"
)

func TestCmdbHostServiceListAppliesDeptAndChildrenDataScope(t *testing.T) {
	db := testmysql.Open(t)
	service := NewCmdbHostService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate cmdb host: %v", err)
	}
	hosts := []CmdbHost{
		{ID: 1, HostCode: "host-1", Hostname: "host-1", DisplayName: "Host 1", IpAddress: "10.0.0.1", SshPort: 22, OsFamily: "linux", OsName: "ubuntu", KernelVersion: "6.0", Arch: "x86_64", Environment: "prod", Status: "online", LifecycleStatus: "active", Provider: "idc", RegionCode: "cn", IdcCode: "idc-a", ClusterName: "cluster-a", OwnerUserId: 1, OwnerName: "owner", MaintainerTeam: "ops", Purpose: "app", Remark: "", DeptID: 10},
		{ID: 2, HostCode: "host-2", Hostname: "host-2", DisplayName: "Host 2", IpAddress: "10.0.0.2", SshPort: 22, OsFamily: "linux", OsName: "ubuntu", KernelVersion: "6.0", Arch: "x86_64", Environment: "prod", Status: "online", LifecycleStatus: "active", Provider: "idc", RegionCode: "cn", IdcCode: "idc-a", ClusterName: "cluster-a", OwnerUserId: 1, OwnerName: "owner", MaintainerTeam: "ops", Purpose: "app", Remark: "", DeptID: 11},
		{ID: 3, HostCode: "host-3", Hostname: "host-3", DisplayName: "Host 3", IpAddress: "10.0.0.3", SshPort: 22, OsFamily: "linux", OsName: "ubuntu", KernelVersion: "6.0", Arch: "x86_64", Environment: "prod", Status: "online", LifecycleStatus: "active", Provider: "idc", RegionCode: "cn", IdcCode: "idc-b", ClusterName: "cluster-b", OwnerUserId: 2, OwnerName: "other", MaintainerTeam: "ops", Purpose: "db", Remark: "", DeptID: 20},
	}
	if err := db.Create(&hosts).Error; err != nil {
		t.Fatalf("seed hosts: %v", err)
	}

	page, err := service.ListCmdbHosts(&CmdbHostListQuery{Page: 1, PageSize: 10}, &common.DataScopeReq{
		Mode:    common.DataScopeModeDeptAndChildren,
		DeptID:  10,
		DeptIDs: []uint64{10, 11},
	})
	if err != nil {
		t.Fatalf("list hosts: %v", err)
	}
	if page.Total != 2 || len(page.Items) != 2 {
		t.Fatalf("expected two scoped hosts, got total=%d items=%+v", page.Total, page.Items)
	}
	for _, item := range page.Items {
		if item.HostCode == "host-3" {
			t.Fatalf("expected host-3 to be filtered out, got %+v", page.Items)
		}
	}
}
