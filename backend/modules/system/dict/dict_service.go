package system

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DictService struct {
	db            *gorm.DB
	optionCache   map[string][]DictOptionResp
	optionCacheMu sync.RWMutex
}

const (
	deletedDictTypeCodePrefix  = "__deleted_dict_type_"
	deletedDictItemValuePrefix = "__deleted_dict_item_"
)

type dictTypeSeed struct {
	DictCode string
	DictName string
	Module   string
	Status   int
	Remark   string
}

type dictItemSeed struct {
	DictCode     string
	ItemLabelKey string
	ItemValue    string
	ItemColor    string
	Sort         int
	Status       int
	Remark       string
}

var defaultDictTypeSeeds = []dictTypeSeed{
	{DictCode: "system_yes_no", DictName: "system.dict.seed.system_yes_no", Module: "system", Status: 1, Remark: "system.dict.remark.system_yes_no"},
	{DictCode: "system_user_status", DictName: "system.dict.seed.system_user_status", Module: "system", Status: 1, Remark: "system.dict.remark.system_user_status"},
}

var defaultDictItemSeeds = []dictItemSeed{
	{DictCode: "system_yes_no", ItemLabelKey: "dict.system_yes_no.yes", ItemValue: "1", ItemColor: "green", Sort: 1, Status: 1},
	{DictCode: "system_yes_no", ItemLabelKey: "dict.system_yes_no.no", ItemValue: "0", ItemColor: "gray", Sort: 2, Status: 1},
	{DictCode: "system_user_status", ItemLabelKey: "dict.system_user_status.enabled", ItemValue: "1", ItemColor: "green", Sort: 1, Status: 1},
	{DictCode: "system_user_status", ItemLabelKey: "dict.system_user_status.disabled", ItemValue: "2", ItemColor: "red", Sort: 2, Status: 1},
}

func NewDictService(db *gorm.DB) *DictService {
	return &DictService{
		db:          db,
		optionCache: make(map[string][]DictOptionResp),
	}
}

func (s *DictService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&SystemDictType{}, &SystemDictItem{}); err != nil {
		return err
	}
	if err := s.releaseDeletedDictTypeCodes(); err != nil {
		return err
	}
	if err := s.releaseDeletedDictItemValues(); err != nil {
		return err
	}

	for _, item := range defaultDictTypeSeeds {
		var count int64
		if err := s.db.Model(&SystemDictType{}).Where("dict_code = ?", item.DictCode).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := s.db.Create(&SystemDictType{
			DictCode: item.DictCode,
			DictName: item.DictName,
			Module:   item.Module,
			Status:   normalizeDictStatus(item.Status),
			Remark:   item.Remark,
		}).Error; err != nil {
			return err
		}
	}

	for _, item := range defaultDictItemSeeds {
		var count int64
		if err := s.db.Model(&SystemDictItem{}).
			Where("dict_code = ? AND item_value = ?", item.DictCode, item.ItemValue).
			Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := s.db.Create(&SystemDictItem{
			DictCode:     item.DictCode,
			ItemLabelKey: item.ItemLabelKey,
			ItemValue:    item.ItemValue,
			ItemColor:    item.ItemColor,
			Sort:         item.Sort,
			Status:       normalizeDictStatus(item.Status),
			Remark:       item.Remark,
		}).Error; err != nil {
			return err
		}
	}

	return nil
}

func (s *DictService) ListDictTypes(query *DictTypeListQuery) ([]DictTypeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var rows []SystemDictType
	db := s.db.Model(&SystemDictType{})
	if query != nil {
		if strings.TrimSpace(query.DictCode) != "" {
			db = db.Where("dict_code LIKE ?", "%"+strings.TrimSpace(query.DictCode)+"%")
		}
		if strings.TrimSpace(query.DictName) != "" {
			db = db.Where("dict_name LIKE ?", "%"+strings.TrimSpace(query.DictName)+"%")
		}
		if query.Status != nil && (*query.Status == 1 || *query.Status == 2) {
			db = db.Where("status = ?", *query.Status)
		}
	}

	if err := db.Order("module asc, id asc").Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([]DictTypeResp, 0, len(rows))
	for _, item := range rows {
		result = append(result, toDictTypeResp(item))
	}
	return result, nil
}

func (s *DictService) CreateDictType(req *DictTypeCreateReq) (*DictTypeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateDictType(0, req.DictCode); err != nil {
		return nil, err
	}

	row := SystemDictType{
		DictCode: strings.TrimSpace(req.DictCode),
		DictName: strings.TrimSpace(req.DictName),
		Module:   normalizeDictModule(req.Module),
		Status:   normalizeDictStatus(req.Status),
		Remark:   strings.TrimSpace(req.Remark),
	}
	if err := s.db.Create(&row).Error; err != nil {
		return nil, err
	}
	s.invalidateDictOptionCache(row.DictCode)
	resp := toDictTypeResp(row)
	return &resp, nil
}

func (s *DictService) ExportDictTypes(query *DictTypeListQuery) (*impexp.CSVFile, error) {
	rows, err := s.ListDictTypes(query)
	if err != nil {
		return nil, err
	}
	result := make([][]string, 0, len(rows))
	for _, row := range rows {
		result = append(result, []string{
			row.DictCode,
			row.DictName,
			row.Module,
			fmt.Sprintf("%d", row.Status),
			row.Remark,
		})
	}
	return &impexp.CSVFile{
		Filename: "system-dict-type-export.csv",
		Headers:  []string{"dictCode", "dictName", "module", "status", "remark"},
		Rows:     result,
	}, nil
}

func (s *DictService) BuildDictTypeImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "system-dict-type-import-template.csv",
		Headers:  []string{"dictCode", "dictName", "module", "status", "remark"},
		Rows: [][]string{
			{"#说明：保留第一行表头；dictCode 是稳定唯一编码；module 建议填写 system 或 business.xxx；status 使用 1=启用、2=禁用。", "", "", "", ""},
			{"#biz_status", "业务状态", "business", "1", "业务通用状态字典"},
		},
	}
}

func (s *DictService) ImportDictTypes(records [][]string) (*impexp.ImportResult, error) {
	result := &impexp.ImportResult{Applied: false, Errors: []impexp.ImportError{}}
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if len(records) == 0 {
		impexp.AppendImportError(result, 0, "file", "import.file.empty")
		return result, nil
	}

	headerIndex := make(map[string]int, len(records[0]))
	for index, header := range records[0] {
		headerIndex[strings.TrimSpace(header)] = index
	}
	requiredHeaders := []string{"dictCode", "dictName", "module", "status", "remark"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
	if result.Failed > 0 {
		return result, nil
	}

	type importRow struct {
		DictCode string
		DictName string
		Module   string
		Status   int
		Remark   string
	}

	rows := make([]importRow, 0, len(records)-1)
	seenCodes := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]
		if impexp.IsCSVRecordEmpty(record) {
			continue
		}
		rowNumber := rowIndex + 1
		dictCode := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "dictCode"))
		dictName := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "dictName"))
		if dictCode == "" {
			impexp.AppendImportError(result, rowNumber, "dictCode", "dict.type.code.required")
		}
		if dictName == "" {
			impexp.AppendImportError(result, rowNumber, "dictName", "dict.type.name.required")
		}
		if firstRow, ok := seenCodes[dictCode]; ok && dictCode != "" {
			impexp.AppendImportError(result, rowNumber, "dictCode", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		} else if dictCode != "" {
			seenCodes[dictCode] = rowNumber
		}
		rows = append(rows, importRow{
			DictCode: dictCode,
			DictName: dictName,
			Module:   strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "module")),
			Status:   impexp.ParseEnabledStatus(impexp.ReadCSVField(record, headerIndex, "status")),
			Remark:   strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "remark")),
		})
	}
	if result.Failed > 0 {
		return result, nil
	}

	var existing []SystemDictType
	if err := s.db.Find(&existing).Error; err != nil {
		return nil, err
	}
	existingByCode := make(map[string]SystemDictType, len(existing))
	for _, row := range existing {
		existingByCode[row.DictCode] = row
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if existing, ok := existingByCode[row.DictCode]; ok {
				existing.DictName = row.DictName
				existing.Module = normalizeDictModule(row.Module)
				existing.Status = normalizeDictStatus(row.Status)
				existing.Remark = row.Remark
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}
				result.Updated++
				continue
			}
			item := SystemDictType{
				DictCode: row.DictCode,
				DictName: row.DictName,
				Module:   normalizeDictModule(row.Module),
				Status:   normalizeDictStatus(row.Status),
				Remark:   row.Remark,
			}
			if err := tx.Create(&item).Error; err != nil {
				return err
			}
			result.Created++
		}
		return nil
	}); err != nil {
		return nil, err
	}
	result.Applied = true
	return result, nil
}

func (s *DictService) UpdateDictType(typeID uint64, req *DictTypeUpdateReq) (*DictTypeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var row SystemDictType
	if err := s.db.First(&row, typeID).Error; err != nil {
		return nil, err
	}
	if err := s.validateDictType(typeID, req.DictCode); err != nil {
		return nil, err
	}

	oldCode := row.DictCode
	row.DictCode = strings.TrimSpace(req.DictCode)
	row.DictName = strings.TrimSpace(req.DictName)
	row.Module = normalizeDictModule(req.Module)
	row.Status = normalizeDictStatus(req.Status)
	row.Remark = strings.TrimSpace(req.Remark)

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&row).Error; err != nil {
			return err
		}
		if oldCode != row.DictCode {
			return tx.Model(&SystemDictItem{}).Where("dict_code = ?", oldCode).Update("dict_code", row.DictCode).Error
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	s.invalidateDictOptionCache(oldCode, row.DictCode)

	resp := toDictTypeResp(row)
	return &resp, nil
}

func (s *DictService) DeleteDictType(typeID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}

	var row SystemDictType
	if err := s.db.First(&row, typeID).Error; err != nil {
		return err
	}

	var itemCount int64
	if err := s.db.Model(&SystemDictItem{}).Where("dict_code = ?", row.DictCode).Count(&itemCount).Error; err != nil {
		return err
	}
	if itemCount > 0 {
		return errors.New("dict.type.delete.error.has_items")
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		deletedCode, err := s.allocateDeletedDictTypeCode(tx, row.ID)
		if err != nil {
			return err
		}
		if err := tx.Model(&row).Update("dict_code", deletedCode).Error; err != nil {
			return err
		}
		return tx.Delete(&row).Error
	}); err != nil {
		return err
	}
	s.invalidateDictOptionCache(row.DictCode)
	return nil
}

func (s *DictService) ListDictItems(query *DictItemListQuery) ([]DictItemResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if query == nil || strings.TrimSpace(query.DictCode) == "" {
		return []DictItemResp{}, nil
	}

	var rows []SystemDictItem
	db := s.db.Model(&SystemDictItem{}).Where("dict_code = ?", strings.TrimSpace(query.DictCode))
	if query.Status != nil && (*query.Status == 1 || *query.Status == 2) {
		db = db.Where("status = ?", *query.Status)
	}
	if err := db.
		Order(clause.OrderByColumn{Column: clause.Column{Name: "sort"}, Desc: false}).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: false}).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([]DictItemResp, 0, len(rows))
	for _, item := range rows {
		result = append(result, toDictItemResp(item))
	}
	return result, nil
}

func (s *DictService) CreateDictItem(req *DictItemCreateReq) (*DictItemResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateDictItem(0, req.DictCode, req.ItemValue); err != nil {
		return nil, err
	}

	row := SystemDictItem{
		DictCode:     strings.TrimSpace(req.DictCode),
		ItemLabelKey: strings.TrimSpace(req.ItemLabelKey),
		ItemValue:    strings.TrimSpace(req.ItemValue),
		ItemColor:    strings.TrimSpace(req.ItemColor),
		Sort:         req.Sort,
		Status:       normalizeDictStatus(req.Status),
		Remark:       strings.TrimSpace(req.Remark),
	}
	if err := s.db.Create(&row).Error; err != nil {
		return nil, err
	}
	s.invalidateDictOptionCache(row.DictCode)
	resp := toDictItemResp(row)
	return &resp, nil
}

func (s *DictService) ExportDictItems(query *DictItemListQuery) (*impexp.CSVFile, error) {
	rows, err := s.ListDictItems(query)
	if err != nil {
		return nil, err
	}
	result := make([][]string, 0, len(rows))
	for _, row := range rows {
		result = append(result, []string{
			row.DictCode,
			row.ItemLabelKey,
			row.ItemValue,
			row.ItemColor,
			fmt.Sprintf("%d", row.Sort),
			fmt.Sprintf("%d", row.Status),
			row.Remark,
		})
	}
	return &impexp.CSVFile{
		Filename: "system-dict-item-export.csv",
		Headers:  []string{"dictCode", "itemLabelKey", "itemValue", "itemColor", "sort", "status", "remark"},
		Rows:     result,
	}, nil
}

func (s *DictService) BuildDictItemImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "system-dict-item-import-template.csv",
		Headers:  []string{"dictCode", "itemLabelKey", "itemValue", "itemColor", "sort", "status", "remark"},
		Rows: [][]string{
			{"#说明：保留第一行表头；dictCode 必须已存在；itemLabelKey 使用 i18n key；itemValue 在同一 dictCode 下唯一；status 使用 1=启用、2=禁用。", "", "", "", "", "", ""},
			{"#biz_status", "dict.biz_status.enabled", "enabled", "green", "10", "1", "启用"},
		},
	}
}

func (s *DictService) ImportDictItems(records [][]string) (*impexp.ImportResult, error) {
	result := &impexp.ImportResult{Applied: false, Errors: []impexp.ImportError{}}
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if len(records) == 0 {
		impexp.AppendImportError(result, 0, "file", "import.file.empty")
		return result, nil
	}

	headerIndex := make(map[string]int, len(records[0]))
	for index, header := range records[0] {
		headerIndex[strings.TrimSpace(header)] = index
	}
	requiredHeaders := []string{"dictCode", "itemLabelKey", "itemValue", "itemColor", "sort", "status", "remark"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
	if result.Failed > 0 {
		return result, nil
	}

	type importRow struct {
		DictCode     string
		ItemLabelKey string
		ItemValue    string
		ItemColor    string
		Sort         int
		Status       int
		Remark       string
	}

	rows := make([]importRow, 0, len(records)-1)
	seenKeys := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]
		if impexp.IsCSVRecordEmpty(record) {
			continue
		}
		rowNumber := rowIndex + 1
		dictCode := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "dictCode"))
		itemLabelKey := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "itemLabelKey"))
		itemValue := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "itemValue"))
		sortValue, sortErr := impexp.ParseCSVInt(impexp.ReadCSVField(record, headerIndex, "sort"))

		if dictCode == "" {
			impexp.AppendImportError(result, rowNumber, "dictCode", "dict.type.code.required")
		}
		if itemLabelKey == "" {
			impexp.AppendImportError(result, rowNumber, "itemLabelKey", "dict.item.label_key.required")
		}
		if itemValue == "" {
			impexp.AppendImportError(result, rowNumber, "itemValue", "dict.item.value.required")
		}
		if sortErr != nil {
			impexp.AppendImportError(result, rowNumber, "sort", "import.field.invalid_integer")
		}

		compositeKey := dictCode + "|" + itemValue
		if firstRow, ok := seenKeys[compositeKey]; ok && compositeKey != "|" {
			impexp.AppendImportError(result, rowNumber, "itemValue", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		} else if compositeKey != "|" {
			seenKeys[compositeKey] = rowNumber
		}

		rows = append(rows, importRow{
			DictCode:     dictCode,
			ItemLabelKey: itemLabelKey,
			ItemValue:    itemValue,
			ItemColor:    strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "itemColor")),
			Sort:         sortValue,
			Status:       impexp.ParseEnabledStatus(impexp.ReadCSVField(record, headerIndex, "status")),
			Remark:       strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "remark")),
		})
	}
	if result.Failed > 0 {
		return result, nil
	}

	var existing []SystemDictItem
	if err := s.db.Find(&existing).Error; err != nil {
		return nil, err
	}
	existingByKey := make(map[string]SystemDictItem, len(existing))
	for _, row := range existing {
		existingByKey[row.DictCode+"|"+row.ItemValue] = row
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if err := s.validateDictItem(0, row.DictCode, row.ItemValue); err != nil {
				if existing, ok := existingByKey[row.DictCode+"|"+row.ItemValue]; ok {
					existing.ItemLabelKey = row.ItemLabelKey
					existing.ItemColor = row.ItemColor
					existing.Sort = row.Sort
					existing.Status = normalizeDictStatus(row.Status)
					existing.Remark = row.Remark
					if err := tx.Save(&existing).Error; err != nil {
						return err
					}
					s.invalidateDictOptionCache(existing.DictCode)
					result.Updated++
					continue
				}
				return err
			}

			item := SystemDictItem{
				DictCode:     row.DictCode,
				ItemLabelKey: row.ItemLabelKey,
				ItemValue:    row.ItemValue,
				ItemColor:    row.ItemColor,
				Sort:         row.Sort,
				Status:       normalizeDictStatus(row.Status),
				Remark:       row.Remark,
			}
			if err := tx.Create(&item).Error; err != nil {
				return err
			}
			s.invalidateDictOptionCache(item.DictCode)
			result.Created++
		}
		return nil
	}); err != nil {
		return nil, err
	}

	result.Applied = true
	return result, nil
}

func (s *DictService) UpdateDictItem(itemID uint64, req *DictItemUpdateReq) (*DictItemResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var row SystemDictItem
	if err := s.db.First(&row, itemID).Error; err != nil {
		return nil, err
	}
	originalDictCode := row.DictCode
	if err := s.validateDictItem(itemID, req.DictCode, req.ItemValue); err != nil {
		return nil, err
	}

	row.DictCode = strings.TrimSpace(req.DictCode)
	row.ItemLabelKey = strings.TrimSpace(req.ItemLabelKey)
	row.ItemValue = strings.TrimSpace(req.ItemValue)
	row.ItemColor = strings.TrimSpace(req.ItemColor)
	row.Sort = req.Sort
	row.Status = normalizeDictStatus(req.Status)
	row.Remark = strings.TrimSpace(req.Remark)

	if err := s.db.Save(&row).Error; err != nil {
		return nil, err
	}
	s.invalidateDictOptionCache(originalDictCode, row.DictCode)
	resp := toDictItemResp(row)
	return &resp, nil
}

func (s *DictService) DeleteDictItem(itemID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}

	var row SystemDictItem
	if err := s.db.First(&row, itemID).Error; err != nil {
		return err
	}
	originalDictCode := row.DictCode
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		deletedValue, err := s.allocateDeletedDictItemValue(tx, row.ID, row.DictCode)
		if err != nil {
			return err
		}
		if err := tx.Model(&row).Update("item_value", deletedValue).Error; err != nil {
			return err
		}
		return tx.Delete(&row).Error
	}); err != nil {
		return err
	}
	s.invalidateDictOptionCache(originalDictCode)
	return nil
}

func (s *DictService) GetDictOptions(codes []string) (DictOptionMapResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	normalizedCodes := normalizeDictCodes(codes)
	if len(normalizedCodes) == 0 {
		return DictOptionMapResp{}, nil
	}

	resp := DictOptionMapResp{}
	for _, code := range normalizedCodes {
		resp[code] = []DictOptionResp{}
	}

	missingCodes := make([]string, 0, len(normalizedCodes))
	s.optionCacheMu.RLock()
	for _, code := range normalizedCodes {
		if cached, ok := s.optionCache[code]; ok {
			resp[code] = cloneDictOptions(cached)
			continue
		}
		missingCodes = append(missingCodes, code)
	}
	s.optionCacheMu.RUnlock()

	if len(missingCodes) == 0 {
		return resp, nil
	}

	loaded, err := s.queryEnabledDictOptions(missingCodes)
	if err != nil {
		return nil, err
	}

	s.optionCacheMu.Lock()
	for _, code := range missingCodes {
		s.optionCache[code] = cloneDictOptions(loaded[code])
		resp[code] = cloneDictOptions(s.optionCache[code])
	}
	s.optionCacheMu.Unlock()

	return resp, nil
}

func (s *DictService) RefreshDictOptionsCache(codes []string) (*DictCacheRefreshResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	normalizedCodes := normalizeDictCodes(codes)
	if len(normalizedCodes) == 0 {
		s.optionCacheMu.Lock()
		s.optionCache = make(map[string][]DictOptionResp)
		s.optionCacheMu.Unlock()
		return &DictCacheRefreshResp{
			RefreshedCodes: []string{},
			ClearedAll:     1,
		}, nil
	}

	loaded, err := s.queryEnabledDictOptions(normalizedCodes)
	if err != nil {
		return nil, err
	}

	s.optionCacheMu.Lock()
	for _, code := range normalizedCodes {
		s.optionCache[code] = cloneDictOptions(loaded[code])
	}
	s.optionCacheMu.Unlock()

	return &DictCacheRefreshResp{
		RefreshedCodes: normalizedCodes,
		ClearedAll:     0,
	}, nil
}

func (s *DictService) queryEnabledDictOptions(codes []string) (DictOptionMapResp, error) {
	result := DictOptionMapResp{}
	for _, code := range codes {
		result[code] = []DictOptionResp{}
	}

	var rows []SystemDictItem
	if err := s.db.Model(&SystemDictItem{}).
		Where("dict_code IN ? AND status = ?", codes, 1).
		Order("dict_code asc, sort asc, id asc").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	for _, item := range rows {
		result[item.DictCode] = append(result[item.DictCode], DictOptionResp{
			LabelKey: item.ItemLabelKey,
			Value:    item.ItemValue,
			Color:    item.ItemColor,
			Sort:     item.Sort,
		})
	}
	return result, nil
}

func (s *DictService) validateDictType(typeID uint64, dictCode string) error {
	trimmedCode := strings.TrimSpace(dictCode)
	if trimmedCode == "" {
		return errors.New("param.invalid")
	}

	var count int64
	db := s.db.Model(&SystemDictType{}).Where("dict_code = ?", trimmedCode)
	if typeID > 0 {
		db = db.Where("id <> ?", typeID)
	}
	if err := db.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("dict.type.code.exists")
	}
	return nil
}

func (s *DictService) validateDictItem(itemID uint64, dictCode string, itemValue string) error {
	trimmedCode := strings.TrimSpace(dictCode)
	trimmedValue := strings.TrimSpace(itemValue)
	if trimmedCode == "" || trimmedValue == "" {
		return errors.New("param.invalid")
	}

	var typeCount int64
	if err := s.db.Model(&SystemDictType{}).Where("dict_code = ?", trimmedCode).Count(&typeCount).Error; err != nil {
		return err
	}
	if typeCount == 0 {
		return errors.New("dict.type.not_found")
	}

	var count int64
	db := s.db.Model(&SystemDictItem{}).Where("dict_code = ? AND item_value = ?", trimmedCode, trimmedValue)
	if itemID > 0 {
		db = db.Where("id <> ?", itemID)
	}
	if err := db.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("dict.item.value.exists")
	}
	return nil
}

func normalizeDictStatus(status int) int {
	if status == 2 {
		return 2
	}
	return 1
}

func normalizeDictModule(module string) string {
	if strings.TrimSpace(module) == "" {
		return "system"
	}
	return strings.TrimSpace(module)
}

func normalizeDictCodes(codes []string) []string {
	result := make([]string, 0, len(codes))
	seen := make(map[string]struct{}, len(codes))
	for _, code := range codes {
		trimmed := strings.TrimSpace(code)
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

func cloneDictOptions(items []DictOptionResp) []DictOptionResp {
	if len(items) == 0 {
		return []DictOptionResp{}
	}
	result := make([]DictOptionResp, len(items))
	copy(result, items)
	return result
}

func (s *DictService) invalidateDictOptionCache(codes ...string) {
	normalizedCodes := normalizeDictCodes(codes)
	if len(normalizedCodes) == 0 {
		return
	}
	s.optionCacheMu.Lock()
	defer s.optionCacheMu.Unlock()
	for _, code := range normalizedCodes {
		delete(s.optionCache, code)
	}
}

func (s *DictService) releaseDeletedDictTypeCodes() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var deletedTypes []SystemDictType
		if err := tx.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedTypes).Error; err != nil {
			return err
		}
		for _, item := range deletedTypes {
			if strings.HasPrefix(item.DictCode, deletedDictTypeCodePrefix) {
				continue
			}
			deletedCode, err := s.allocateDeletedDictTypeCode(tx, item.ID)
			if err != nil {
				return err
			}
			if err := tx.Unscoped().Model(&SystemDictType{}).Where("id = ?", item.ID).Update("dict_code", deletedCode).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *DictService) releaseDeletedDictItemValues() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var deletedItems []SystemDictItem
		if err := tx.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedItems).Error; err != nil {
			return err
		}
		for _, item := range deletedItems {
			if strings.HasPrefix(item.ItemValue, deletedDictItemValuePrefix) {
				continue
			}
			deletedValue, err := s.allocateDeletedDictItemValue(tx, item.ID, item.DictCode)
			if err != nil {
				return err
			}
			if err := tx.Unscoped().Model(&SystemDictItem{}).Where("id = ?", item.ID).Update("item_value", deletedValue).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *DictService) allocateDeletedDictTypeCode(tx *gorm.DB, typeID uint64) (string, error) {
	for attempt := 0; attempt < 5; attempt++ {
		candidate := fmt.Sprintf("%s%d", deletedDictTypeCodePrefix, typeID)
		if attempt > 0 {
			candidate = fmt.Sprintf("%s%d_%d", deletedDictTypeCodePrefix, typeID, time.Now().UnixNano())
		}

		var count int64
		if err := tx.Unscoped().Model(&SystemDictType{}).Where("dict_code = ? AND id <> ?", candidate, typeID).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}
	return "", errors.New("dict.type.delete.error.archive_code_conflict")
}

func (s *DictService) allocateDeletedDictItemValue(tx *gorm.DB, itemID uint64, dictCode string) (string, error) {
	for attempt := 0; attempt < 5; attempt++ {
		candidate := fmt.Sprintf("%s%d", deletedDictItemValuePrefix, itemID)
		if attempt > 0 {
			candidate = fmt.Sprintf("%s%d_%d", deletedDictItemValuePrefix, itemID, time.Now().UnixNano())
		}

		var count int64
		if err := tx.Unscoped().Model(&SystemDictItem{}).Where("dict_code = ? AND item_value = ? AND id <> ?", dictCode, candidate, itemID).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}
	return "", errors.New("dict.item.delete.error.archive_value_conflict")
}

func toDictTypeResp(item SystemDictType) DictTypeResp {
	return DictTypeResp{
		ID:        item.ID,
		DictCode:  item.DictCode,
		DictName:  item.DictName,
		Module:    item.Module,
		Status:    item.Status,
		Remark:    item.Remark,
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
	}
}

func toDictItemResp(item SystemDictItem) DictItemResp {
	return DictItemResp{
		ID:           item.ID,
		DictCode:     item.DictCode,
		ItemLabelKey: item.ItemLabelKey,
		ItemValue:    item.ItemValue,
		ItemColor:    item.ItemColor,
		Sort:         item.Sort,
		Status:       item.Status,
		Remark:       item.Remark,
		CreatedAt:    item.CreatedAt.Format(time.RFC3339),
	}
}
