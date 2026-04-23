package cmdb

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CMDBService struct {
	db *gorm.DB
}

type cmdbTypeSeed struct {
	TypeCode string
	TypeName string
	Category string
	Status   int
	Remark   string
}

type cmdbDictTypeSeed struct {
	DictCode string
	DictName string
	Module   string
	Status   int
	Remark   string
}

type cmdbDictItemSeed struct {
	DictCode     string
	ItemLabelKey string
	ItemValue    string
	ItemColor    string
	Sort         int
	Status       int
	Remark       string
}

var defaultCMDBTypeSeeds = []cmdbTypeSeed{
	{TypeCode: "application", TypeName: "应用服务", Category: "software", Status: 1, Remark: "cmdb.seed.type.application"},
	{TypeCode: "server", TypeName: "服务器", Category: "infrastructure", Status: 1, Remark: "cmdb.seed.type.server"},
	{TypeCode: "database", TypeName: "数据库", Category: "infrastructure", Status: 1, Remark: "cmdb.seed.type.database"},
}

var defaultCMDBDictTypes = []cmdbDictTypeSeed{
	{DictCode: "cmdb_environment", DictName: "cmdb.dict.environment", Module: "business.cmdb", Status: 1, Remark: "cmdb.dict.environment.remark"},
	{DictCode: "cmdb_item_status", DictName: "cmdb.dict.item_status", Module: "business.cmdb", Status: 1, Remark: "cmdb.dict.item_status.remark"},
	{DictCode: "cmdb_relation_type", DictName: "cmdb.dict.relation_type", Module: "business.cmdb", Status: 1, Remark: "cmdb.dict.relation_type.remark"},
}

var defaultCMDBDictItems = []cmdbDictItemSeed{
	{DictCode: "cmdb_environment", ItemLabelKey: "cmdb.environment.dev", ItemValue: "dev", ItemColor: "gray", Sort: 1, Status: 1},
	{DictCode: "cmdb_environment", ItemLabelKey: "cmdb.environment.test", ItemValue: "test", ItemColor: "blue", Sort: 2, Status: 1},
	{DictCode: "cmdb_environment", ItemLabelKey: "cmdb.environment.staging", ItemValue: "staging", ItemColor: "orange", Sort: 3, Status: 1},
	{DictCode: "cmdb_environment", ItemLabelKey: "cmdb.environment.prod", ItemValue: "prod", ItemColor: "red", Sort: 4, Status: 1},
	{DictCode: "cmdb_item_status", ItemLabelKey: "cmdb.status.active", ItemValue: "active", ItemColor: "green", Sort: 1, Status: 1},
	{DictCode: "cmdb_item_status", ItemLabelKey: "cmdb.status.inactive", ItemValue: "inactive", ItemColor: "gray", Sort: 2, Status: 1},
	{DictCode: "cmdb_item_status", ItemLabelKey: "cmdb.status.maintenance", ItemValue: "maintenance", ItemColor: "orange", Sort: 3, Status: 1},
	{DictCode: "cmdb_relation_type", ItemLabelKey: "cmdb.relation.depends_on", ItemValue: "depends_on", ItemColor: "arcoblue", Sort: 1, Status: 1},
	{DictCode: "cmdb_relation_type", ItemLabelKey: "cmdb.relation.deployed_on", ItemValue: "deployed_on", ItemColor: "purple", Sort: 2, Status: 1},
	{DictCode: "cmdb_relation_type", ItemLabelKey: "cmdb.relation.connects_to", ItemValue: "connects_to", ItemColor: "green", Sort: 3, Status: 1},
	{DictCode: "cmdb_relation_type", ItemLabelKey: "cmdb.relation.backed_by", ItemValue: "backed_by", ItemColor: "orange", Sort: 4, Status: 1},
}

func NewCMDBService(db *gorm.DB) *CMDBService {
	return &CMDBService{db: db}
}

func (s *CMDBService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&BizCMDBType{}, &BizCMDBItem{}, &BizCMDBRelation{}); err != nil {
		return err
	}
	if err := s.seedDefaultTypes(); err != nil {
		return err
	}
	return s.seedDefaultDicts()
}

func (s *CMDBService) ListTypes(query *CMDBTypeListQuery) (*CMDBTypePageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	page, pageSize := normalizePage(queryPage(query), queryPageSize(query))
	db := s.db.Model(&BizCMDBType{})
	if query != nil {
		if strings.TrimSpace(query.TypeCode) != "" {
			db = db.Where("type_code LIKE ?", "%"+strings.TrimSpace(query.TypeCode)+"%")
		}
		if strings.TrimSpace(query.TypeName) != "" {
			db = db.Where("type_name LIKE ?", "%"+strings.TrimSpace(query.TypeName)+"%")
		}
		if strings.TrimSpace(query.Category) != "" {
			db = db.Where("category = ?", strings.TrimSpace(query.Category))
		}
		if query.Status != nil && (*query.Status == 1 || *query.Status == 2) {
			db = db.Where("status = ?", *query.Status)
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []BizCMDBType
	if err := db.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]CMDBTypeResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, toCMDBTypeResp(row))
	}
	return &CMDBTypePageResp{Items: items, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *CMDBService) CreateType(req *CMDBTypeCreateReq) (*CMDBTypeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateTypePayload(0, req.TypeCode, req.TypeName); err != nil {
		return nil, err
	}
	row := BizCMDBType{
		TypeCode: strings.TrimSpace(req.TypeCode),
		TypeName: strings.TrimSpace(req.TypeName),
		Category: strings.TrimSpace(req.Category),
		Status:   normalizeStatus(req.Status),
		Remark:   strings.TrimSpace(req.Remark),
	}
	if err := s.db.Create(&row).Error; err != nil {
		return nil, err
	}
	resp := toCMDBTypeResp(row)
	return &resp, nil
}

func (s *CMDBService) UpdateType(typeID uint64, req *CMDBTypeUpdateReq) (*CMDBTypeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var row BizCMDBType
	if err := s.db.First(&row, typeID).Error; err != nil {
		return nil, err
	}
	if err := s.validateTypePayload(typeID, req.TypeCode, req.TypeName); err != nil {
		return nil, err
	}
	row.TypeCode = strings.TrimSpace(req.TypeCode)
	row.TypeName = strings.TrimSpace(req.TypeName)
	row.Category = strings.TrimSpace(req.Category)
	row.Status = normalizeStatus(req.Status)
	row.Remark = strings.TrimSpace(req.Remark)
	if err := s.db.Save(&row).Error; err != nil {
		return nil, err
	}
	resp := toCMDBTypeResp(row)
	return &resp, nil
}

func (s *CMDBService) DeleteType(typeID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	var count int64
	if err := s.db.Model(&BizCMDBItem{}).Where("type_id = ?", typeID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cmdb.type.delete.has_items")
	}
	return s.db.Delete(&BizCMDBType{}, typeID).Error
}

func (s *CMDBService) ExportTypes(query *CMDBTypeListQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	rows, err := s.listTypesForExport(query)
	if err != nil {
		return nil, err
	}
	dataRows := make([][]string, 0, len(rows))
	for _, row := range rows {
		dataRows = append(dataRows, []string{
			row.TypeCode,
			row.TypeName,
			row.Category,
			fmt.Sprintf("%d", row.Status),
			row.Remark,
		})
	}
	return &impexp.CSVFile{
		Filename: "cmdb-type-export.csv",
		Headers:  []string{"typeCode", "typeName", "category", "status", "remark"},
		Rows:     dataRows,
	}, nil
}

func (s *CMDBService) BuildTypeImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "cmdb-type-import-template.csv",
		Headers:  []string{"typeCode", "typeName", "category", "status", "remark"},
		Rows: [][]string{
			{"#说明：保留第一行表头；status 使用 1=启用、2=禁用；按 typeCode 做新增或更新。", "", "", "", ""},
			{"#application", "应用服务", "software", "1", "应用类资源"},
		},
	}
}

func (s *CMDBService) ImportTypes(records [][]string) (*impexp.ImportResult, error) {
	result := &impexp.ImportResult{
		Applied: false,
		Errors:  []impexp.ImportError{},
	}
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
	requiredHeaders := []string{"typeCode", "typeName", "category", "status", "remark"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
	if result.Failed > 0 {
		return result, nil
	}

	existingByCode, err := s.loadTypesByCode()
	if err != nil {
		return nil, err
	}

	rows := make([]CMDBTypeImportRow, 0, len(records)-1)
	seenCodes := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]
		if impexp.IsCSVRecordEmpty(record) {
			continue
		}
		rowNumber := rowIndex + 1
		typeCode := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "typeCode"))
		typeName := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "typeName"))
		category := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "category"))
		remark := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "remark"))
		status := impexp.ParseEnabledStatus(impexp.ReadCSVField(record, headerIndex, "status"))

		if typeCode == "" {
			impexp.AppendImportError(result, rowNumber, "typeCode", "cmdb.type.code.required")
		}
		if typeName == "" {
			impexp.AppendImportError(result, rowNumber, "typeName", "cmdb.type.name.required")
		}
		if firstRow, ok := seenCodes[typeCode]; ok && typeCode != "" {
			impexp.AppendImportError(result, rowNumber, "typeCode", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		} else if typeCode != "" {
			seenCodes[typeCode] = rowNumber
		}

		rows = append(rows, CMDBTypeImportRow{
			TypeCode: typeCode,
			TypeName: typeName,
			Category: category,
			Status:   status,
			Remark:   remark,
			Existing: existingByCode[typeCode],
		})
	}
	if result.Failed > 0 {
		return result, nil
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if row.Existing != nil {
				if err := tx.Model(row.Existing).Updates(map[string]interface{}{
					"type_name":  row.TypeName,
					"category":   row.Category,
					"status":     normalizeStatus(row.Status),
					"remark":     row.Remark,
					"updated_at": time.Now(),
				}).Error; err != nil {
					return err
				}
				result.Updated++
				continue
			}

			if err := tx.Create(&BizCMDBType{
				TypeCode: row.TypeCode,
				TypeName: row.TypeName,
				Category: row.Category,
				Status:   normalizeStatus(row.Status),
				Remark:   row.Remark,
			}).Error; err != nil {
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

func (s *CMDBService) ListItems(query *CMDBItemListQuery) (*CMDBItemPageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	page, pageSize := normalizePage(itemQueryPage(query), itemQueryPageSize(query))
	db := s.db.Model(&BizCMDBItem{})
	if query != nil {
		if query.TypeID > 0 {
			db = db.Where("type_id = ?", query.TypeID)
		}
		if strings.TrimSpace(query.ItemCode) != "" {
			db = db.Where("item_code LIKE ?", "%"+strings.TrimSpace(query.ItemCode)+"%")
		}
		if strings.TrimSpace(query.ItemName) != "" {
			db = db.Where("item_name LIKE ?", "%"+strings.TrimSpace(query.ItemName)+"%")
		}
		if strings.TrimSpace(query.Environment) != "" {
			db = db.Where("environment = ?", strings.TrimSpace(query.Environment))
		}
		if strings.TrimSpace(query.Status) != "" {
			db = db.Where("status = ?", strings.TrimSpace(query.Status))
		}
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []BizCMDBItem
	if err := db.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, err
	}
	typeMap, err := s.loadTypeMap(rows)
	if err != nil {
		return nil, err
	}
	items := make([]CMDBItemResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, toCMDBItemResp(row, typeMap[row.TypeID]))
	}
	return &CMDBItemPageResp{Items: items, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *CMDBService) GetItemDetail(itemID uint64) (*CMDBItemDetailResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var row BizCMDBItem
	if err := s.db.First(&row, itemID).Error; err != nil {
		return nil, err
	}
	typeMap, err := s.loadTypeMap([]BizCMDBItem{row})
	if err != nil {
		return nil, err
	}
	baseResp := toCMDBItemResp(row, typeMap[row.TypeID])
	deptNames, err := s.loadDeptNames([]uint64{row.OwnerDeptID})
	if err != nil {
		return nil, err
	}
	outgoingRelations, incomingRelations, err := s.loadItemRelations(row.ID)
	if err != nil {
		return nil, err
	}
	resp := &CMDBItemDetailResp{
		CMDBItemResp:      baseResp,
		OwnerDeptName:     deptNames[row.OwnerDeptID],
		OutgoingRelations: outgoingRelations,
		IncomingRelations: incomingRelations,
	}
	return resp, nil
}

func (s *CMDBService) CreateItem(req *CMDBItemCreateReq) (*CMDBItemResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateItemPayload(0, req.TypeID, req.ItemCode, req.ItemName); err != nil {
		return nil, err
	}
	row := BizCMDBItem{
		TypeID:      req.TypeID,
		ItemCode:    strings.TrimSpace(req.ItemCode),
		ItemName:    strings.TrimSpace(req.ItemName),
		Environment: normalizeEnvironment(req.Environment),
		Status:      normalizeItemStatus(req.Status),
		OwnerUserID: req.OwnerUserID,
		OwnerDeptID: req.OwnerDeptID,
		Endpoint:    strings.TrimSpace(req.Endpoint),
		Description: strings.TrimSpace(req.Description),
	}
	if err := s.db.Create(&row).Error; err != nil {
		return nil, err
	}
	typeMap, err := s.loadTypeMap([]BizCMDBItem{row})
	if err != nil {
		return nil, err
	}
	resp := toCMDBItemResp(row, typeMap[row.TypeID])
	return &resp, nil
}

func (s *CMDBService) UpdateItem(itemID uint64, req *CMDBItemUpdateReq) (*CMDBItemResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	var row BizCMDBItem
	if err := s.db.First(&row, itemID).Error; err != nil {
		return nil, err
	}
	if err := s.validateItemPayload(itemID, req.TypeID, req.ItemCode, req.ItemName); err != nil {
		return nil, err
	}
	row.TypeID = req.TypeID
	row.ItemCode = strings.TrimSpace(req.ItemCode)
	row.ItemName = strings.TrimSpace(req.ItemName)
	row.Environment = normalizeEnvironment(req.Environment)
	row.Status = normalizeItemStatus(req.Status)
	row.OwnerUserID = req.OwnerUserID
	row.OwnerDeptID = req.OwnerDeptID
	row.Endpoint = strings.TrimSpace(req.Endpoint)
	row.Description = strings.TrimSpace(req.Description)
	if err := s.db.Save(&row).Error; err != nil {
		return nil, err
	}
	typeMap, err := s.loadTypeMap([]BizCMDBItem{row})
	if err != nil {
		return nil, err
	}
	resp := toCMDBItemResp(row, typeMap[row.TypeID])
	return &resp, nil
}

func (s *CMDBService) DeleteItem(itemID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("source_item_id = ? OR target_item_id = ?", itemID, itemID).Delete(&BizCMDBRelation{}).Error; err != nil {
			return err
		}
		return tx.Delete(&BizCMDBItem{}, itemID).Error
	})
}

func (s *CMDBService) CreateRelation(req *CMDBRelationCreateReq) (*CMDBRelationResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateRelationPayload(req.SourceItemID, req.TargetItemID, req.RelationType); err != nil {
		return nil, err
	}
	row := BizCMDBRelation{
		SourceItemID: req.SourceItemID,
		TargetItemID: req.TargetItemID,
		RelationType: strings.TrimSpace(req.RelationType),
		Remark:       strings.TrimSpace(req.Remark),
	}
	if err := s.db.Create(&row).Error; err != nil {
		return nil, err
	}
	resp, err := s.buildRelationResp(row)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (s *CMDBService) DeleteRelation(relationID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.Delete(&BizCMDBRelation{}, relationID).Error
}

func (s *CMDBService) ExportItems(query *CMDBItemListQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	rows, err := s.listItemsForExport(query)
	if err != nil {
		return nil, err
	}
	typeMap, err := s.loadTypeMap(rows)
	if err != nil {
		return nil, err
	}
	dataRows := make([][]string, 0, len(rows))
	for _, row := range rows {
		typeRow := typeMap[row.TypeID]
		dataRows = append(dataRows, []string{
			typeRow.TypeCode,
			row.ItemCode,
			row.ItemName,
			row.Environment,
			row.Status,
			fmt.Sprintf("%d", row.OwnerUserID),
			fmt.Sprintf("%d", row.OwnerDeptID),
			row.Endpoint,
			row.Description,
		})
	}
	return &impexp.CSVFile{
		Filename: "cmdb-item-export.csv",
		Headers:  []string{"typeCode", "itemCode", "itemName", "environment", "status", "ownerUserId", "ownerDeptId", "endpoint", "description"},
		Rows:     dataRows,
	}, nil
}

func (s *CMDBService) BuildItemImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "cmdb-item-import-template.csv",
		Headers:  []string{"typeCode", "itemCode", "itemName", "environment", "status", "ownerUserId", "ownerDeptId", "endpoint", "description"},
		Rows: [][]string{
			{"#说明：environment 使用 dev/test/staging/prod；status 使用 active/inactive/maintenance；按 itemCode 做新增或更新。", "", "", "", "", "", "", "", ""},
			{"#application", "app-pantheon-api", "Pantheon API", "prod", "active", "1", "2", "https://api.example.com", "核心业务 API"},
		},
	}
}

func (s *CMDBService) ImportItems(records [][]string) (*impexp.ImportResult, error) {
	result := &impexp.ImportResult{
		Applied: false,
		Errors:  []impexp.ImportError{},
	}
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
	requiredHeaders := []string{"typeCode", "itemCode", "itemName", "environment", "status", "ownerUserId", "ownerDeptId", "endpoint", "description"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
	if result.Failed > 0 {
		return result, nil
	}

	typeIDByCode, err := s.loadTypeIDsByCode()
	if err != nil {
		return nil, err
	}
	existingByCode, err := s.loadItemsByCode()
	if err != nil {
		return nil, err
	}

	rows := make([]CMDBItemImportRow, 0, len(records)-1)
	seenCodes := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]
		if impexp.IsCSVRecordEmpty(record) {
			continue
		}
		rowNumber := rowIndex + 1
		typeCode := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "typeCode"))
		itemCode := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "itemCode"))
		itemName := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "itemName"))
		environment := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "environment"))
		status := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "status"))
		endpoint := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "endpoint"))
		description := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "description"))

		ownerUserIDInt, userErr := impexp.ParseCSVInt(impexp.ReadCSVField(record, headerIndex, "ownerUserId"))
		if userErr != nil {
			impexp.AppendImportError(result, rowNumber, "ownerUserId", "import.field.invalid_integer")
		}
		ownerDeptIDInt, deptErr := impexp.ParseCSVInt(impexp.ReadCSVField(record, headerIndex, "ownerDeptId"))
		if deptErr != nil {
			impexp.AppendImportError(result, rowNumber, "ownerDeptId", "import.field.invalid_integer")
		}

		typeID := typeIDByCode[typeCode]
		if typeCode == "" {
			impexp.AppendImportError(result, rowNumber, "typeCode", "cmdb.item.type.required")
		} else if typeID == 0 {
			impexp.AppendImportError(result, rowNumber, "typeCode", "cmdb.item.type.invalid")
		}
		if itemCode == "" {
			impexp.AppendImportError(result, rowNumber, "itemCode", "cmdb.item.code.required")
		}
		if itemName == "" {
			impexp.AppendImportError(result, rowNumber, "itemName", "cmdb.item.name.required")
		}
		if firstRow, ok := seenCodes[itemCode]; ok && itemCode != "" {
			impexp.AppendImportError(result, rowNumber, "itemCode", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		} else if itemCode != "" {
			seenCodes[itemCode] = rowNumber
		}
		if err := validateImportEnvironment(environment); err != nil {
			impexp.AppendImportError(result, rowNumber, "environment", err.Error())
		}
		if err := validateImportItemStatus(status); err != nil {
			impexp.AppendImportError(result, rowNumber, "status", err.Error())
		}

		rows = append(rows, CMDBItemImportRow{
			TypeID:      typeID,
			ItemCode:    itemCode,
			ItemName:    itemName,
			Environment: normalizeEnvironment(environment),
			Status:      normalizeItemStatus(status),
			OwnerUserID: uint64(ownerUserIDInt),
			OwnerDeptID: uint64(ownerDeptIDInt),
			Endpoint:    endpoint,
			Description: description,
			Existing:    existingByCode[itemCode],
		})
	}
	if result.Failed > 0 {
		return result, nil
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if row.Existing != nil {
				if err := tx.Model(row.Existing).Updates(map[string]interface{}{
					"type_id":       row.TypeID,
					"item_name":     row.ItemName,
					"environment":   row.Environment,
					"status":        row.Status,
					"owner_user_id": row.OwnerUserID,
					"owner_dept_id": row.OwnerDeptID,
					"endpoint":      row.Endpoint,
					"description":   row.Description,
					"updated_at":    time.Now(),
				}).Error; err != nil {
					return err
				}
				result.Updated++
				continue
			}

			if err := tx.Create(&BizCMDBItem{
				TypeID:      row.TypeID,
				ItemCode:    row.ItemCode,
				ItemName:    row.ItemName,
				Environment: row.Environment,
				Status:      row.Status,
				OwnerUserID: row.OwnerUserID,
				OwnerDeptID: row.OwnerDeptID,
				Endpoint:    row.Endpoint,
				Description: row.Description,
			}).Error; err != nil {
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

func (s *CMDBService) validateTypePayload(typeID uint64, typeCode string, typeName string) error {
	code := strings.TrimSpace(typeCode)
	name := strings.TrimSpace(typeName)
	if code == "" {
		return errors.New("cmdb.type.code.required")
	}
	if name == "" {
		return errors.New("cmdb.type.name.required")
	}
	var count int64
	db := s.db.Model(&BizCMDBType{}).Where("type_code = ?", code)
	if typeID > 0 {
		db = db.Where("id <> ?", typeID)
	}
	if err := db.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cmdb.type.code.exists")
	}
	return nil
}

func (s *CMDBService) validateItemPayload(itemID uint64, typeID uint64, itemCode string, itemName string) error {
	if typeID == 0 {
		return errors.New("cmdb.item.type.required")
	}
	var typeCount int64
	if err := s.db.Model(&BizCMDBType{}).Where("id = ? AND status = ?", typeID, 1).Count(&typeCount).Error; err != nil {
		return err
	}
	if typeCount == 0 {
		return errors.New("cmdb.item.type.invalid")
	}
	code := strings.TrimSpace(itemCode)
	name := strings.TrimSpace(itemName)
	if code == "" {
		return errors.New("cmdb.item.code.required")
	}
	if name == "" {
		return errors.New("cmdb.item.name.required")
	}
	var count int64
	db := s.db.Model(&BizCMDBItem{}).Where("item_code = ?", code)
	if itemID > 0 {
		db = db.Where("id <> ?", itemID)
	}
	if err := db.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cmdb.item.code.exists")
	}
	return nil
}

func (s *CMDBService) validateRelationPayload(sourceItemID uint64, targetItemID uint64, relationType string) error {
	if sourceItemID == 0 || targetItemID == 0 {
		return errors.New("cmdb.relation.item.required")
	}
	if sourceItemID == targetItemID {
		return errors.New("cmdb.relation.self_not_allowed")
	}
	var count int64
	if err := s.db.Model(&BizCMDBItem{}).Where("id IN ?", []uint64{sourceItemID, targetItemID}).Count(&count).Error; err != nil {
		return err
	}
	if count != 2 {
		return errors.New("cmdb.relation.item.invalid")
	}
	if err := s.validateRelationType(relationType); err != nil {
		return err
	}
	db := s.db.Model(&BizCMDBRelation{}).Where("source_item_id = ? AND target_item_id = ? AND relation_type = ?", sourceItemID, targetItemID, strings.TrimSpace(relationType))
	if err := db.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cmdb.relation.exists")
	}
	return nil
}

func (s *CMDBService) loadTypeMap(items []BizCMDBItem) (map[uint64]BizCMDBType, error) {
	typeIDs := make([]uint64, 0, len(items))
	seen := map[uint64]bool{}
	for _, item := range items {
		if item.TypeID == 0 || seen[item.TypeID] {
			continue
		}
		seen[item.TypeID] = true
		typeIDs = append(typeIDs, item.TypeID)
	}
	if len(typeIDs) == 0 {
		return map[uint64]BizCMDBType{}, nil
	}
	var rows []BizCMDBType
	if err := s.db.Where("id IN ?", typeIDs).Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[uint64]BizCMDBType, len(rows))
	for _, row := range rows {
		result[row.ID] = row
	}
	return result, nil
}

func (s *CMDBService) loadDeptNames(deptIDs []uint64) (map[uint64]string, error) {
	result := make(map[uint64]string)
	normalized := make([]uint64, 0, len(deptIDs))
	seen := make(map[uint64]struct{}, len(deptIDs))
	for _, deptID := range deptIDs {
		if deptID == 0 {
			continue
		}
		if _, ok := seen[deptID]; ok {
			continue
		}
		seen[deptID] = struct{}{}
		normalized = append(normalized, deptID)
	}
	if len(normalized) == 0 || !s.db.Migrator().HasTable("system_dept") {
		return result, nil
	}
	type deptNameRow struct {
		ID       uint64 `gorm:"column:id"`
		DeptName string `gorm:"column:dept_name"`
	}
	var rows []deptNameRow
	if err := s.db.Table("system_dept").Select("id, dept_name").Where("id IN ?", normalized).Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ID] = row.DeptName
	}
	return result, nil
}

func (s *CMDBService) loadItemRelations(itemID uint64) ([]CMDBRelationResp, []CMDBRelationResp, error) {
	var rows []BizCMDBRelation
	if err := s.db.Where("source_item_id = ? OR target_item_id = ?", itemID, itemID).Order("id desc").Find(&rows).Error; err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return []CMDBRelationResp{}, []CMDBRelationResp{}, nil
	}
	itemMap, err := s.loadRelationItemMap(rows)
	if err != nil {
		return nil, nil, err
	}
	outgoing := make([]CMDBRelationResp, 0)
	incoming := make([]CMDBRelationResp, 0)
	for _, row := range rows {
		resp := toCMDBRelationResp(row, itemMap[row.SourceItemID], itemMap[row.TargetItemID])
		if row.SourceItemID == itemID {
			outgoing = append(outgoing, resp)
		}
		if row.TargetItemID == itemID {
			incoming = append(incoming, resp)
		}
	}
	return outgoing, incoming, nil
}

func (s *CMDBService) loadRelationItemMap(relations []BizCMDBRelation) (map[uint64]BizCMDBItem, error) {
	itemIDs := make([]uint64, 0, len(relations)*2)
	seen := make(map[uint64]struct{}, len(relations)*2)
	for _, relation := range relations {
		if relation.SourceItemID > 0 {
			if _, ok := seen[relation.SourceItemID]; !ok {
				seen[relation.SourceItemID] = struct{}{}
				itemIDs = append(itemIDs, relation.SourceItemID)
			}
		}
		if relation.TargetItemID > 0 {
			if _, ok := seen[relation.TargetItemID]; !ok {
				seen[relation.TargetItemID] = struct{}{}
				itemIDs = append(itemIDs, relation.TargetItemID)
			}
		}
	}
	if len(itemIDs) == 0 {
		return map[uint64]BizCMDBItem{}, nil
	}
	var rows []BizCMDBItem
	if err := s.db.Where("id IN ?", itemIDs).Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[uint64]BizCMDBItem, len(rows))
	for _, row := range rows {
		result[row.ID] = row
	}
	return result, nil
}

func (s *CMDBService) buildRelationResp(row BizCMDBRelation) (*CMDBRelationResp, error) {
	itemMap, err := s.loadRelationItemMap([]BizCMDBRelation{row})
	if err != nil {
		return nil, err
	}
	resp := toCMDBRelationResp(row, itemMap[row.SourceItemID], itemMap[row.TargetItemID])
	return &resp, nil
}

func (s *CMDBService) loadTypesByCode() (map[string]*BizCMDBType, error) {
	var rows []BizCMDBType
	if err := s.db.Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]*BizCMDBType, len(rows))
	for index := range rows {
		row := rows[index]
		result[row.TypeCode] = &rows[index]
	}
	return result, nil
}

func (s *CMDBService) loadTypeIDsByCode() (map[string]uint64, error) {
	type row struct {
		ID       uint64 `gorm:"column:id"`
		TypeCode string `gorm:"column:type_code"`
		Status   int    `gorm:"column:status"`
	}
	var rows []row
	if err := s.db.Model(&BizCMDBType{}).Select("id, type_code, status").Where("status = ?", 1).Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]uint64, len(rows))
	for _, row := range rows {
		result[row.TypeCode] = row.ID
	}
	return result, nil
}

func (s *CMDBService) loadItemsByCode() (map[string]*BizCMDBItem, error) {
	var rows []BizCMDBItem
	if err := s.db.Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]*BizCMDBItem, len(rows))
	for index := range rows {
		result[rows[index].ItemCode] = &rows[index]
	}
	return result, nil
}

func (s *CMDBService) listTypesForExport(query *CMDBTypeListQuery) ([]BizCMDBType, error) {
	var rows []BizCMDBType
	db := s.db.Model(&BizCMDBType{})
	if query != nil {
		if strings.TrimSpace(query.TypeCode) != "" {
			db = db.Where("type_code LIKE ?", "%"+strings.TrimSpace(query.TypeCode)+"%")
		}
		if strings.TrimSpace(query.TypeName) != "" {
			db = db.Where("type_name LIKE ?", "%"+strings.TrimSpace(query.TypeName)+"%")
		}
		if strings.TrimSpace(query.Category) != "" {
			db = db.Where("category = ?", strings.TrimSpace(query.Category))
		}
		if query.Status != nil && (*query.Status == 1 || *query.Status == 2) {
			db = db.Where("status = ?", *query.Status)
		}
	}
	if err := db.Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: false}).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (s *CMDBService) listItemsForExport(query *CMDBItemListQuery) ([]BizCMDBItem, error) {
	var rows []BizCMDBItem
	db := s.db.Model(&BizCMDBItem{})
	if query != nil {
		if query.TypeID > 0 {
			db = db.Where("type_id = ?", query.TypeID)
		}
		if strings.TrimSpace(query.ItemCode) != "" {
			db = db.Where("item_code LIKE ?", "%"+strings.TrimSpace(query.ItemCode)+"%")
		}
		if strings.TrimSpace(query.ItemName) != "" {
			db = db.Where("item_name LIKE ?", "%"+strings.TrimSpace(query.ItemName)+"%")
		}
		if strings.TrimSpace(query.Environment) != "" {
			db = db.Where("environment = ?", strings.TrimSpace(query.Environment))
		}
		if strings.TrimSpace(query.Status) != "" {
			db = db.Where("status = ?", strings.TrimSpace(query.Status))
		}
	}
	if err := db.Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: false}).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (s *CMDBService) seedDefaultTypes() error {
	for _, seed := range defaultCMDBTypeSeeds {
		var count int64
		if err := s.db.Model(&BizCMDBType{}).Where("type_code = ?", seed.TypeCode).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := s.db.Create(&BizCMDBType{
			TypeCode: seed.TypeCode,
			TypeName: seed.TypeName,
			Category: seed.Category,
			Status:   normalizeStatus(seed.Status),
			Remark:   seed.Remark,
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *CMDBService) seedDefaultDicts() error {
	if !s.db.Migrator().HasTable("system_dict_type") || !s.db.Migrator().HasTable("system_dict_item") {
		return nil
	}
	for _, seed := range defaultCMDBDictTypes {
		var count int64
		if err := s.db.Table("system_dict_type").Where("dict_code = ?", seed.DictCode).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := s.db.Table("system_dict_type").Create(map[string]interface{}{
			"dict_code":  seed.DictCode,
			"dict_name":  seed.DictName,
			"module":     seed.Module,
			"status":     normalizeStatus(seed.Status),
			"remark":     seed.Remark,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		}).Error; err != nil {
			return err
		}
	}
	for _, seed := range defaultCMDBDictItems {
		var count int64
		if err := s.db.Table("system_dict_item").Where("dict_code = ? AND item_value = ?", seed.DictCode, seed.ItemValue).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		if err := s.db.Table("system_dict_item").Create(map[string]interface{}{
			"dict_code":      seed.DictCode,
			"item_label_key": seed.ItemLabelKey,
			"item_value":     seed.ItemValue,
			"item_color":     seed.ItemColor,
			"sort":           seed.Sort,
			"status":         normalizeStatus(seed.Status),
			"remark":         seed.Remark,
			"created_at":     time.Now(),
			"updated_at":     time.Now(),
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func toCMDBTypeResp(row BizCMDBType) CMDBTypeResp {
	return CMDBTypeResp{
		ID:        row.ID,
		TypeCode:  row.TypeCode,
		TypeName:  row.TypeName,
		Category:  row.Category,
		Status:    row.Status,
		Remark:    row.Remark,
		CreatedAt: row.CreatedAt.Format(time.RFC3339),
		UpdatedAt: row.UpdatedAt.Format(time.RFC3339),
	}
}

func toCMDBItemResp(row BizCMDBItem, typeRow BizCMDBType) CMDBItemResp {
	return CMDBItemResp{
		ID:          row.ID,
		TypeID:      row.TypeID,
		TypeCode:    typeRow.TypeCode,
		TypeName:    typeRow.TypeName,
		ItemCode:    row.ItemCode,
		ItemName:    row.ItemName,
		Environment: row.Environment,
		Status:      row.Status,
		OwnerUserID: row.OwnerUserID,
		OwnerDeptID: row.OwnerDeptID,
		Endpoint:    row.Endpoint,
		Description: row.Description,
		CreatedAt:   row.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   row.UpdatedAt.Format(time.RFC3339),
	}
}

func toCMDBRelationResp(row BizCMDBRelation, sourceItem BizCMDBItem, targetItem BizCMDBItem) CMDBRelationResp {
	return CMDBRelationResp{
		ID:             row.ID,
		SourceItemID:   row.SourceItemID,
		SourceItemCode: sourceItem.ItemCode,
		SourceItemName: sourceItem.ItemName,
		TargetItemID:   row.TargetItemID,
		TargetItemCode: targetItem.ItemCode,
		TargetItemName: targetItem.ItemName,
		RelationType:   row.RelationType,
		Remark:         row.Remark,
		CreatedAt:      row.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      row.UpdatedAt.Format(time.RFC3339),
	}
}

func normalizePage(page int, pageSize int) (int, int) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return page, pageSize
}

func queryPage(query *CMDBTypeListQuery) int {
	if query == nil {
		return 1
	}
	return query.Page
}

func queryPageSize(query *CMDBTypeListQuery) int {
	if query == nil {
		return 10
	}
	return query.PageSize
}

func itemQueryPage(query *CMDBItemListQuery) int {
	if query == nil {
		return 1
	}
	return query.Page
}

func itemQueryPageSize(query *CMDBItemListQuery) int {
	if query == nil {
		return 10
	}
	return query.PageSize
}

func normalizeStatus(status int) int {
	if status == 2 {
		return 2
	}
	return 1
}

func normalizeEnvironment(environment string) string {
	value := strings.TrimSpace(environment)
	switch value {
	case "dev", "test", "staging", "prod":
		return value
	default:
		return "dev"
	}
}

func normalizeItemStatus(status string) string {
	value := strings.TrimSpace(status)
	switch value {
	case "active", "inactive", "maintenance":
		return value
	default:
		return "active"
	}
}

func (s *CMDBService) validateRelationType(value string) error {
	relationType := strings.TrimSpace(value)
	if relationType == "" {
		return errors.New("cmdb.relation.type.required")
	}
	if s.db.Migrator().HasTable("system_dict_item") {
		var count int64
		if err := s.db.Table("system_dict_item").Where("dict_code = ? AND item_value = ? AND status = ?", "cmdb_relation_type", relationType, 1).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return nil
		}
	}
	switch relationType {
	case "depends_on", "deployed_on", "connects_to", "backed_by":
		return nil
	default:
		return errors.New("cmdb.relation.type.invalid")
	}
}

func validateImportEnvironment(value string) error {
	switch strings.TrimSpace(value) {
	case "dev", "test", "staging", "prod":
		return nil
	default:
		return errors.New("cmdb.item.environment.invalid")
	}
}

func validateImportItemStatus(value string) error {
	switch strings.TrimSpace(value) {
	case "active", "inactive", "maintenance":
		return nil
	default:
		return errors.New("cmdb.item.status.invalid")
	}
}
