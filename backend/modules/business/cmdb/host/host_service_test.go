package host

import (
	"testing"

	"pantheon-platform/backend/pkg/testmysql"

	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db := testmysql.Open(t)
	if err := db.AutoMigrate(&Host{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestCreateHost(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)

	resp, err := svc.Create(CreateHostRequest{
		Hostname: "test-host",
		IP:       "192.168.1.1",
		OS:       "linux",
		SSHPort:  22,
	}, "1")
	if err != nil {
		t.Fatalf("create host: %v", err)
	}
	if resp.Hostname != "test-host" {
		t.Errorf("expected hostname test-host, got %s", resp.Hostname)
	}
	if resp.Status != "pending" {
		t.Errorf("expected status pending, got %s", resp.Status)
	}
}

func TestCreateHostDuplicateIP(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)

	svc.Create(CreateHostRequest{Hostname: "h1", IP: "10.0.0.1", OS: "linux"}, "1")
	_, err := svc.Create(CreateHostRequest{Hostname: "h2", IP: "10.0.0.1", OS: "linux"}, "1")
	if err == nil {
		t.Error("expected duplicate IP error")
	}
}

func TestListHosts(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)
	svc.Create(CreateHostRequest{Hostname: "h1", IP: "10.0.0.10", OS: "linux"}, "1")
	svc.Create(CreateHostRequest{Hostname: "h2", IP: "10.0.0.20", OS: "windows"}, "1")

	resp, err := svc.List(HostListQuery{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("list hosts: %v", err)
	}
	if resp.Total < 2 {
		t.Errorf("expected at least 2 hosts, got %d", resp.Total)
	}
}

func TestUpdateHost(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)
	created, _ := svc.Create(CreateHostRequest{Hostname: "h1", IP: "10.0.0.30", OS: "linux"}, "1")

	newHostname := "h1-updated"
	_, err := svc.Update(created.ID, UpdateHostRequest{Hostname: &newHostname}, "1")
	if err != nil {
		t.Fatalf("update host: %v", err)
	}
	resp, _ := svc.GetByID(created.ID)
	if resp.Hostname != "h1-updated" {
		t.Errorf("expected h1-updated, got %s", resp.Hostname)
	}
}

func TestDeleteHost(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)
	created, _ := svc.Create(CreateHostRequest{Hostname: "h1-del", IP: "10.0.0.40", OS: "linux"}, "1")

	if err := svc.Delete(created.ID); err != nil {
		t.Fatalf("delete host: %v", err)
	}
	_, err := svc.GetByID(created.ID)
	if err == nil {
		t.Error("expected not_found error after delete")
	}
}

func TestUpdateStatus(t *testing.T) {
	db := setupTestDB(t)
	svc := NewHostService(db)
	created, _ := svc.Create(CreateHostRequest{Hostname: "h1-status", IP: "10.0.0.50", OS: "linux"}, "1")

	if err := svc.UpdateStatus(created.ID, "online"); err != nil {
		t.Fatalf("update status: %v", err)
	}
	resp, _ := svc.GetByID(created.ID)
	if resp.Status != "online" {
		t.Errorf("expected online, got %s", resp.Status)
	}
}
