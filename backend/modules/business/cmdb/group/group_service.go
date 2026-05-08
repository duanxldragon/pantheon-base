package group

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type GroupService struct {
	db *gorm.DB
}

func NewGroupService(db *gorm.DB) *GroupService {
	return &GroupService{db: db}
}

func (s *GroupService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.AutoMigrate(&Group{})
}

func (s *GroupService) List(dataScope *common.DataScopeReq) ([]GroupResponse, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var groups []Group
	if err := s.db.Order("id DESC").Find(&groups).Error; err != nil {
		return nil, err
	}
	hosts, err := s.scopedHosts(dataScope)
	if err != nil {
		return nil, err
	}
	items := make([]GroupResponse, len(groups))
	for i, g := range groups {
		items[i] = s.toResponse(&g, hosts)
	}
	return items, nil
}

func (s *GroupService) GetByID(id uint64, dataScope *common.DataScopeReq) (*GroupResponse, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var group Group
	if err := s.db.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cmdbgroup.not_found")
		}
		return nil, err
	}
	hosts, err := s.scopedHosts(dataScope)
	if err != nil {
		return nil, err
	}
	resp := s.toResponse(&group, hosts)
	return &resp, nil
}

func (s *GroupService) Create(req CreateGroupRequest, dataScope *common.DataScopeReq) (*GroupResponse, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := validateConditions(req.Conditions); err != nil {
		return nil, err
	}
	condJSON, _ := json.Marshal(req.Conditions)
	group := Group{
		Name:        req.Name,
		Conditions:  datatypes.JSON(condJSON),
		Description: req.Description,
	}
	if err := s.db.Create(&group).Error; err != nil {
		return nil, err
	}
	hosts, err := s.scopedHosts(dataScope)
	if err != nil {
		return nil, err
	}
	resp := s.toResponse(&group, hosts)
	return &resp, nil
}

func (s *GroupService) Update(id uint64, req UpdateGroupRequest, dataScope *common.DataScopeReq) (*GroupResponse, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var group Group
	if err := s.db.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cmdbgroup.not_found")
		}
		return nil, err
	}
	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Conditions != nil {
		if err := validateConditions(*req.Conditions); err != nil {
			return nil, err
		}
		condJSON, _ := json.Marshal(*req.Conditions)
		updates["conditions"] = datatypes.JSON(condJSON)
	}
	updates["updated_at"] = time.Now()
	if err := s.db.Model(&group).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := s.db.First(&group, id).Error; err != nil {
		return nil, err
	}
	hosts, err := s.scopedHosts(dataScope)
	if err != nil {
		return nil, err
	}
	resp := s.toResponse(&group, hosts)
	return &resp, nil
}

func (s *GroupService) Delete(id uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	result := s.db.Delete(&Group{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("cmdbgroup.not_found")
	}
	return nil
}

func (s *GroupService) GetMembers(id uint64, dataScope *common.DataScopeReq) ([]Host, *Group, error) {
	if s.db == nil {
		return nil, nil, errors.New("database.not_initialized")
	}
	var group Group
	if err := s.db.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("cmdbgroup.not_found")
		}
		return nil, nil, err
	}
	hosts, err := s.scopedHosts(dataScope)
	if err != nil {
		return nil, nil, err
	}
	members := filterHostsByConditions(hosts, group.Conditions)
	return members, &group, nil
}

func (s *GroupService) toResponse(g *Group, hosts []Host) GroupResponse {
	var conds ConditionExpression
	if len(g.Conditions) > 0 {
		json.Unmarshal(g.Conditions, &conds)
	}
	members := filterHostsByConditions(hosts, g.Conditions)

	return GroupResponse{
		ID:          g.ID,
		Name:        g.Name,
		Description: g.Description,
		Conditions:  conds,
		MemberCount: len(members),
		CreatedAt:   g.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   g.UpdatedAt.Format(time.RFC3339),
	}
}

func (s *GroupService) scopedHosts(dataScope *common.DataScopeReq) ([]Host, error) {
	var hosts []Host
	if err := s.db.Model(&Host{}).Scopes(database.WithDataScope(dataScope)).Find(&hosts).Error; err != nil {
		return nil, err
	}
	return hosts, nil
}

func filterHostsByConditions(hosts []Host, conditions datatypes.JSON) []Host {
	var expr ConditionExpression
	if len(conditions) == 0 {
		return hosts
	}
	if err := json.Unmarshal(conditions, &expr); err != nil {
		return hosts
	}
	var result []Host
	for _, h := range hosts {
		if matchHost(h, expr) {
			result = append(result, h)
		}
	}
	return result
}

func validateConditions(expr ConditionExpression) error {
	operator := strings.TrimSpace(expr.Operator)
	if operator == "" {
		operator = "AND"
	}
	if operator != "AND" && operator != "OR" {
		return errors.New("cmdbgroup.invalid_conditions")
	}
	if len(expr.Rules) == 0 {
		return errors.New("cmdbgroup.invalid_conditions")
	}
	for _, rule := range expr.Rules {
		if strings.TrimSpace(rule.Key) == "" || strings.TrimSpace(rule.Val) == "" {
			return errors.New("cmdbgroup.invalid_conditions")
		}
		switch strings.TrimSpace(rule.Op) {
		case "eq", "neq", "in", "notIn":
		default:
			return errors.New("cmdbgroup.invalid_conditions")
		}
	}
	return nil
}

func matchHost(h Host, expr ConditionExpression) bool {
	var labels []LabelEntry
	if len(h.LabelValues) > 0 {
		json.Unmarshal(h.LabelValues, &labels)
	}
	labelMap := make(map[string]string)
	for _, l := range labels {
		labelMap[l.Key] = l.Val
	}
	if expr.Operator == "OR" {
		for _, rule := range expr.Rules {
			if matchRule(labelMap, rule) {
				return true
			}
		}
		return false
	}
	for _, rule := range expr.Rules {
		if !matchRule(labelMap, rule) {
			return false
		}
	}
	return true
}

func matchRule(labelMap map[string]string, rule ConditionRule) bool {
	val, ok := labelMap[rule.Key]
	if !ok {
		return false
	}
	switch rule.Op {
	case "eq":
		return val == rule.Val
	case "neq":
		return val != rule.Val
	case "in":
		for _, v := range strings.Split(rule.Val, ",") {
			if val == strings.TrimSpace(v) {
				return true
			}
		}
		return false
	case "notIn":
		for _, v := range strings.Split(rule.Val, ",") {
			if val == strings.TrimSpace(v) {
				return false
			}
		}
		return true
	default:
		return val == rule.Val
	}
}
