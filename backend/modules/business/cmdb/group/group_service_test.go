package group

import (
	"testing"

	"pantheon-platform/backend/pkg/testmysql"

	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db := testmysql.Open(t)
	if err := db.AutoMigrate(&Group{}); err != nil {
		t.Fatalf("migrate group: %v", err)
	}
	return db
}

func seedTestHost(t *testing.T, db *gorm.DB, ip string, labelsJSON string) {
	t.Helper()
	db.Exec("INSERT INTO biz_cmdb_host (hostname, ip, os, label_values, status, created_at, updated_at) VALUES (?, ?, 'linux', ?, 'online', NOW(), NOW())", "host-"+ip, ip, labelsJSON)
}

func TestCreateGroup(t *testing.T) {
	db := setupTestDB(t)
	svc := NewGroupService(db)

	cond := ConditionExpression{
		Operator: "AND",
		Rules:    []ConditionRule{{Key: "env", Op: "eq", Val: "production"}},
	}
	resp, err := svc.Create(CreateGroupRequest{Name: "production", Conditions: cond})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	if resp.Name != "production" {
		t.Errorf("expected production, got %s", resp.Name)
	}
}

func TestGroupMembersFiltering(t *testing.T) {
	db := setupTestDB(t)
	svc := NewGroupService(db)

	seedTestHost(t, db, "10.0.0.1", `[{"key":"env","val":"production"},{"key":"biz","val":"order"}]`)
	seedTestHost(t, db, "10.0.0.2", `[{"key":"env","val":"test"},{"key":"biz","val":"order"}]`)
	seedTestHost(t, db, "10.0.0.3", `[{"key":"env","val":"production"},{"key":"biz","val":"user"}]`)

	cond := ConditionExpression{
		Operator: "AND",
		Rules:    []ConditionRule{{Key: "env", Op: "eq", Val: "production"}},
	}
	created, _ := svc.Create(CreateGroupRequest{Name: "prod", Conditions: cond})

	members, group, err := svc.GetMembers(created.ID)
	if err != nil {
		t.Fatalf("get members: %v", err)
	}
	if group.Name != "prod" {
		t.Errorf("expected prod, got %s", group.Name)
	}
	if len(members) != 2 {
		t.Errorf("expected 2 members, got %d", len(members))
	}
}

func TestUpdateGroup(t *testing.T) {
	db := setupTestDB(t)
	svc := NewGroupService(db)
	cond := ConditionExpression{Operator: "AND", Rules: []ConditionRule{}}
	created, _ := svc.Create(CreateGroupRequest{Name: "old", Conditions: cond})

	newName := "new-name"
	_, err := svc.Update(created.ID, UpdateGroupRequest{Name: &newName})
	if err != nil {
		t.Fatalf("update group: %v", err)
	}
	resp, _ := svc.GetByID(created.ID)
	if resp.Name != "new-name" {
		t.Errorf("expected new-name, got %s", resp.Name)
	}
}

func TestDeleteGroup(t *testing.T) {
	db := setupTestDB(t)
	svc := NewGroupService(db)
	cond := ConditionExpression{Operator: "AND", Rules: []ConditionRule{}}
	created, _ := svc.Create(CreateGroupRequest{Name: "tmp", Conditions: cond})

	if err := svc.Delete(created.ID); err != nil {
		t.Fatalf("delete group: %v", err)
	}
	_, err := svc.GetByID(created.ID)
	if err == nil {
		t.Error("expected not_found error after delete")
	}
}
