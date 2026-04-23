package system

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

type SettingService struct {
	db          *gorm.DB
	cacheMu     sync.RWMutex
	listCache   map[string][]SettingResp
	groupCache  map[string]*SettingGroupResp
	publicCache *PublicSettingResp
}

const (
	settingAuditTitle        = "setting.group.update"
	settingAuditBusinessType = 1001
	settingAuditMaskedValue  = "***"
)

type defaultSettingSeed struct {
	SettingKey   string
	SettingValue string
	ValueType    string
	GroupKey     string
	Module       string
	IsPublic     int
	IsEncrypted  int
	Remark       string
}

var defaultSettingSeeds = []defaultSettingSeed{
	{SettingKey: "site.name", SettingValue: "Pantheon Base", ValueType: "string", GroupKey: "basic", Module: "system", IsPublic: 1, Remark: "system.setting.remark.site.name"},
	{SettingKey: "site.logo", SettingValue: "", ValueType: "string", GroupKey: "basic", Module: "system", IsPublic: 1, Remark: "system.setting.remark.site.logo"},
	{SettingKey: "security.password_min_length", SettingValue: "6", ValueType: "number", GroupKey: "security", Module: "system", IsPublic: 0, Remark: "system.setting.remark.security.password_min_length"},
	{SettingKey: "login.max_failed_attempts", SettingValue: "5", ValueType: "number", GroupKey: "login", Module: "system", IsPublic: 0, Remark: "system.setting.remark.login.max_failed_attempts"},
	{SettingKey: "login.lock_minutes", SettingValue: "15", ValueType: "number", GroupKey: "login", Module: "system", IsPublic: 0, Remark: "system.setting.remark.login.lock_minutes"},
	{SettingKey: "i18n.default_language", SettingValue: "zh-CN", ValueType: "string", GroupKey: "i18n", Module: "system", IsPublic: 1, Remark: "system.setting.remark.i18n.default_language"},
	{SettingKey: "ui.default_theme", SettingValue: "indigo", ValueType: "string", GroupKey: "ui", Module: "system", IsPublic: 1, Remark: "system.setting.remark.ui.default_theme"},
	{SettingKey: "ui.enable_tab_bar", SettingValue: "true", ValueType: "boolean", GroupKey: "ui", Module: "system", IsPublic: 1, Remark: "system.setting.remark.ui.enable_tab_bar"},
	{SettingKey: "upload.storage_driver", SettingValue: "local", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.storage_driver"},
	{SettingKey: "upload.max_file_size", SettingValue: "20", ValueType: "number", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.max_file_size"},
	{SettingKey: "upload.allowed_types", SettingValue: "[\"jpg\",\"jpeg\",\"png\",\"pdf\",\"doc\",\"docx\",\"xls\",\"xlsx\"]", ValueType: "json", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.allowed_types"},
	{SettingKey: "upload.local_path", SettingValue: "./uploads", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.local_path"},
	{SettingKey: "upload.public_base_url", SettingValue: "", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.public_base_url"},
	{SettingKey: "upload.s3_endpoint", SettingValue: "", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.s3_endpoint"},
	{SettingKey: "upload.s3_bucket", SettingValue: "", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, Remark: "system.setting.remark.upload.s3_bucket"},
	{SettingKey: "upload.s3_access_key_id", SettingValue: "", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, IsEncrypted: 1, Remark: "system.setting.remark.upload.s3_access_key_id"},
	{SettingKey: "upload.s3_secret_access_key", SettingValue: "", ValueType: "string", GroupKey: "upload", Module: "system", IsPublic: 0, IsEncrypted: 1, Remark: "system.setting.remark.upload.s3_secret_access_key"},
}

func NewSettingService(db *gorm.DB) *SettingService {
	return &SettingService{
		db:         db,
		listCache:  make(map[string][]SettingResp),
		groupCache: make(map[string]*SettingGroupResp),
	}
}

func (s *SettingService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&SystemSetting{}); err != nil {
		return err
	}
	for _, item := range defaultSettingSeeds {
		var count int64
		if err := s.db.Model(&SystemSetting{}).Where("setting_key = ?", item.SettingKey).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		storedValue, err := prepareSettingStoredValue(item.SettingValue, item.IsEncrypted)
		if err != nil {
			return err
		}
		if err := s.db.Create(&SystemSetting{
			SettingKey:   item.SettingKey,
			SettingValue: storedValue,
			ValueType:    item.ValueType,
			GroupKey:     item.GroupKey,
			Module:       item.Module,
			IsPublic:     item.IsPublic,
			IsEncrypted:  item.IsEncrypted,
			Remark:       item.Remark,
		}).Error; err != nil {
			return err
		}
	}
	if err := s.db.Model(&SystemSetting{}).
		Where("setting_key = ? AND setting_value = ?", "ui.default_theme", "light").
		Update("setting_value", "indigo").Error; err != nil {
		return err
	}
	return nil
}

func (s *SettingService) List(query *SettingListQuery) ([]SettingResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	groupKey := ""
	module := ""
	if query != nil {
		groupKey = strings.TrimSpace(query.GroupKey)
		module = strings.TrimSpace(query.Module)
	}
	cacheKey := settingListCacheKey(groupKey, module)
	s.cacheMu.RLock()
	if cached, ok := s.listCache[cacheKey]; ok {
		s.cacheMu.RUnlock()
		return cloneSettingRespList(cached), nil
	}
	s.cacheMu.RUnlock()

	var rows []SystemSetting
	db := s.db.Model(&SystemSetting{})
	if groupKey != "" {
		db = db.Where("group_key = ?", groupKey)
	}
	if module != "" {
		db = db.Where("module = ?", module)
	}
	if err := db.Order("group_key asc, id asc").Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([]SettingResp, 0, len(rows))
	for _, item := range rows {
		result = append(result, toSettingResp(item))
	}
	s.cacheMu.Lock()
	s.listCache[cacheKey] = cloneSettingRespList(result)
	s.cacheMu.Unlock()
	return cloneSettingRespList(result), nil
}

func (s *SettingService) GetGroup(groupKey string) (*SettingGroupResp, error) {
	groupKey = strings.TrimSpace(groupKey)
	if groupKey == "" {
		return nil, errors.New("setting.group.invalid")
	}
	s.cacheMu.RLock()
	if cached, ok := s.groupCache[groupKey]; ok {
		s.cacheMu.RUnlock()
		return cloneSettingGroupResp(cached), nil
	}
	s.cacheMu.RUnlock()
	items, err := s.List(&SettingListQuery{GroupKey: groupKey})
	if err != nil {
		return nil, err
	}
	group := &SettingGroupResp{GroupKey: groupKey, Items: items}
	s.cacheMu.Lock()
	s.groupCache[groupKey] = cloneSettingGroupResp(group)
	s.cacheMu.Unlock()
	return cloneSettingGroupResp(group), nil
}

// GetByKey 根据 key 获取配置值，支持自动解密。供后端内部调用。
func (s *SettingService) GetByKey(settingKey string) (string, error) {
	if s.db == nil {
		return "", errors.New("database.not_initialized")
	}

	var item SystemSetting
	if err := s.db.Where("setting_key = ?", settingKey).First(&item).Error; err != nil {
		return "", err
	}

	if item.IsEncrypted == 1 {
		return decryptSettingValue(item.SettingValue)
	}
	return item.SettingValue, nil
}

func (s *SettingService) UpdateGroup(groupKey string, req *SettingGroupUpdateReq) (*SettingGroupResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	groupKey = strings.TrimSpace(groupKey)
	if groupKey == "" {
		return nil, errors.New("setting.group.invalid")
	}
	if req == nil || len(req.Items) == 0 {
		return nil, errors.New("param.invalid")
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range req.Items {
			settingKey := strings.TrimSpace(item.SettingKey)
			if settingKey == "" {
				return errors.New("setting.key.required")
			}

			var current SystemSetting
			if err := tx.Where("setting_key = ? AND group_key = ?", settingKey, groupKey).First(&current).Error; err != nil {
				return err
			}
			nextValue := strings.TrimSpace(item.SettingValue)
			if current.IsEncrypted == 1 && nextValue == "" {
				continue
			}
			if err := validateSettingValue(current.ValueType, nextValue); err != nil {
				return err
			}
			storedValue, err := prepareSettingStoredValue(nextValue, current.IsEncrypted)
			if err != nil {
				return err
			}
			if err := tx.Model(&current).Update("setting_value", storedValue).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	s.invalidateSettingCache()
	return s.GetGroup(groupKey)
}

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

	payload := auditPayload{GroupKey: strings.TrimSpace(groupKey), Changes: make([]SettingAuditChangeResp, 0, len(rows))}
	for _, row := range rows {
		newValue := requestValueMap[row.SettingKey]
		if row.IsEncrypted == 1 {
			if includeOld && strings.TrimSpace(newValue) == "" {
				continue
			}
			change := SettingAuditChangeResp{
				SettingKey:  row.SettingKey,
				IsEncrypted: row.IsEncrypted,
				OldValue:    "",
				NewValue:    "",
			}
			if includeOld && strings.TrimSpace(row.SettingValue) != "" {
				change.OldValue = settingAuditMaskedValue
			}
			if strings.TrimSpace(newValue) != "" {
				change.NewValue = settingAuditMaskedValue
			}
			payload.Changes = append(payload.Changes, change)
			continue
		}

		if includeOld && row.SettingValue == newValue {
			continue
		}
		change := SettingAuditChangeResp{
			SettingKey:  row.SettingKey,
			IsEncrypted: row.IsEncrypted,
			NewValue:    newValue,
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

func (s *SettingService) ListAudit(query *SettingAuditQuery) (*SettingAuditPageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
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

	db := s.db.Model(&systemSettingAuditLog{}).Where("title = ?", settingAuditTitle)
	if query != nil {
		if strings.TrimSpace(query.OperName) != "" {
			db = db.Where("oper_name LIKE ?", "%"+strings.TrimSpace(query.OperName)+"%")
		}
		if strings.TrimSpace(query.GroupKey) != "" {
			db = db.Where("oper_param LIKE ?", "%\"groupKey\":\""+strings.TrimSpace(query.GroupKey)+"\"%")
		}
		if strings.TrimSpace(query.SettingKey) != "" {
			db = db.Where("oper_param LIKE ?", "%\"settingKey\":\""+strings.TrimSpace(query.SettingKey)+"\"%")
		}
	}

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

func (s *SettingService) GetPublicSettings() (*PublicSettingResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	s.cacheMu.RLock()
	if s.publicCache != nil {
		s.cacheMu.RUnlock()
		return clonePublicSettingResp(s.publicCache), nil
	}
	s.cacheMu.RUnlock()

	var rows []SystemSetting
	if err := s.db.Model(&SystemSetting{}).Where("is_public = ? AND is_encrypted = ?", 1, 0).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}

	settings := make(map[string]string, len(rows))
	for _, item := range rows {
		settings[item.SettingKey] = item.SettingValue
	}
	resp := &PublicSettingResp{Settings: settings}
	s.cacheMu.Lock()
	s.publicCache = clonePublicSettingResp(resp)
	s.cacheMu.Unlock()
	return clonePublicSettingResp(resp), nil
}

func (s *SettingService) RefreshSettingCache(groupKeys []string) (*SettingCacheRefreshResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	normalizedGroups := normalizeSettingGroups(groupKeys)
	if len(normalizedGroups) == 0 {
		s.invalidateSettingCache()
		return &SettingCacheRefreshResp{
			RefreshedGroups: []string{},
			ClearedAll:      1,
		}, nil
	}

	s.invalidateSettingCache()
	for _, groupKey := range normalizedGroups {
		if _, err := s.GetGroup(groupKey); err != nil {
			return nil, err
		}
	}
	if _, err := s.GetPublicSettings(); err != nil {
		return nil, err
	}

	return &SettingCacheRefreshResp{
		RefreshedGroups: normalizedGroups,
		ClearedAll:      0,
	}, nil
}

func prepareSettingStoredValue(value string, isEncrypted int) (string, error) {
	trimmed := strings.TrimSpace(value)
	if isEncrypted != 1 {
		return trimmed, nil
	}
	return encryptSettingValue(trimmed)
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

func settingListCacheKey(groupKey string, module string) string {
	return strings.TrimSpace(groupKey) + "|" + strings.TrimSpace(module)
}

func cloneSettingRespList(items []SettingResp) []SettingResp {
	if len(items) == 0 {
		return []SettingResp{}
	}
	result := make([]SettingResp, len(items))
	copy(result, items)
	return result
}

func cloneSettingGroupResp(resp *SettingGroupResp) *SettingGroupResp {
	if resp == nil {
		return nil
	}
	return &SettingGroupResp{
		GroupKey: resp.GroupKey,
		Items:    cloneSettingRespList(resp.Items),
	}
}

func clonePublicSettingResp(resp *PublicSettingResp) *PublicSettingResp {
	if resp == nil {
		return nil
	}
	settings := make(map[string]string, len(resp.Settings))
	for key, value := range resp.Settings {
		settings[key] = value
	}
	return &PublicSettingResp{Settings: settings}
}

func normalizeSettingGroups(groupKeys []string) []string {
	result := make([]string, 0, len(groupKeys))
	seen := make(map[string]struct{}, len(groupKeys))
	for _, groupKey := range groupKeys {
		trimmed := strings.TrimSpace(groupKey)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func (s *SettingService) invalidateSettingCache() {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()
	s.listCache = make(map[string][]SettingResp)
	s.groupCache = make(map[string]*SettingGroupResp)
	s.publicCache = nil
}

func validateSettingValue(valueType string, value string) error {
	switch strings.TrimSpace(valueType) {
	case "string":
		return nil
	case "number":
		if _, err := strconv.ParseFloat(strings.TrimSpace(value), 64); err != nil {
			return errors.New("setting.value.invalid_number")
		}
		return nil
	case "boolean":
		if _, err := strconv.ParseBool(strings.TrimSpace(value)); err != nil {
			return errors.New("setting.value.invalid_boolean")
		}
		return nil
	case "json":
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return nil
		}
		var target interface{}
		if err := json.Unmarshal([]byte(trimmed), &target); err != nil {
			return errors.New("setting.value.invalid_json")
		}
		return nil
	default:
		return errors.New("setting.value_type.invalid")
	}
}

func toSettingResp(item SystemSetting) SettingResp {
	hasValue := 0
	if strings.TrimSpace(item.SettingValue) != "" {
		hasValue = 1
	}

	displayValue := item.SettingValue
	if item.IsEncrypted == 1 {
		displayValue = ""
	}

	return SettingResp{
		ID:           item.ID,
		SettingKey:   item.SettingKey,
		SettingValue: displayValue,
		ValueType:    item.ValueType,
		GroupKey:     item.GroupKey,
		Module:       item.Module,
		IsPublic:     item.IsPublic,
		IsEncrypted:  item.IsEncrypted,
		HasValue:     hasValue,
		Remark:       item.Remark,
		CreatedAt:    item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    item.UpdatedAt.Format(time.RFC3339),
	}
}
