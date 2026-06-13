package config

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
)

func (s *SettingService) BuildAuditPayload(groupKey string, req *SettingGroupUpdateReq, includeOld bool) (string, error) {
	if s.db == nil || req == nil || len(req.Items) == 0 {
		return "", nil
	}

	type auditPayload struct {
		GroupKey string                   `json:"groupKey"`
		Changes  []SettingAuditChangeResp `json:"changes"`
	}

	keys := make([]string, 0, len(req.Items))
	requestValueMap := make(map[string]string, len(req.Items))
	for _, item := range req.Items {
		settingKey := strings.TrimSpace(item.SettingKey)
		if settingKey == "" {
			continue
		}
		keys = append(keys, settingKey)
		requestValueMap[settingKey] = strings.TrimSpace(item.SettingValue)
	}
	if len(keys) == 0 {
		return "", nil
	}

	var rows []SystemSetting
	if err := s.db.Where("group_key = ? AND setting_key IN ?", strings.TrimSpace(groupKey), keys).Find(&rows).Error; err != nil {
		return "", err
	}

	payload := auditPayload{
		GroupKey: strings.TrimSpace(groupKey),
		Changes:  make([]SettingAuditChangeResp, 0, len(rows)),
	}

	for _, row := range rows {
		rawNewValue := requestValueMap[row.SettingKey]
		if row.IsEncrypted == 1 {
			if includeOld && strings.TrimSpace(rawNewValue) == "" {
				continue
			}
			change := SettingAuditChangeResp{
				SettingKey:  row.SettingKey,
				IsEncrypted: row.IsEncrypted,
			}
			if includeOld && strings.TrimSpace(row.SettingValue) != "" {
				change.OldValue = "***"
			}
			if strings.TrimSpace(rawNewValue) != "" {
				change.NewValue = "***"
			}
			payload.Changes = append(payload.Changes, change)
			continue
		}

		normalizedNewValue, err := normalizeSettingValue(row.SettingKey, rawNewValue)
		if err != nil {
			return "", err
		}
		if includeOld && row.SettingValue == normalizedNewValue {
			continue
		}

		change := SettingAuditChangeResp{
			SettingKey:  row.SettingKey,
			IsEncrypted: row.IsEncrypted,
			NewValue:    normalizedNewValue,
		}
		if includeOld {
			change.OldValue = row.SettingValue
		}
		payload.Changes = append(payload.Changes, change)
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// applyAuditFilters applies common filter conditions for audit queries.
// Uses JSON_EXTRACT for oper_param JSON field queries instead of LIKE,
// which enables MySQL to use generated column indexes and avoids full table scans.
func applyAuditFilters(db *gorm.DB, query *SettingAuditQuery) *gorm.DB {
	if query == nil {
		return db
	}
	if strings.TrimSpace(query.OperName) != "" {
		db = db.Where("oper_name LIKE ?", "%"+strings.TrimSpace(query.OperName)+"%")
	}
	if strings.TrimSpace(query.GroupKey) != "" {
		// JSON_EXTRACT with unquote for exact match on JSON field — index-friendly
		db = db.Where("JSON_UNQUOTE(JSON_EXTRACT(oper_param, '$.groupKey')) = ?", strings.TrimSpace(query.GroupKey))
	}
	if strings.TrimSpace(query.SettingKey) != "" {
		db = db.Where("JSON_UNQUOTE(JSON_EXTRACT(oper_param, '$.settingKey')) = ?", strings.TrimSpace(query.SettingKey))
	}
	return db
}

func (s *SettingService) ListAudit(query *SettingAuditQuery) (*SettingAuditPageResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	page := 1
	pageSize := 10
	if query != nil {
		if query.Page > 0 {
			page = query.Page
		}
		if query.PageSize > 0 && query.PageSize <= 100 {
			pageSize = query.PageSize
		}
	}

	db := applyAuditFilters(s.db.Model(&systemSettingAuditLog{}).Where("title = ?", settingAuditTitle), query)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []systemSettingAuditLog
	if err := db.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]SettingAuditResp, 0, len(rows))
	for _, row := range rows {
		groupKey, changes := parseSettingAuditPayload(row.OperParam)
		items = append(items, SettingAuditResp{
			ID:       row.ID,
			GroupKey: groupKey,
			OperName: row.OperName,
			OperIP:   row.OperIP,
			Status:   row.Status,
			ErrorMsg: row.ErrorMsg,
			OperTime: row.OperTime.Format(time.RFC3339),
			CostTime: row.CostTime,
			Changes:  changes,
		})
	}

	return &SettingAuditPageResp{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *SettingService) ExportAudit(query *SettingAuditQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	db := applyAuditFilters(s.db.Model(&systemSettingAuditLog{}).Where("title = ?", settingAuditTitle), query)

	var rows []systemSettingAuditLog
	if err := db.Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([][]string, 0, len(rows))
	for _, row := range rows {
		groupKey, changes := parseSettingAuditPayload(row.OperParam)
		result = append(result, []string{
			groupKey,
			row.OperName,
			row.OperIP,
			formatSettingAuditChanges(changes),
			strconv.Itoa(row.Status),
			row.ErrorMsg,
			row.OperTime.Format(time.RFC3339),
			strconv.FormatInt(row.CostTime, 10),
		})
	}

	return &impexp.CSVFile{
		Filename: "system-setting-audit-export.csv",
		Headers:  []string{"groupKey", "operName", "operIp", "changes", "status", "errorMsg", "operTime", "costTime"},
		Rows:     result,
	}, nil
}

func parseSettingAuditPayload(raw string) (string, []SettingAuditChangeResp) {
	var payload struct {
		GroupKey string                   `json:"groupKey"`
		Changes  []SettingAuditChangeResp `json:"changes"`
	}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return "", []SettingAuditChangeResp{}
	}
	return payload.GroupKey, payload.Changes
}

func formatSettingAuditChanges(changes []SettingAuditChangeResp) string {
	if len(changes) == 0 {
		return ""
	}
	parts := make([]string, 0, len(changes))
	for _, change := range changes {
		if change.IsEncrypted == 1 {
			parts = append(parts, change.SettingKey+":***->***")
			continue
		}
		parts = append(parts, change.SettingKey+":"+change.OldValue+"->"+change.NewValue)
	}
	return strings.Join(parts, " | ")
}
