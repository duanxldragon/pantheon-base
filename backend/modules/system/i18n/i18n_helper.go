package system

import (
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/common"

	"gorm.io/gorm"
)

func isI18nPlaceholderValue(value string) bool {
	trimmed := strings.TrimSpace(value)
	return strings.HasPrefix(trimmed, "[") && strings.HasSuffix(trimmed, "]")
}

func hasStoredLocaleValue(value string) bool {
	trimmed := strings.TrimSpace(value)
	return trimmed != "" && !isI18nPlaceholderValue(trimmed)
}

func hasEffectiveLocaleValue(locale, key, value string) bool {
	if hasStoredLocaleValue(value) {
		return true
	}
	_, ok := getBuiltinLocaleValue(locale, key)
	return ok
}

type i18nAuditRow struct {
	ID                uint64
	Module            string
	Group             string
	Key               string
	Locale            string
	Value             string
	LifecycleStatus   string
	LifecycleMarkedAt *time.Time
	UpdatedAt         time.Time
}

type i18nAuditRowValues struct {
	module string
	group  string
	key    string
	locale string
	value  string
}

type i18nKeyAudit struct {
	modules map[string]struct{}
	groups  map[string]struct{}
	locales map[string]struct{}
	values  map[string]struct{}
	rows    int64
}

type i18nModuleAudit struct {
	entryCount         int64
	keys               map[string]struct{}
	unusedKeys         map[string]struct{}
	duplicateKeys      map[string]struct{}
	missingLocaleKeys  map[string]struct{}
	placeholderCount   int64
	stalePlaceholders  int64
	observingKeys      map[string]struct{}
	archivedKeys       map[string]struct{}
	deleteEligibleKeys map[string]struct{}
}

type i18nUnusedKeyAudit struct {
	module            string
	key               string
	groups            map[string]struct{}
	locales           map[string]struct{}
	values            map[string]struct{}
	lifecycleStatus   string
	lifecycleMarkedAt *time.Time
}

type i18nMissingLocaleRow struct {
	Module string
	Group  string
	Key    string
	Locale string
}

type i18nMissingLocaleMeta struct {
	module  string
	group   string
	locales map[string]struct{}
}

type i18nHydrateBuiltinLocaleRow struct {
	ID     uint64
	Module string
	Group  string
	Key    string
	Locale string
	Value  string
}

func (s *I18nService) ScanErrorKeys() ([]string, error) {
	return scanI18nKeys(true)
}

func (s *I18nService) SyncMissingKeys() (*I18nSyncResp, error) {
	keys, err := s.ScanErrorKeys()
	if err != nil {
		return nil, err
	}
	resp := &I18nSyncResp{Keys: []string{}}
	supportedLocales, err := s.ListSupportedLocales()
	if err != nil {
		return nil, err
	}
	for _, k := range keys {
		createdForKey := false
		for _, locale := range supportedLocales {
			var exists int64
			if err := s.db.Model(&SystemI18n{}).Where("`key` = ? AND locale = ?", k, locale).Count(&exists).Error; err != nil {
				return resp, err
			}
			if exists > 0 {
				continue
			}
			value := "[" + k + "]"
			if builtinValue, ok := getBuiltinLocaleValue(locale, k); ok {
				value = builtinValue
			}
			if err := s.db.Create(&SystemI18n{
				Module: "system.config",
				Group:  "messages",
				Key:    k,
				Locale: locale,
				Value:  value,
			}).Error; err != nil {
				return resp, err
			}
			createdForKey = true
		}
		if createdForKey {
			resp.Count++
			resp.Keys = append(resp.Keys, k)
		}
	}
	return resp, s.ReloadCache()
}

func (s *I18nService) GetAudit() (*I18nAuditResp, error) {
	resp := newI18nAuditResp()
	if s.db == nil {
		return resp, nil
	}

	rows, err := s.loadI18nAuditRows()
	if err != nil {
		return nil, err
	}

	usedSet, err := scanUsedI18nKeySet()
	if err != nil {
		return nil, err
	}

	locales, err := s.ListSupportedLocales()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	keyAudits, unusedKeyAudits, moduleAudits := buildI18nAuditMaps(rows, now, resp)
	appendDuplicateAndMissingLocaleAudits(resp, keyAudits, moduleAudits, locales)
	s.appendUnusedKeyAudits(resp, unusedKeyAudits, moduleAudits, usedSet, now)
	appendModuleAuditItems(resp, moduleAudits)
	sortI18nAuditResp(resp)
	return resp, nil
}

func newI18nAuditResp() *I18nAuditResp {
	return &I18nAuditResp{
		DuplicateKeys:                  make([]I18nDuplicateKeyConflict, 0),
		UnusedKeys:                     make([]I18nUnusedKeyItem, 0),
		StalePlaceholders:              make([]I18nStalePlaceholderItem, 0),
		Modules:                        make([]I18nModuleAuditItem, 0),
		StalePlaceholderThresholdDays:  I18nStalePlaceholderThresholdDays,
		UnusedObservationThresholdDays: I18nUnusedObservationThresholdDays,
		ArchivedRetentionThresholdDays: I18nArchivedRetentionThresholdDays,
	}
}

func (s *I18nService) loadI18nAuditRows() ([]i18nAuditRow, error) {
	var rows []i18nAuditRow
	err := s.db.Model(&SystemI18n{}).
		Select("id, module, group_name as `group`, `key`, locale, value, lifecycle_status, lifecycle_marked_at, updated_at").
		Order(I18nSortModuleASC).
		Order(I18nSortGroupNameASC).
		Order(I18nSortKeyASC).
		Order(I18nSortLocaleASC).
		Find(&rows).Error
	return rows, err
}

func scanUsedI18nKeySet() (map[string]struct{}, error) {
	usedKeys, err := scanI18nKeys(true)
	if err != nil {
		return nil, err
	}
	usedSet := make(map[string]struct{}, len(usedKeys))
	for _, key := range usedKeys {
		usedSet[key] = struct{}{}
	}
	return usedSet, nil
}

func buildI18nAuditMaps(rows []i18nAuditRow, now time.Time, resp *I18nAuditResp) (
	map[string]*i18nKeyAudit,
	map[string]*i18nUnusedKeyAudit,
	map[string]*i18nModuleAudit,
) {
	keyAudits := make(map[string]*i18nKeyAudit)
	unusedKeyAudits := make(map[string]*i18nUnusedKeyAudit)
	moduleAudits := make(map[string]*i18nModuleAudit)
	for _, item := range rows {
		collectI18nAuditRow(item, now, resp, keyAudits, unusedKeyAudits, moduleAudits)
	}
	return keyAudits, unusedKeyAudits, moduleAudits
}

func collectI18nAuditRow(
	item i18nAuditRow,
	now time.Time,
	resp *I18nAuditResp,
	keyAudits map[string]*i18nKeyAudit,
	unusedKeyAudits map[string]*i18nUnusedKeyAudit,
	moduleAudits map[string]*i18nModuleAudit,
) {
	values := normalizeI18nAuditRowValues(item)
	if values.key == "" {
		return
	}

	recordI18nKeyAudit(ensureI18nKeyAudit(keyAudits, values.key), values)
	moduleMeta := ensureI18nModuleAudit(moduleAudits, values.module)
	recordI18nModuleAudit(moduleMeta, values, item, now, resp)
	recordI18nUnusedKeyAudit(ensureI18nUnusedKeyAudit(unusedKeyAudits, values, item), values)
}

func normalizeI18nAuditRowValues(item i18nAuditRow) i18nAuditRowValues {
	return i18nAuditRowValues{
		module: strings.TrimSpace(item.Module),
		group:  strings.TrimSpace(item.Group),
		key:    strings.TrimSpace(item.Key),
		locale: strings.TrimSpace(item.Locale),
		value:  strings.TrimSpace(item.Value),
	}
}

func ensureI18nKeyAudit(audits map[string]*i18nKeyAudit, key string) *i18nKeyAudit {
	meta, ok := audits[key]
	if ok {
		return meta
	}
	meta = &i18nKeyAudit{
		modules: make(map[string]struct{}),
		groups:  make(map[string]struct{}),
		locales: make(map[string]struct{}),
		values:  make(map[string]struct{}),
	}
	audits[key] = meta
	return meta
}

func ensureI18nModuleAudit(audits map[string]*i18nModuleAudit, module string) *i18nModuleAudit {
	meta, ok := audits[module]
	if ok {
		return meta
	}
	meta = &i18nModuleAudit{
		keys:               make(map[string]struct{}),
		unusedKeys:         make(map[string]struct{}),
		duplicateKeys:      make(map[string]struct{}),
		missingLocaleKeys:  make(map[string]struct{}),
		observingKeys:      make(map[string]struct{}),
		archivedKeys:       make(map[string]struct{}),
		deleteEligibleKeys: make(map[string]struct{}),
	}
	audits[module] = meta
	return meta
}

func ensureI18nUnusedKeyAudit(audits map[string]*i18nUnusedKeyAudit, values i18nAuditRowValues, item i18nAuditRow) *i18nUnusedKeyAudit {
	compositeKey := values.module + "|" + values.key
	meta, ok := audits[compositeKey]
	if ok {
		return meta
	}
	meta = &i18nUnusedKeyAudit{
		module:            values.module,
		key:               values.key,
		groups:            make(map[string]struct{}),
		locales:           make(map[string]struct{}),
		values:            make(map[string]struct{}),
		lifecycleStatus:   normalizeI18nLifecycleStatus(item.LifecycleStatus),
		lifecycleMarkedAt: item.LifecycleMarkedAt,
	}
	audits[compositeKey] = meta
	return meta
}

func recordI18nKeyAudit(meta *i18nKeyAudit, values i18nAuditRowValues) {
	meta.rows++
	addNonBlankI18nSetValue(meta.modules, values.module)
	addNonBlankI18nSetValue(meta.groups, values.group)
	addNonBlankI18nSetValue(meta.locales, values.locale)
	addNonBlankI18nSetValue(meta.values, values.value)
}

func recordI18nModuleAudit(meta *i18nModuleAudit, values i18nAuditRowValues, item i18nAuditRow, now time.Time, resp *I18nAuditResp) {
	meta.entryCount++
	meta.keys[values.key] = struct{}{}
	if hasEffectiveLocaleValue(values.locale, values.key, values.value) {
		return
	}
	meta.placeholderCount++
	appendStaleI18nPlaceholder(resp, meta, values, item, now)
}

func appendStaleI18nPlaceholder(resp *I18nAuditResp, meta *i18nModuleAudit, values i18nAuditRowValues, item i18nAuditRow, now time.Time) {
	staleDays := int64(now.Sub(item.UpdatedAt).Hours() / 24)
	if staleDays < I18nStalePlaceholderThresholdDays {
		return
	}
	meta.stalePlaceholders++
	resp.StalePlaceholders = append(resp.StalePlaceholders, I18nStalePlaceholderItem{
		ID:        item.ID,
		Module:    values.module,
		Group:     values.group,
		Key:       values.key,
		Locale:    values.locale,
		Value:     values.value,
		UpdatedAt: item.UpdatedAt.Format(time.RFC3339),
		StaleDays: staleDays,
	})
}

func recordI18nUnusedKeyAudit(meta *i18nUnusedKeyAudit, values i18nAuditRowValues) {
	addNonBlankI18nSetValue(meta.groups, values.group)
	addNonBlankI18nSetValue(meta.locales, values.locale)
	addNonBlankI18nSetValue(meta.values, values.value)
}

func addNonBlankI18nSetValue(values map[string]struct{}, value string) {
	if value != "" {
		values[value] = struct{}{}
	}
}

func appendDuplicateAndMissingLocaleAudits(
	resp *I18nAuditResp,
	keyAudits map[string]*i18nKeyAudit,
	moduleAudits map[string]*i18nModuleAudit,
	locales []string,
) {
	for key, meta := range keyAudits {
		addBuiltinLocalesToAudit(meta, key, locales)
		appendDuplicateKeyAudit(resp, key, meta, moduleAudits)
		markMissingLocaleAuditKeys(key, meta, moduleAudits, locales)
	}
}

func addBuiltinLocalesToAudit(meta *i18nKeyAudit, key string, locales []string) {
	for _, locale := range locales {
		if _, ok := meta.locales[locale]; ok {
			continue
		}
		if _, builtinOk := getBuiltinLocaleValue(locale, key); builtinOk {
			meta.locales[locale] = struct{}{}
		}
	}
}

func appendDuplicateKeyAudit(resp *I18nAuditResp, key string, meta *i18nKeyAudit, moduleAudits map[string]*i18nModuleAudit) {
	if len(meta.modules) <= 1 && len(meta.groups) <= 1 {
		return
	}
	modules := sortedSetKeys(meta.modules)
	for _, module := range modules {
		if moduleMeta, ok := moduleAudits[module]; ok {
			moduleMeta.duplicateKeys[key] = struct{}{}
		}
	}
	resp.DuplicateKeys = append(resp.DuplicateKeys, I18nDuplicateKeyConflict{
		Key:         key,
		Modules:     modules,
		Groups:      sortedSetKeys(meta.groups),
		Locales:     sortedSetKeys(meta.locales),
		Values:      sortedSetKeys(meta.values),
		RowCount:    meta.rows,
		Suggestions: buildI18nRenameSuggestions(modules, key),
	})
}

func buildI18nRenameSuggestions(modules []string, key string) []I18nRenameSuggestion {
	suggestions := make([]I18nRenameSuggestion, 0, len(modules))
	for _, module := range modules {
		suggestions = append(suggestions, I18nRenameSuggestion{
			Module:       module,
			SuggestedKey: suggestScopedI18nKey(module, key),
		})
	}
	return suggestions
}

func markMissingLocaleAuditKeys(key string, meta *i18nKeyAudit, moduleAudits map[string]*i18nModuleAudit, locales []string) {
	if int64(len(meta.locales)) >= int64(len(locales)) {
		return
	}
	for _, module := range sortedSetKeys(meta.modules) {
		if moduleMeta, ok := moduleAudits[module]; ok {
			moduleMeta.missingLocaleKeys[key] = struct{}{}
		}
	}
}

func (s *I18nService) appendUnusedKeyAudits(
	resp *I18nAuditResp,
	unusedKeyAudits map[string]*i18nUnusedKeyAudit,
	moduleAudits map[string]*i18nModuleAudit,
	usedSet map[string]struct{},
	now time.Time,
) {
	for compositeKey, meta := range unusedKeyAudits {
		if _, ok := usedSet[meta.key]; ok {
			s.resetActiveUsedI18nLifecycle(compositeKey, meta)
			continue
		}
		moduleMeta, ok := moduleAudits[meta.module]
		if !ok {
			continue
		}
		appendUnusedKeyAudit(resp, moduleMeta, meta, now)
	}
}

func (s *I18nService) resetActiveUsedI18nLifecycle(compositeKey string, meta *i18nUnusedKeyAudit) {
	if meta.lifecycleStatus == I18nLifecycleStatusActive {
		return
	}
	if err := s.resetI18nLifecycle(compositeKey, meta.module, meta.key); err == nil {
		meta.lifecycleStatus = I18nLifecycleStatusActive
		meta.lifecycleMarkedAt = nil
	}
}

func appendUnusedKeyAudit(resp *I18nAuditResp, moduleMeta *i18nModuleAudit, meta *i18nUnusedKeyAudit, now time.Time) {
	moduleMeta.unusedKeys[meta.key] = struct{}{}
	observingDays, markedAt := i18nLifecycleAge(meta.lifecycleMarkedAt, now)
	recordUnusedLifecycleStatus(moduleMeta, meta, observingDays)
	resp.UnusedKeys = append(resp.UnusedKeys, buildUnusedKeyAuditItem(meta, observingDays, markedAt))
}

func i18nLifecycleAge(markedAt *time.Time, now time.Time) (int64, string) {
	if markedAt == nil {
		return 0, ""
	}
	return int64(now.Sub(*markedAt).Hours() / 24), markedAt.Format(time.RFC3339)
}

func recordUnusedLifecycleStatus(moduleMeta *i18nModuleAudit, meta *i18nUnusedKeyAudit, observingDays int64) {
	if meta.lifecycleStatus == I18nLifecycleStatusObserving {
		moduleMeta.observingKeys[meta.key] = struct{}{}
	}
	if meta.lifecycleStatus == I18nLifecycleStatusArchived {
		moduleMeta.archivedKeys[meta.key] = struct{}{}
	}
	if meta.lifecycleStatus == I18nLifecycleStatusArchived && observingDays >= I18nArchivedRetentionThresholdDays {
		moduleMeta.deleteEligibleKeys[meta.key] = struct{}{}
	}
}

func buildUnusedKeyAuditItem(meta *i18nUnusedKeyAudit, observingDays int64, markedAt string) I18nUnusedKeyItem {
	eligibleForDelete := meta.lifecycleStatus == I18nLifecycleStatusArchived && observingDays >= I18nArchivedRetentionThresholdDays
	return I18nUnusedKeyItem{
		Key:                meta.key,
		Module:             meta.module,
		Modules:            []string{meta.module},
		Groups:             sortedSetKeys(meta.groups),
		Locales:            sortedSetKeys(meta.locales),
		Placeholder:        allValuesMissing(meta.values),
		LifecycleStatus:    meta.lifecycleStatus,
		LifecycleMarkedAt:  markedAt,
		ObservingDays:      observingDays,
		EligibleForArchive: meta.lifecycleStatus == I18nLifecycleStatusObserving && observingDays >= I18nUnusedObservationThresholdDays,
		EligibleForDelete:  eligibleForDelete,
	}
}

func appendModuleAuditItems(resp *I18nAuditResp, moduleAudits map[string]*i18nModuleAudit) {
	moduleNames := make([]string, 0, len(moduleAudits))
	for module := range moduleAudits {
		moduleNames = append(moduleNames, module)
	}
	sort.Strings(moduleNames)
	for _, module := range moduleNames {
		resp.Modules = append(resp.Modules, buildModuleAuditItem(module, moduleAudits[module]))
	}
}

func buildModuleAuditItem(module string, item *i18nModuleAudit) I18nModuleAuditItem {
	return I18nModuleAuditItem{
		Module:                 module,
		EntryCount:             item.entryCount,
		KeyCount:               int64(len(item.keys)),
		UnusedKeyCount:         int64(len(item.unusedKeys)),
		DuplicateKeyCount:      int64(len(item.duplicateKeys)),
		MissingLocaleCount:     int64(len(item.missingLocaleKeys)),
		PlaceholderCount:       item.placeholderCount,
		StalePlaceholderCount:  item.stalePlaceholders,
		ObservingKeyCount:      int64(len(item.observingKeys)),
		ArchivedKeyCount:       int64(len(item.archivedKeys)),
		DeleteEligibleKeyCount: int64(len(item.deleteEligibleKeys)),
	}
}

func sortI18nAuditResp(resp *I18nAuditResp) {
	sort.Slice(resp.DuplicateKeys, func(i, j int) bool { return resp.DuplicateKeys[i].Key < resp.DuplicateKeys[j].Key })
	sort.Slice(resp.UnusedKeys, func(i, j int) bool { return resp.UnusedKeys[i].Key < resp.UnusedKeys[j].Key })
	sort.Slice(resp.StalePlaceholders, func(i, j int) bool {
		return stalePlaceholderLess(resp.StalePlaceholders[i], resp.StalePlaceholders[j])
	})
}

func stalePlaceholderLess(left I18nStalePlaceholderItem, right I18nStalePlaceholderItem) bool {
	if left.StaleDays != right.StaleDays {
		return left.StaleDays > right.StaleDays
	}
	if left.Key != right.Key {
		return left.Key < right.Key
	}
	return left.Locale < right.Locale
}

func (s *I18nService) CleanupUnusedKeys(module string) (*I18nCleanupUnusedResp, error) {
	audit, err := s.GetAudit()
	if err != nil {
		return nil, err
	}
	resp := &I18nCleanupUnusedResp{
		Keys:   make([]string, 0),
		Module: strings.TrimSpace(module),
	}
	if s.db == nil {
		return resp, nil
	}

	keys := make([]string, 0, len(audit.UnusedKeys))
	for _, item := range audit.UnusedKeys {
		if resp.Module != "" && !containsString(item.Modules, resp.Module) {
			continue
		}
		keys = append(keys, item.Key)
	}
	if len(keys) == 0 {
		return resp, nil
	}
	sort.Strings(keys)
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		query := tx.Where("`key` IN ?", keys)
		if resp.Module != "" {
			query = query.Where(I18nWhereModule, resp.Module)
		}
		deleteResult := query.Delete(&SystemI18n{})
		if deleteResult.Error != nil {
			return deleteResult.Error
		}
		resp.Deleted = deleteResult.RowsAffected
		return nil
	}); err != nil {
		return nil, err
	}
	resp.Keys = keys
	return resp, s.ReloadCache()
}

func (s *I18nService) StartUnusedObservation(module string) (*I18nUnusedLifecycleResp, error) {
	return s.transitionUnusedLifecycle(module, I18nLifecycleStatusActive, I18nLifecycleStatusObserving, false)
}

func (s *I18nService) StartUnusedObservationByKeyPrefixes(module string, prefixes []string) (*I18nUnusedLifecycleResp, error) {
	normalizedPrefixes := make([]string, 0, len(prefixes))
	for _, prefix := range prefixes {
		trimmed := strings.TrimSpace(prefix)
		if trimmed == "" {
			continue
		}
		normalizedPrefixes = append(normalizedPrefixes, trimmed)
	}
	if len(normalizedPrefixes) == 0 {
		return &I18nUnusedLifecycleResp{
			Module:       strings.TrimSpace(module),
			AffectedKeys: make([]string, 0),
		}, nil
	}
	return s.transitionUnusedLifecycleWithFilter(module, I18nLifecycleStatusActive, I18nLifecycleStatusObserving, func(item I18nUnusedKeyItem) bool {
		for _, prefix := range normalizedPrefixes {
			if item.Key == prefix || strings.HasPrefix(item.Key, prefix+".") {
				return true
			}
		}
		return false
	})
}

func (s *I18nService) ArchiveObservedUnusedKeys(module string) (*I18nUnusedLifecycleResp, error) {
	audit, err := s.GetAudit()
	if err != nil {
		return nil, err
	}
	resp := &I18nUnusedLifecycleResp{
		Module:       strings.TrimSpace(module),
		AffectedKeys: make([]string, 0),
	}
	if s.db == nil {
		return resp, nil
	}
	type target struct {
		module string
		key    string
	}
	targets := make([]target, 0)
	for _, item := range audit.UnusedKeys {
		if resp.Module != "" && item.Module != resp.Module {
			continue
		}
		if item.EligibleForArchive {
			targets = append(targets, target{module: item.Module, key: item.Key})
			resp.AffectedKeys = append(resp.AffectedKeys, item.Key)
		}
	}
	if len(targets) == 0 {
		return resp, nil
	}
	now := time.Now()
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range targets {
			updateResult := tx.Model(&SystemI18n{}).
				Where("module = ? AND `key` = ?", item.module, item.key).
				Updates(map[string]interface{}{
					"lifecycle_status":    I18nLifecycleStatusArchived,
					"lifecycle_marked_at": now,
				})
			if updateResult.Error != nil {
				return updateResult.Error
			}
			resp.AffectedRows += updateResult.RowsAffected
		}
		return nil
	}); err != nil {
		return nil, err
	}
	sort.Strings(resp.AffectedKeys)
	return resp, s.ReloadCache()
}

func (s *I18nService) DeleteArchivedUnusedKeys(module string, confirmArchived bool) (*I18nUnusedLifecycleResp, error) {
	if !confirmArchived {
		return nil, errors.New("i18n.lifecycle.delete.confirm_required")
	}
	return s.deleteArchivedUnusedKeys(module, false)
}

func (s *I18nService) DeleteExpiredArchivedUnusedKeys(module string) (*I18nUnusedLifecycleResp, error) {
	return s.deleteArchivedUnusedKeys(module, true)
}

func (s *I18nService) deleteArchivedUnusedKeys(module string, requireEligible bool) (*I18nUnusedLifecycleResp, error) {
	audit, err := s.GetAudit()
	if err != nil {
		return nil, err
	}
	resp := &I18nUnusedLifecycleResp{
		Module:       strings.TrimSpace(module),
		AffectedKeys: make([]string, 0),
	}
	if s.db == nil {
		return resp, nil
	}
	type target struct {
		module string
		key    string
	}
	targets := make([]target, 0)
	for _, item := range audit.UnusedKeys {
		if resp.Module != "" && item.Module != resp.Module {
			continue
		}
		if requireEligible && !item.EligibleForDelete {
			continue
		}
		if item.LifecycleStatus == I18nLifecycleStatusArchived {
			targets = append(targets, target{module: item.Module, key: item.Key})
			resp.AffectedKeys = append(resp.AffectedKeys, item.Key)
		}
	}
	if len(targets) == 0 {
		return resp, nil
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range targets {
			deleteResult := tx.Where("module = ? AND `key` = ?", item.module, item.key).Delete(&SystemI18n{})
			if deleteResult.Error != nil {
				return deleteResult.Error
			}
			resp.AffectedRows += deleteResult.RowsAffected
		}
		return nil
	}); err != nil {
		return nil, err
	}
	sort.Strings(resp.AffectedKeys)
	return resp, s.ReloadCache()
}

func (s *I18nService) AdvanceUnusedLifecycle(module string) (*I18nUnusedLifecycleAdvanceResp, error) {
	resp := &I18nUnusedLifecycleAdvanceResp{
		Module:                         strings.TrimSpace(module),
		ObservedKeys:                   make([]string, 0),
		ArchivedKeys:                   make([]string, 0),
		DeletedKeys:                    make([]string, 0),
		ArchivedRetentionThresholdDays: I18nArchivedRetentionThresholdDays,
	}
	if s.db == nil {
		return resp, nil
	}

	observeResp, err := s.StartUnusedObservation(resp.Module)
	if err != nil {
		return nil, err
	}
	if observeResp != nil {
		resp.ObservedKeys = append(resp.ObservedKeys, observeResp.AffectedKeys...)
		resp.ObservedRows = observeResp.AffectedRows
	}

	archiveResp, err := s.ArchiveObservedUnusedKeys(resp.Module)
	if err != nil {
		return nil, err
	}
	if archiveResp != nil {
		resp.ArchivedKeys = append(resp.ArchivedKeys, archiveResp.AffectedKeys...)
		resp.ArchivedRows = archiveResp.AffectedRows
	}

	deleteResp, err := s.DeleteExpiredArchivedUnusedKeys(resp.Module)
	if err != nil {
		return nil, err
	}
	if deleteResp != nil {
		resp.DeletedKeys = append(resp.DeletedKeys, deleteResp.AffectedKeys...)
		resp.DeletedRows = deleteResp.AffectedRows
	}

	resp.ObservationOnly = resp.ObservedRows > 0 && resp.ArchivedRows == 0 && resp.DeletedRows == 0
	sort.Strings(resp.ObservedKeys)
	sort.Strings(resp.ArchivedKeys)
	sort.Strings(resp.DeletedKeys)
	return resp, nil
}

func (s *I18nService) PreviewRenameKey(req *I18nRenamePreviewReq) (*I18nRenamePreviewResp, error) {
	module := strings.TrimSpace(req.Module)
	oldKey := strings.TrimSpace(req.OldKey)
	newKey := strings.TrimSpace(req.NewKey)
	if module == "" || oldKey == "" || newKey == "" || oldKey == newKey {
		return nil, errors.New("i18n.rename.invalid")
	}

	resp := &I18nRenamePreviewResp{
		Module:                module,
		OldKey:                oldKey,
		NewKey:                newKey,
		AffectedLocales:       make([]string, 0),
		ExistingTargetLocales: make([]string, 0),
		ReferenceFiles:        make([]I18nKeyReferenceFile, 0),
	}
	if s.db == nil {
		return resp, common.ErrDatabaseNotInitialized
	}

	var sourceRows []SystemI18n
	if err := s.db.Where("module = ? AND `key` = ?", module, oldKey).Order(I18nSortLocaleASC).Find(&sourceRows).Error; err != nil {
		return nil, err
	}
	resp.AffectedRows = int64(len(sourceRows))
	if resp.AffectedRows == 0 {
		return nil, errors.New("i18n.rename.source_not_found")
	}
	for _, row := range sourceRows {
		resp.AffectedLocales = append(resp.AffectedLocales, row.Locale)
	}

	var targetRows []SystemI18n
	if err := s.db.Where("module = ? AND `key` = ?", module, newKey).Order(I18nSortLocaleASC).Find(&targetRows).Error; err != nil {
		return nil, err
	}
	resp.ExistingTargetRows = int64(len(targetRows))
	for _, row := range targetRows {
		resp.ExistingTargetLocales = append(resp.ExistingTargetLocales, row.Locale)
	}

	referenceFiles, err := scanI18nKeyReferenceFiles(oldKey, newKey, true)
	if err != nil {
		return nil, err
	}
	resp.ReferenceFiles = referenceFiles
	resp.RequiresCodeMigration = len(referenceFiles) > 0
	resp.CanExecute = resp.ExistingTargetRows == 0
	return resp, nil
}

func (s *I18nService) RenameKey(req *I18nRenameExecuteReq) (*I18nRenameExecuteResp, error) {
	preview, err := s.PreviewRenameKey(&I18nRenamePreviewReq{
		Module: req.Module,
		OldKey: req.OldKey,
		NewKey: req.NewKey,
	})
	if err != nil {
		return nil, err
	}
	if preview.ExistingTargetRows > 0 {
		return nil, errors.New("i18n.rename.target_exists")
	}
	if preview.RequiresCodeMigration && !req.ConfirmSourceUpdated {
		return nil, errors.New("i18n.rename.source_not_confirmed")
	}

	resp := &I18nRenameExecuteResp{
		Module:         preview.Module,
		OldKey:         preview.OldKey,
		NewKey:         preview.NewKey,
		RenamedLocales: append([]string(nil), preview.AffectedLocales...),
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		updateResult := tx.Model(&SystemI18n{}).
			Where("module = ? AND `key` = ?", preview.Module, preview.OldKey).
			Updates(map[string]interface{}{
				"key": preview.NewKey,
			})
		if updateResult.Error != nil {
			return updateResult.Error
		}
		resp.RenamedRows = updateResult.RowsAffected
		return nil
	}); err != nil {
		return nil, err
	}
	return resp, s.ReloadCache()
}

func (s *I18nService) ListSupportedLocales() ([]string, error) {
	locales := []string{"zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR"}
	if s.db == nil {
		return locales, nil
	}

	var rows []string
	if err := s.db.Model(&SystemI18n{}).Distinct("locale").Order(I18nSortLocaleASC).Pluck("locale", &rows).Error; err != nil {
		return nil, err
	}

	seen := make(map[string]struct{}, len(locales)+len(rows))
	normalized := make([]string, 0, len(locales)+len(rows))
	for _, locale := range append(locales, rows...) {
		value := strings.TrimSpace(locale)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		normalized = append(normalized, value)
	}
	sort.Strings(normalized)
	return normalized, nil
}

func (s *I18nService) GetOverview() (*I18nOverviewResp, error) {
	locales, err := s.ListSupportedLocales()
	if err != nil {
		return nil, err
	}

	resp := &I18nOverviewResp{
		Locales:  locales,
		Coverage: make([]I18nLocaleCoverage, 0, len(locales)),
	}
	if s.db == nil {
		return resp, nil
	}

	type overviewRow struct {
		Module string
		Group  string
		Key    string
		Locale string
		Value  string
	}
	var rows []overviewRow
	if err := s.db.Model(&SystemI18n{}).
		Select("module, group_name as `group`, `key`, locale, value").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	moduleSet := make(map[string]struct{})
	groupSet := make(map[string]struct{})
	keyLocaleSet := make(map[string]map[string]struct{}, len(rows))
	for _, row := range rows {
		module := strings.TrimSpace(row.Module)
		group := strings.TrimSpace(row.Group)
		key := strings.TrimSpace(row.Key)
		locale := strings.TrimSpace(row.Locale)
		value := strings.TrimSpace(row.Value)

		if module != "" {
			moduleSet[module] = struct{}{}
		}
		if group != "" {
			groupSet[group] = struct{}{}
		}
		if !hasEffectiveLocaleValue(locale, key, value) {
			resp.MissingValueCount++
		}
		resp.TotalEntries++

		if key == "" || locale == "" {
			continue
		}
		if _, ok := keyLocaleSet[key]; !ok {
			keyLocaleSet[key] = make(map[string]struct{}, len(locales))
		}
		if hasEffectiveLocaleValue(locale, key, value) {
			keyLocaleSet[key][locale] = struct{}{}
		}
	}
	resp.ModuleCount = int64(len(moduleSet))
	resp.GroupCount = int64(len(groupSet))
	resp.UniqueKeyCount = int64(len(keyLocaleSet))

	entryCountByLocale := make(map[string]int64, len(locales))
	missingByLocale := make(map[string]int64, len(locales))
	for key, localeSet := range keyLocaleSet {
		for _, locale := range locales {
			if _, ok := localeSet[locale]; !ok {
				if _, builtinOk := getBuiltinLocaleValue(locale, key); builtinOk {
					localeSet[locale] = struct{}{}
				}
			}
			if _, ok := localeSet[locale]; !ok {
				resp.MissingLocaleCount++
				missingByLocale[locale]++
				continue
			}
			entryCountByLocale[locale]++
		}
	}

	for _, locale := range locales {
		resp.Coverage = append(resp.Coverage, I18nLocaleCoverage{
			Locale:       locale,
			EntryCount:   entryCountByLocale[locale],
			MissingCount: missingByLocale[locale],
		})
	}

	return resp, nil
}

func (s *I18nService) ListMissingLocales(module string) (*I18nMissingLocaleResp, error) {
	locales, err := s.ListSupportedLocales()
	if err != nil {
		return nil, err
	}
	resp := &I18nMissingLocaleResp{
		Items: make([]I18nMissingLocaleItem, 0),
	}
	if s.db == nil {
		return resp, nil
	}

	rows, err := s.loadMissingLocaleRows(module)
	if err != nil {
		return nil, err
	}

	resp.Items = buildMissingLocaleItems(rows, locales)
	resp.Total = int64(len(resp.Items))
	return resp, nil
}

func (s *I18nService) loadMissingLocaleRows(module string) ([]i18nMissingLocaleRow, error) {
	var rows []i18nMissingLocaleRow
	query := s.db.Model(&SystemI18n{})
	module = strings.TrimSpace(module)
	if module != "" {
		query = query.Where(I18nWhereModule, module)
	}
	err := query.
		Select("module, group_name as `group`, `key`, locale").
		Order(I18nSortModuleASC).
		Order(I18nSortGroupNameASC).
		Order(I18nSortKeyASC).
		Find(&rows).Error
	return rows, err
}

func buildMissingLocaleItems(rows []i18nMissingLocaleRow, locales []string) []I18nMissingLocaleItem {
	keyMap := buildMissingLocaleKeyMap(rows, locales)
	keys := sortedMissingLocaleKeys(keyMap)
	items := make([]I18nMissingLocaleItem, 0, len(keys))
	for _, key := range keys {
		if item, ok := buildMissingLocaleItem(key, keyMap[key], locales); ok {
			items = append(items, item)
		}
	}
	return items
}

func buildMissingLocaleKeyMap(rows []i18nMissingLocaleRow, locales []string) map[string]*i18nMissingLocaleMeta {
	keyMap := make(map[string]*i18nMissingLocaleMeta, len(rows))
	for _, item := range rows {
		key := strings.TrimSpace(item.Key)
		if key == "" {
			continue
		}
		meta := ensureMissingLocaleMeta(keyMap, item, key, locales)
		locale := strings.TrimSpace(item.Locale)
		if locale != "" {
			meta.locales[locale] = struct{}{}
		}
	}
	return keyMap
}

func ensureMissingLocaleMeta(
	keyMap map[string]*i18nMissingLocaleMeta,
	item i18nMissingLocaleRow,
	key string,
	locales []string,
) *i18nMissingLocaleMeta {
	meta, ok := keyMap[key]
	if ok {
		return meta
	}
	meta = &i18nMissingLocaleMeta{
		module:  strings.TrimSpace(item.Module),
		group:   strings.TrimSpace(item.Group),
		locales: make(map[string]struct{}, len(locales)),
	}
	keyMap[key] = meta
	return meta
}

func sortedMissingLocaleKeys(keyMap map[string]*i18nMissingLocaleMeta) []string {
	keys := make([]string, 0, len(keyMap))
	for key := range keyMap {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func buildMissingLocaleItem(key string, meta *i18nMissingLocaleMeta, locales []string) (I18nMissingLocaleItem, bool) {
	missing := collectMissingLocales(key, meta.locales, locales)
	if len(missing) == 0 {
		return I18nMissingLocaleItem{}, false
	}
	return I18nMissingLocaleItem{
		Module:         meta.module,
		Group:          meta.group,
		Key:            key,
		MissingLocales: missing,
	}, true
}

func collectMissingLocales(key string, presentLocales map[string]struct{}, locales []string) []string {
	missing := make([]string, 0, len(locales))
	for _, locale := range locales {
		if _, ok := presentLocales[locale]; ok {
			continue
		}
		if _, builtinOk := getBuiltinLocaleValue(locale, key); builtinOk {
			continue
		}
		missing = append(missing, locale)
	}
	return missing
}

func (s *I18nService) FillMissingLocales(module string) (*I18nFillMissingLocaleResp, error) {
	missing, err := s.ListMissingLocales(module)
	if err != nil {
		return nil, err
	}

	resp := &I18nFillMissingLocaleResp{
		Locales: make([]string, 0),
		Keys:    make([]string, 0),
	}
	if s.db == nil || missing.Total == 0 {
		return resp, nil
	}

	localeSet := make(map[string]struct{})
	keySet := make(map[string]struct{})
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range missing.Items {
			for _, locale := range item.MissingLocales {
				value := "[" + item.Key + "]"
				if builtinValue, ok := getBuiltinLocaleValue(locale, item.Key); ok {
					value = builtinValue
				}
				if err := tx.Create(&SystemI18n{
					Module: item.Module,
					Group:  item.Group,
					Key:    item.Key,
					Locale: locale,
					Value:  value,
				}).Error; err != nil {
					return err
				}
				resp.Created++
				localeSet[locale] = struct{}{}
				keySet[item.Key] = struct{}{}
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}

	for locale := range localeSet {
		resp.Locales = append(resp.Locales, locale)
	}
	for key := range keySet {
		resp.Keys = append(resp.Keys, key)
	}
	sort.Strings(resp.Locales)
	sort.Strings(resp.Keys)
	return resp, s.ReloadCache()
}

func (s *I18nService) HydrateBuiltinLocales(module string) (*I18nHydrateBuiltinResp, error) {
	module = strings.TrimSpace(module)
	resp := &I18nHydrateBuiltinResp{
		Locales: make([]string, 0),
		Keys:    make([]string, 0),
	}
	if s.db == nil {
		return resp, nil
	}

	rows, err := s.loadHydrateBuiltinLocaleRows(module)
	if err != nil {
		return nil, err
	}

	missing, err := s.ListMissingLocales(module)
	if err != nil {
		return nil, err
	}

	localeSet := make(map[string]struct{})
	keySet := make(map[string]struct{})
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		return hydrateBuiltinLocaleRows(tx, rows, missing.Items, resp, localeSet, keySet)
	}); err != nil {
		return nil, err
	}

	for locale := range localeSet {
		resp.Locales = append(resp.Locales, locale)
	}
	for key := range keySet {
		resp.Keys = append(resp.Keys, key)
	}
	sort.Strings(resp.Locales)
	sort.Strings(resp.Keys)
	return resp, s.ReloadCache()
}

func (s *I18nService) loadHydrateBuiltinLocaleRows(module string) ([]i18nHydrateBuiltinLocaleRow, error) {
	var rows []i18nHydrateBuiltinLocaleRow
	query := s.db.Model(&SystemI18n{}).Select("id, module, group_name as `group`, `key`, locale, value")
	if module != "" {
		query = query.Where(I18nWhereModule, module)
	}
	err := query.
		Order(I18nSortModuleASC).
		Order(I18nSortGroupNameASC).
		Order(I18nSortKeyASC).
		Order(I18nSortLocaleASC).
		Find(&rows).Error
	return rows, err
}

func hydrateBuiltinLocaleRows(
	tx *gorm.DB,
	rows []i18nHydrateBuiltinLocaleRow,
	missingItems []I18nMissingLocaleItem,
	resp *I18nHydrateBuiltinResp,
	localeSet map[string]struct{},
	keySet map[string]struct{},
) error {
	if err := updateStoredBuiltinLocaleRows(tx, rows, resp, localeSet, keySet); err != nil {
		return err
	}
	return createMissingBuiltinLocaleRows(tx, missingItems, resp, localeSet, keySet)
}

func updateStoredBuiltinLocaleRows(
	tx *gorm.DB,
	rows []i18nHydrateBuiltinLocaleRow,
	resp *I18nHydrateBuiltinResp,
	localeSet map[string]struct{},
	keySet map[string]struct{},
) error {
	for _, item := range rows {
		if hasStoredLocaleValue(item.Value) {
			continue
		}
		builtinValue, ok := getBuiltinLocaleValue(item.Locale, item.Key)
		if !ok {
			continue
		}
		if err := tx.Model(&SystemI18n{}).Where("id = ?", item.ID).Update("value", builtinValue).Error; err != nil {
			return err
		}
		resp.Updated++
		localeSet[item.Locale] = struct{}{}
		keySet[item.Key] = struct{}{}
	}
	return nil
}

func createMissingBuiltinLocaleRows(
	tx *gorm.DB,
	missingItems []I18nMissingLocaleItem,
	resp *I18nHydrateBuiltinResp,
	localeSet map[string]struct{},
	keySet map[string]struct{},
) error {
	for _, item := range missingItems {
		if err := createMissingBuiltinLocaleItemRows(tx, item, resp, localeSet, keySet); err != nil {
			return err
		}
	}
	return nil
}

func createMissingBuiltinLocaleItemRows(
	tx *gorm.DB,
	item I18nMissingLocaleItem,
	resp *I18nHydrateBuiltinResp,
	localeSet map[string]struct{},
	keySet map[string]struct{},
) error {
	for _, locale := range item.MissingLocales {
		builtinValue, ok := getBuiltinLocaleValue(locale, item.Key)
		if !ok {
			continue
		}
		if err := tx.Create(&SystemI18n{
			Module: item.Module,
			Group:  item.Group,
			Key:    item.Key,
			Locale: locale,
			Value:  builtinValue,
		}).Error; err != nil {
			return err
		}
		resp.Created++
		localeSet[locale] = struct{}{}
		keySet[item.Key] = struct{}{}
	}
	return nil
}

func resolveI18nScanRoots() []string {
	seen := map[string]struct{}{}
	roots := make([]string, 0, 2)
	appendRoot := func(root string) {
		normalized := strings.TrimSpace(filepath.Clean(root))
		if normalized == "" {
			return
		}
		if _, ok := seen[normalized]; ok {
			return
		}
		seen[normalized] = struct{}{}
		roots = append(roots, normalized)
	}

	if configuredRoot := strings.TrimSpace(os.Getenv("PANTHEON_WORKSPACE_ROOT")); configuredRoot != "" {
		backendRoot := filepath.Join(configuredRoot, "backend")
		frontendRoot := filepath.Join(configuredRoot, "frontend")
		if dirExists(backendRoot) && dirExists(frontendRoot) {
			appendRoot(backendRoot)
			appendRoot(frontendRoot)
			return roots
		}
	}

	base := ""
	if cwd, err := os.Getwd(); err == nil {
		base = cwd
	}
	if base == "" {
		_, currentFile, _, ok := runtime.Caller(0)
		if ok {
			base = currentFile
		}
	}
	if base == "" {
		appendRoot("backend")
		appendRoot("frontend")
		return roots
	}

	current := base
	if info, err := os.Stat(current); err == nil && !info.IsDir() {
		current = filepath.Dir(current)
	}
	for {
		backendRoot := filepath.Join(current, "backend")
		frontendRoot := filepath.Join(current, "frontend")
		if dirExists(backendRoot) && dirExists(frontendRoot) {
			appendRoot(backendRoot)
			appendRoot(frontendRoot)
			return roots
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}

	appendRoot(filepath.Join(base, "backend"))
	appendRoot(filepath.Join(base, "frontend"))
	return roots
}

func scanI18nKeys(excludeCatalog bool) ([]string, error) {
	re := regexp.MustCompile("[\"'`]([A-Za-z0-9_]+\\.[A-Za-z0-9_\\.]+)[\"'`]")
	keyMap := make(map[string]struct{})
	for _, root := range resolveI18nScanRoots() {
		if err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil || info == nil || info.IsDir() {
				return nil
			}
			ext := strings.ToLower(filepath.Ext(path))
			if ext != ".go" && ext != ".ts" && ext != ".tsx" {
				return nil
			}
			if excludeCatalog && isIgnoredI18nUsageFile(path) {
				return nil
			}
			content, readErr := os.ReadFile(path)
			if readErr != nil {
				return nil
			}
			for _, m := range re.FindAllStringSubmatch(string(content), -1) {
				key := strings.TrimSpace(m[1])
				if !isLikelyI18nKey(key) {
					continue
				}
				keyMap[key] = struct{}{}
			}
			return nil
		}); err != nil {
			return nil, err
		}
	}
	keys := make([]string, 0, len(keyMap))
	for key := range keyMap {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys, nil
}

var (
	i18nKeySegmentPattern = regexp.MustCompile("^[A-Za-z0-9_]+$")
	i18nKeyLetterPattern  = regexp.MustCompile("[A-Za-z]")
)

func isLikelyI18nKey(key string) bool {
	normalized := strings.TrimSpace(key)
	if normalized == "" || !i18nKeyLetterPattern.MatchString(normalized) {
		return false
	}

	segments := strings.Split(normalized, ".")
	if len(segments) < 2 {
		return false
	}
	first := strings.TrimSpace(segments[0])
	if first == "" {
		return false
	}
	firstRune := rune(first[0])
	if !((firstRune >= 'a' && firstRune <= 'z') || (firstRune >= 'A' && firstRune <= 'Z')) {
		return false
	}

	for _, segment := range segments {
		trimmed := strings.TrimSpace(segment)
		if trimmed == "" || !i18nKeySegmentPattern.MatchString(trimmed) {
			return false
		}
	}

	last := strings.ToLower(segments[len(segments)-1])
	switch last {
	case "go", "ts", "tsx", "js", "jsx", "json", "csv", "txt", "png", "gif", "jpg", "jpeg", "svg", "ico", "css", "scss", "less", "html", "map", "md", "yml", "yaml":
		return false
	}

	if len(segments) <= 3 {
		switch first {
		case "db", "api", "www", "mail", "smtp", "cdn", "img", "static", "files", "localhost":
			switch last {
			case "com", "net", "org", "io", "cn", "dev", "app", "local", "internal", "lan":
				return false
			}
		}
	}

	return true
}

func scanI18nKeyReferenceFiles(targetKey string, newKey string, excludeCatalog bool) ([]I18nKeyReferenceFile, error) {
	normalizedTarget := strings.TrimSpace(targetKey)
	if normalizedTarget == "" {
		return []I18nKeyReferenceFile{}, nil
	}
	results := make([]I18nKeyReferenceFile, 0)
	for _, root := range resolveI18nScanRoots() {
		if err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil || info == nil || info.IsDir() {
				return nil
			}
			ext := strings.ToLower(filepath.Ext(path))
			if ext != ".go" && ext != ".ts" && ext != ".tsx" {
				return nil
			}
			if excludeCatalog && isIgnoredI18nUsageFile(path) {
				return nil
			}
			content, readErr := os.ReadFile(path)
			if readErr != nil {
				return nil
			}
			text := string(content)
			if !strings.Contains(text, normalizedTarget) {
				return nil
			}
			relativePath := path
			if cwd, cwdErr := os.Getwd(); cwdErr == nil {
				if rel, relErr := filepath.Rel(cwd, path); relErr == nil {
					relativePath = filepath.ToSlash(rel)
				}
			}
			matches := buildI18nKeyReferenceMatches(text, normalizedTarget, strings.TrimSpace(newKey))
			results = append(results, I18nKeyReferenceFile{
				Path:                 relativePath,
				MatchCount:           len(matches),
				SuggestedReplacement: strings.TrimSpace(newKey),
				Matches:              matches,
			})
			return nil
		}); err != nil {
			return nil, err
		}
	}
	sort.Slice(results, func(i, j int) bool { return results[i].Path < results[j].Path })
	return results, nil
}

func buildI18nKeyReferenceMatches(content, oldKey, newKey string) []I18nKeyReferenceMatch {
	lines := strings.Split(content, "\n")
	matches := make([]I18nKeyReferenceMatch, 0)
	for index, line := range lines {
		searchStart := 0
		for {
			offset := strings.Index(line[searchStart:], oldKey)
			if offset < 0 {
				break
			}
			column := searchStart + offset + 1
			snippet := strings.TrimSpace(line)
			replacementHint := snippet
			if newKey != "" {
				replacementHint = strings.ReplaceAll(snippet, oldKey, newKey)
			}
			matches = append(matches, I18nKeyReferenceMatch{
				Line:            index + 1,
				Column:          column,
				Snippet:         snippet,
				ReplacementHint: replacementHint,
			})
			searchStart += offset + len(oldKey)
		}
	}
	return matches
}

func isIgnoredI18nUsageFile(path string) bool {
	normalized := filepath.ToSlash(strings.TrimSpace(path))
	if strings.Contains(normalized, "/frontend/node_modules/") ||
		strings.Contains(normalized, "/frontend/dist/") ||
		strings.Contains(normalized, "/frontend/test-results/") ||
		strings.Contains(normalized, "/frontend/playwright-report/") ||
		strings.Contains(normalized, "/frontend/artifacts/") {
		return true
	}
	if strings.HasSuffix(normalized, "_test.go") ||
		strings.HasSuffix(normalized, ".spec.ts") ||
		strings.HasSuffix(normalized, ".spec.tsx") ||
		strings.Contains(normalized, "/frontend/tests/") {
		return true
	}
	return strings.HasSuffix(normalized, "/frontend/src/i18n/index.ts") ||
		strings.Contains(normalized, "/frontend/src/i18n/resources/") ||
		strings.HasSuffix(normalized, "/backend/modules/system/i18n/seed_data.go")
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func sortedSetKeys(values map[string]struct{}) []string {
	items := make([]string, 0, len(values))
	for value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		items = append(items, value)
	}
	sort.Strings(items)
	return items
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func allValuesMissing(values map[string]struct{}) bool {
	if len(values) == 0 {
		return true
	}
	for value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" && !strings.HasPrefix(trimmed, "[") {
			return false
		}
	}
	return true
}

func suggestScopedI18nKey(module, key string) string {
	normalizedModule := strings.TrimSpace(module)
	normalizedKey := strings.TrimSpace(key)
	if normalizedModule == "" || normalizedKey == "" {
		return normalizedKey
	}
	prefix := normalizedModule + "."
	if strings.HasPrefix(normalizedKey, prefix) {
		return normalizedKey
	}
	return prefix + normalizedKey
}

func normalizeI18nLifecycleStatus(status string) string {
	switch strings.TrimSpace(status) {
	case I18nLifecycleStatusObserving:
		return I18nLifecycleStatusObserving
	case I18nLifecycleStatusArchived:
		return I18nLifecycleStatusArchived
	default:
		return I18nLifecycleStatusActive
	}
}

func (s *I18nService) resetI18nLifecycle(_ string, module, key string) error {
	return s.db.Model(&SystemI18n{}).
		Where("module = ? AND `key` = ?", module, key).
		Updates(map[string]interface{}{
			"lifecycle_status":    I18nLifecycleStatusActive,
			"lifecycle_marked_at": nil,
		}).Error
}

func (s *I18nService) transitionUnusedLifecycle(module string, fromStatus string, toStatus string, requireConfirm bool) (*I18nUnusedLifecycleResp, error) {
	if requireConfirm {
		return nil, errors.New("i18n.lifecycle.transition.invalid")
	}
	return s.transitionUnusedLifecycleWithFilter(module, fromStatus, toStatus, nil)
}

func (s *I18nService) transitionUnusedLifecycleWithFilter(module string, fromStatus string, toStatus string, filter func(I18nUnusedKeyItem) bool) (*I18nUnusedLifecycleResp, error) {
	audit, err := s.GetAudit()
	if err != nil {
		return nil, err
	}
	resp := &I18nUnusedLifecycleResp{
		Module:       strings.TrimSpace(module),
		AffectedKeys: make([]string, 0),
	}
	if s.db == nil {
		return resp, nil
	}
	type target struct {
		module string
		key    string
	}
	targets := make([]target, 0)
	for _, item := range audit.UnusedKeys {
		if resp.Module != "" && item.Module != resp.Module {
			continue
		}
		if filter != nil && !filter(item) {
			continue
		}
		if normalizeI18nLifecycleStatus(item.LifecycleStatus) == fromStatus {
			targets = append(targets, target{module: item.Module, key: item.Key})
			resp.AffectedKeys = append(resp.AffectedKeys, item.Key)
		}
	}
	if len(targets) == 0 {
		return resp, nil
	}
	now := time.Now()
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range targets {
			updateResult := tx.Model(&SystemI18n{}).
				Where("module = ? AND `key` = ?", item.module, item.key).
				Updates(map[string]interface{}{
					"lifecycle_status":    toStatus,
					"lifecycle_marked_at": now,
				})
			if updateResult.Error != nil {
				return updateResult.Error
			}
			resp.AffectedRows += updateResult.RowsAffected
		}
		return nil
	}); err != nil {
		return nil, err
	}
	sort.Strings(resp.AffectedKeys)
	return resp, s.ReloadCache()
}

func normalizeI18nQuery(query *I18nQuery) *I18nQuery {
	if query == nil {
		query = &I18nQuery{}
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}
	if query.PageSize > 200 {
		query.PageSize = 200
	}
	query.Module = strings.TrimSpace(query.Module)
	query.Group = strings.TrimSpace(query.Group)
	query.Locale = strings.TrimSpace(query.Locale)
	query.Key = strings.TrimSpace(query.Key)
	query.SortBy = strings.TrimSpace(query.SortBy)
	query.SortOrder = strings.TrimSpace(query.SortOrder)
	return query
}

func cloneLangPack(pack map[string]string) map[string]string {
	cloned := make(map[string]string, len(pack))
	for key, value := range pack {
		cloned[key] = value
	}
	return cloned
}
