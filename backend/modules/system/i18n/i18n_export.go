package system

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
)

type i18nImportRow struct {
	module string
	group  string
	key    string
	locale string
	value  string
	remark string
}

type i18nValidatedImportRow struct {
	i18nImportRow
	rowNumber int
}

func (s *I18nService) Export(query *I18nQuery) (*impexp.CSVFile, error) {
	query = normalizeI18nQuery(query)

	rows, err := s.loadExportRows(query)
	if err != nil {
		return nil, err
	}

	return buildI18nExportCSV(rows), nil
}

func (s *I18nService) loadExportRows(query *I18nQuery) ([]SystemI18n, error) {
	var rows []SystemI18n
	err := applyI18nExportFilters(s.db.Model(&SystemI18n{}), query).
		Order(I18nSortLocaleASC).
		Order(I18nSortModuleASC).
		Order(I18nSortKeyASC).
		Find(&rows).Error
	return rows, err
}

func applyI18nExportFilters(db *gorm.DB, query *I18nQuery) *gorm.DB {
	if query.Module != "" {
		db = db.Where(I18nWhereModule, query.Module)
	}
	if query.Group != "" {
		db = db.Where("group_name = ?", query.Group)
	}
	if query.Locale != "" {
		db = db.Where("locale = ?", query.Locale)
	}
	if query.Key != "" {
		db = db.Where("`key` LIKE ?", "%"+query.Key+"%")
	}
	return db
}

func buildI18nExportCSV(rows []SystemI18n) *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "system-i18n-export.csv",
		Headers:  []string{"module", "group", "key", "locale", "value", "remark", "createdAt", "updatedAt"},
		Rows:     buildI18nExportRows(rows),
	}
}

func buildI18nExportRows(rows []SystemI18n) [][]string {
	result := make([][]string, 0, len(rows))
	for _, row := range rows {
		result = append(result, buildI18nExportRow(row))
	}
	return result
}

func buildI18nExportRow(row SystemI18n) []string {
	return []string{
		row.Module,
		row.Group,
		row.Key,
		row.Locale,
		row.Value,
		row.Remark,
		formatI18nCSVTime(row.CreatedAt),
		formatI18nCSVTime(row.UpdatedAt),
	}
}

func formatI18nCSVTime(value time.Time) string {
	return value.Format("2006-01-02 15:04:05")
}

func (s *I18nService) BuildImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "system-i18n-import-template.csv",
		Headers:  []string{"module", "group", "key", "locale", "value", "remark"},
		Rows: [][]string{
			{"#说明：保留第一行表头；group 为空时默认 messages；module/key/locale/value 必填；已存在记录按 locale + key 更新 value/remark/group；若 module 与现有记录归属不一致，该行会被阻断。", "", "", "", "", ""},
			{"system.config", "messages", "i18n.sample.key", "zh-CN", "示例文案", "sample"},
			{"system.config", "messages", "i18n.sample.key", "en-US", "Sample Text", "sample"},
		},
	}
}

func (s *I18nService) Import(records [][]string) (*impexp.ImportResult, error) {
	result := &impexp.ImportResult{
		Applied: false,
		Errors:  []impexp.ImportError{},
	}
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	if len(records) == 0 {
		impexp.AppendImportError(result, 0, "file", "import.file.empty")
		return result, nil
	}

	headerIndex := buildI18nImportHeaderIndex(records[0])
	validateI18nImportHeaders(result, headerIndex)
	if result.Failed > 0 {
		return result, nil
	}

	rows := parseI18nImportRows(records, headerIndex, result)
	if result.Failed > 0 {
		return result, nil
	}

	if err := s.applyI18nImportRows(rows, result); err != nil {
		return nil, err
	}

	result.Applied = result.Created > 0 || result.Updated > 0
	return result, s.ReloadCache()
}

func buildI18nImportHeaderIndex(headers []string) map[string]int {
	headerIndex := make(map[string]int, len(headers))
	for index, header := range headers {
		headerIndex[strings.TrimSpace(header)] = index
	}
	return headerIndex
}

func validateI18nImportHeaders(result *impexp.ImportResult, headerIndex map[string]int) {
	for _, header := range []string{"module", "group", "key", "locale", "value", "remark"} {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
}

func parseI18nImportRows(records [][]string, headerIndex map[string]int, result *impexp.ImportResult) []i18nValidatedImportRow {
	rows := make([]i18nValidatedImportRow, 0, len(records)-1)
	seen := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		if impexp.IsCSVRecordEmpty(records[rowIndex]) || impexp.IsCSVRecordBlank(records[rowIndex]) {
			continue
		}
		rowNumber := rowIndex + 1
		row := readI18nImportRow(records[rowIndex], headerIndex)
		validateI18nImportRow(result, row, rowNumber, seen)
		rows = append(rows, i18nValidatedImportRow{i18nImportRow: row, rowNumber: rowNumber})
	}
	return rows
}

func readI18nImportRow(record []string, headerIndex map[string]int) i18nImportRow {
	row := i18nImportRow{
		module: strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "module")),
		group:  strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "group")),
		key:    strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "key")),
		locale: strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "locale")),
		value:  strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "value")),
		remark: strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "remark")),
	}
	if row.group == "" {
		row.group = "messages"
	}
	return row
}

func validateI18nImportRow(result *impexp.ImportResult, row i18nImportRow, rowNumber int, seen map[string]int) {
	appendMissingI18nImportFieldErrors(result, row, rowNumber)
	duplicateKey := fmt.Sprintf("%s|%s|%s", row.module, row.key, row.locale)
	if firstRow, ok := seen[duplicateKey]; ok {
		impexp.AppendImportError(result, rowNumber, "key", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		return
	}
	seen[duplicateKey] = rowNumber
}

func appendMissingI18nImportFieldErrors(result *impexp.ImportResult, row i18nImportRow, rowNumber int) {
	if row.module == "" {
		impexp.AppendImportError(result, rowNumber, "module", "i18n.module.required")
	}
	if row.key == "" {
		impexp.AppendImportError(result, rowNumber, "key", "i18n.key.required")
	}
	if row.locale == "" {
		impexp.AppendImportError(result, rowNumber, "locale", "i18n.locale.required")
	}
	if row.value == "" {
		impexp.AppendImportError(result, rowNumber, "value", "i18n.value.required")
	}
}

func (s *I18nService) applyI18nImportRows(rows []i18nValidatedImportRow, result *impexp.ImportResult) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if err := applyI18nImportRow(tx, row, result); err != nil {
				return err
			}
		}
		return nil
	})
}

func applyI18nImportRow(tx *gorm.DB, row i18nValidatedImportRow, result *impexp.ImportResult) error {
	var existing SystemI18n
	err := tx.Where("locale = ? AND `key` = ?", row.locale, row.key).First(&existing).Error
	switch {
	case err == nil:
		return updateExistingI18nImportRow(tx, existing, row, result)
	case errors.Is(err, gorm.ErrRecordNotFound):
		return createI18nImportRow(tx, row, result)
	default:
		return err
	}
}

func updateExistingI18nImportRow(tx *gorm.DB, existing SystemI18n, row i18nValidatedImportRow, result *impexp.ImportResult) error {
	if strings.TrimSpace(existing.Module) != "" && strings.TrimSpace(existing.Module) != row.module {
		impexp.AppendImportError(result, row.rowNumber, "module", fmt.Sprintf("import.conflict.owner.%s", existing.Module))
		return nil
	}
	if err := tx.Model(&existing).Updates(map[string]interface{}{
		"module":     row.module,
		"group_name": row.group,
		"value":      row.value,
		"remark":     row.remark,
	}).Error; err != nil {
		return err
	}
	result.Updated++
	return nil
}

func createI18nImportRow(tx *gorm.DB, row i18nValidatedImportRow, result *impexp.ImportResult) error {
	if err := tx.Create(&SystemI18n{
		Module: row.module,
		Group:  row.group,
		Key:    row.key,
		Locale: row.locale,
		Value:  row.value,
		Remark: row.remark,
	}).Error; err != nil {
		return err
	}
	result.Created++
	return nil
}
