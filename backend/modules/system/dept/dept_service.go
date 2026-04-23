package system

import (
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DeptService struct {
	db *gorm.DB
}

const defaultRootDeptName = "Pantheon Base"

func NewDeptService(db *gorm.DB) *DeptService {
	return &DeptService{db: db}
}

func (s *DeptService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&SystemDept{}); err != nil {
		return err
	}
	return s.ensureRootDept()
}

func (s *DeptService) GetDeptTree(query *DeptListQuery) ([]*DeptTreeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var depts []SystemDept
	sortColumn, sortDesc := normalizeDeptSort(query)
	if err := s.db.Model(&SystemDept{}).
		Order(clause.OrderByColumn{Column: clause.Column{Name: sortColumn}, Desc: sortDesc}).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: false}).
		Find(&depts).Error; err != nil {
		return nil, err
	}

	depts = filterDeptTreeNodes(depts, query)
	return buildDeptTree(depts, 0), nil
}

func (s *DeptService) CreateDept(req *DeptCreateReq) (*DeptTreeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if err := s.validateDeptCreate(req); err != nil {
		return nil, err
	}

	ancestors, err := s.buildAncestors(req.ParentID)
	if err != nil {
		return nil, err
	}

	dept := SystemDept{
		ParentID:  req.ParentID,
		Ancestors: ancestors,
		DeptName:  strings.TrimSpace(req.DeptName),
		Sort:      req.Sort,
		Leader:    strings.TrimSpace(req.Leader),
		Phone:     strings.TrimSpace(req.Phone),
		Email:     strings.TrimSpace(req.Email),
		Status:    normalizeSystemStatus(req.Status),
	}
	if err := s.db.Create(&dept).Error; err != nil {
		return nil, err
	}
	return toDeptTreeResp(dept), nil
}

func (s *DeptService) UpdateDept(deptID uint64, req *DeptUpdateReq) (*DeptTreeResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var dept SystemDept
	if err := s.db.First(&dept, deptID).Error; err != nil {
		return nil, err
	}
	if err := s.validateDeptUpdate(&dept, req); err != nil {
		return nil, err
	}

	ancestors, err := s.buildAncestors(req.ParentID)
	if err != nil {
		return nil, err
	}

	dept.ParentID = req.ParentID
	dept.Ancestors = ancestors
	dept.IsRoot = normalizeDeptRootFlag(dept.IsRoot)
	dept.DeptName = strings.TrimSpace(req.DeptName)
	dept.Sort = req.Sort
	dept.Leader = strings.TrimSpace(req.Leader)
	dept.Phone = strings.TrimSpace(req.Phone)
	dept.Email = strings.TrimSpace(req.Email)
	dept.Status = normalizeSystemStatus(req.Status)

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&dept).Error; err != nil {
			return err
		}
		return s.refreshChildAncestors(tx, dept.ID)
	}); err != nil {
		return nil, err
	}

	return toDeptTreeResp(dept), nil
}

func (s *DeptService) DeleteDept(deptID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}

	var dept SystemDept
	if err := s.db.First(&dept, deptID).Error; err != nil {
		return err
	}
	if dept.IsRoot == 1 {
		return errors.New("dept.root.delete_forbidden")
	}

	var childCount int64
	if err := s.db.Model(&SystemDept{}).Where("parent_id = ?", deptID).Count(&childCount).Error; err != nil {
		return err
	}
	if childCount > 0 {
		return errors.New("dept.delete.error.has_children")
	}

	var userCount int64
	if err := s.db.Table("system_user").Where("dept_id = ? AND deleted_at IS NULL", deptID).Count(&userCount).Error; err != nil {
		return err
	}
	if userCount > 0 {
		return errors.New("dept.delete.error.has_users")
	}

	return s.db.Delete(&SystemDept{}, deptID).Error
}

func (s *DeptService) BatchUpdateDeptStatus(deptIDs []uint64, status int) (int, error) {
	if s.db == nil {
		return 0, errors.New("database.not_initialized")
	}
	normalizedIDs := normalizeDeptIDs(deptIDs)
	if len(normalizedIDs) == 0 {
		return 0, errors.New("dept.batch.empty")
	}
	if status != 1 && status != 2 {
		return 0, errors.New("param.invalid")
	}

	var depts []SystemDept
	if err := s.db.Where("id IN ?", normalizedIDs).Find(&depts).Error; err != nil {
		return 0, err
	}
	if len(depts) != len(normalizedIDs) {
		return 0, errors.New("dept.batch.not_found")
	}
	for _, dept := range depts {
		if dept.IsRoot == 1 {
			return 0, errors.New("dept.root.status_fixed")
		}
	}

	if err := s.db.Model(&SystemDept{}).
		Where("id IN ?", normalizedIDs).
		Updates(map[string]any{
			"status":     normalizeSystemStatus(status),
			"updated_at": time.Now(),
		}).Error; err != nil {
		return 0, err
	}

	return len(normalizedIDs), nil
}

func (s *DeptService) ExportDepts(query *DeptListQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	depts, err := s.listDeptsForExport(query)
	if err != nil {
		return nil, err
	}
	pathByID, _, err := impexp.BuildDeptPathMaps(s.db)
	if err != nil {
		return nil, err
	}

	rows := make([][]string, 0, len(depts))
	for _, dept := range depts {
		if dept.IsRoot == 1 {
			continue
		}
		rows = append(rows, []string{
			pathByID[dept.ParentID],
			dept.DeptName,
			fmt.Sprintf("%d", dept.Sort),
			dept.Leader,
			dept.Phone,
			dept.Email,
			fmt.Sprintf("%d", dept.Status),
		})
	}

	return &impexp.CSVFile{
		Filename: "system-dept-export.csv",
		Headers:  []string{"parentDeptPath", "deptName", "sort", "leader", "phone", "email", "status"},
		Rows:     rows,
	}, nil
}

func (s *DeptService) BuildDeptImportTemplate() *impexp.CSVFile {
	return &impexp.CSVFile{
		Filename: "system-dept-import-template.csv",
		Headers:  []string{"parentDeptPath", "deptName", "sort", "leader", "phone", "email", "status"},
		Rows: [][]string{
			{"#说明：保留第一行表头；parentDeptPath 使用部门导出的完整路径；根节点下创建部门时通常填写 Pantheon Base；status 使用 1=启用、2=禁用。", "", "", "", "", "", ""},
			{"#Pantheon Base", "研发中心", "10", "张三", "13800138000", "rd@example.com", "1"},
		},
	}
}

func (s *DeptService) ImportDepts(records [][]string) (*impexp.ImportResult, error) {
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
	requiredHeaders := []string{"parentDeptPath", "deptName", "sort", "leader", "phone", "email", "status"}
	for _, header := range requiredHeaders {
		if _, ok := headerIndex[header]; !ok {
			impexp.AppendImportError(result, 0, header, "import.header.missing")
		}
	}
	if result.Failed > 0 {
		return result, nil
	}

	type importRow struct {
		RowNumber      int
		ParentDeptPath string
		DeptName       string
		Sort           int
		Leader         string
		Phone          string
		Email          string
		Status         int
	}

	rows := make([]importRow, 0, len(records)-1)
	seenPaths := make(map[string]int, len(records)-1)
	for rowIndex := 1; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]
		if impexp.IsCSVRecordEmpty(record) {
			continue
		}
		rowNumber := rowIndex + 1
		parentPath := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "parentDeptPath"))
		deptName := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "deptName"))
		sortValue, sortErr := impexp.ParseCSVInt(impexp.ReadCSVField(record, headerIndex, "sort"))
		email := strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "email"))
		if parentPath == "" {
			impexp.AppendImportError(result, rowNumber, "parentDeptPath", "dept.parent.required")
		}
		if deptName == "" {
			impexp.AppendImportError(result, rowNumber, "deptName", "dept.name.required")
		}
		if sortErr != nil {
			impexp.AppendImportError(result, rowNumber, "sort", "import.field.invalid_integer")
		}
		if err := validateDeptOptionalEmail(email); err != nil {
			impexp.AppendImportError(result, rowNumber, "email", err.Error())
		}
		fullPath := parentPath + "/" + deptName
		if firstRow, ok := seenPaths[fullPath]; ok {
			impexp.AppendImportError(result, rowNumber, "deptName", fmt.Sprintf("import.duplicate.row.%d", firstRow))
		} else {
			seenPaths[fullPath] = rowNumber
		}
		rows = append(rows, importRow{
			RowNumber:      rowNumber,
			ParentDeptPath: parentPath,
			DeptName:       deptName,
			Sort:           sortValue,
			Leader:         strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "leader")),
			Phone:          strings.TrimSpace(impexp.ReadCSVField(record, headerIndex, "phone")),
			Email:          email,
			Status:         impexp.ParseEnabledStatus(impexp.ReadCSVField(record, headerIndex, "status")),
		})
	}

	if result.Failed > 0 {
		return result, nil
	}

	_, pathToID, err := impexp.BuildDeptPathMaps(s.db)
	if err != nil {
		return nil, err
	}
	rollbackValidation := errors.New("dept.import.validation_failed")
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			parentID := pathToID[row.ParentDeptPath]
			if parentID == 0 {
				impexp.AppendImportError(result, row.RowNumber, "parentDeptPath", "dept.parent.not_found")
				return rollbackValidation
			}

			var dept SystemDept
			err := tx.Where("parent_id = ? AND dept_name = ?", parentID, row.DeptName).First(&dept).Error
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}

			if errors.Is(err, gorm.ErrRecordNotFound) {
				ancestors, buildErr := s.buildAncestorsWithDB(tx, parentID)
				if buildErr != nil {
					return buildErr
				}
				dept = SystemDept{
					ParentID:  parentID,
					Ancestors: ancestors,
					IsRoot:    0,
					DeptName:  row.DeptName,
					Sort:      row.Sort,
					Leader:    row.Leader,
					Phone:     row.Phone,
					Email:     row.Email,
					Status:    normalizeSystemStatus(row.Status),
				}
				if err := tx.Create(&dept).Error; err != nil {
					return err
				}
				result.Created++
			} else {
				if dept.IsRoot == 1 {
					impexp.AppendImportError(result, row.RowNumber, "deptName", "dept.root.update_forbidden")
					return rollbackValidation
				}
				dept.Sort = row.Sort
				dept.Leader = row.Leader
				dept.Phone = row.Phone
				dept.Email = row.Email
				dept.Status = normalizeSystemStatus(row.Status)
				if err := tx.Save(&dept).Error; err != nil {
					return err
				}
				result.Updated++
			}
			pathToID[row.ParentDeptPath+"/"+row.DeptName] = dept.ID
		}
		return nil
	}); err != nil {
		if errors.Is(err, rollbackValidation) {
			return result, nil
		}
		return nil, err
	}

	result.Applied = true
	return result, nil
}

func (s *DeptService) listDeptsForExport(query *DeptListQuery) ([]SystemDept, error) {
	var depts []SystemDept
	sortColumn, sortDesc := normalizeDeptSort(query)
	if err := s.db.Model(&SystemDept{}).
		Order(clause.OrderByColumn{Column: clause.Column{Name: sortColumn}, Desc: sortDesc}).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: false}).
		Find(&depts).Error; err != nil {
		return nil, err
	}
	return filterDeptTreeNodes(depts, query), nil
}

func (s *DeptService) validateDeptCreate(req *DeptCreateReq) error {
	if req.ParentID == 0 {
		return errors.New("dept.parent.required")
	}
	if err := validateDeptOptionalEmail(req.Email); err != nil {
		return err
	}
	return s.ensureDeptParentExists(req.ParentID)
}

func (s *DeptService) validateDeptUpdate(dept *SystemDept, req *DeptUpdateReq) error {
	if dept == nil {
		return errors.New("dept.not_found")
	}
	if req.ParentID == dept.ID {
		return errors.New("dept.update.error.parent_self")
	}
	if dept.IsRoot == 1 {
		if req.ParentID != 0 {
			return errors.New("dept.root.parent_fixed")
		}
		if normalizeSystemStatus(req.Status) != 1 {
			return errors.New("dept.root.status_fixed")
		}
	} else if req.ParentID == 0 {
		return errors.New("dept.parent.required")
	}
	if err := validateDeptOptionalEmail(req.Email); err != nil {
		return err
	}
	if err := s.ensureDeptParentExists(req.ParentID); err != nil {
		return err
	}
	return s.ensureDeptParentNotDescendant(dept.ID, req.ParentID)
}

func (s *DeptService) ensureDeptParentExists(parentID uint64) error {
	if parentID == 0 {
		return nil
	}

	var count int64
	if err := s.db.Model(&SystemDept{}).Where("id = ?", parentID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("dept.parent.not_found")
	}
	return nil
}

func (s *DeptService) ensureDeptParentNotDescendant(deptID uint64, parentID uint64) error {
	if parentID == 0 {
		return nil
	}

	var parent SystemDept
	if err := s.db.First(&parent, parentID).Error; err != nil {
		return err
	}
	ancestors := splitAncestors(parent.Ancestors)
	for _, ancestorID := range ancestors {
		if ancestorID == deptID {
			return errors.New("dept.update.error.parent_descendant")
		}
	}
	return nil
}

func (s *DeptService) buildAncestors(parentID uint64) (string, error) {
	return s.buildAncestorsWithDB(s.db, parentID)
}

func (s *DeptService) buildAncestorsWithDB(db *gorm.DB, parentID uint64) (string, error) {
	if parentID == 0 {
		return "", nil
	}

	var parent SystemDept
	if err := db.First(&parent, parentID).Error; err != nil {
		return "", err
	}
	if parent.Ancestors == "" {
		return fmt.Sprintf("%d", parent.ID), nil
	}
	return fmt.Sprintf("%s,%d", parent.Ancestors, parent.ID), nil
}

func (s *DeptService) refreshChildAncestors(tx *gorm.DB, deptID uint64) error {
	var children []SystemDept
	if err := tx.Where("parent_id = ?", deptID).Find(&children).Error; err != nil {
		return err
	}
	if len(children) == 0 {
		return nil
	}

	var parent SystemDept
	if err := tx.First(&parent, deptID).Error; err != nil {
		return err
	}
	for _, child := range children {
		if parent.Ancestors == "" {
			child.Ancestors = fmt.Sprintf("%d", parent.ID)
		} else {
			child.Ancestors = fmt.Sprintf("%s,%d", parent.Ancestors, parent.ID)
		}
		if err := tx.Model(&child).Update("ancestors", child.Ancestors).Error; err != nil {
			return err
		}
		if err := s.refreshChildAncestors(tx, child.ID); err != nil {
			return err
		}
	}
	return nil
}

func (s *DeptService) ensureRootDept() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var root SystemDept
		err := tx.Where("is_root = ?", 1).Order("id asc").First(&root).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			root = SystemDept{
				ParentID:  0,
				Ancestors: "",
				IsRoot:    1,
				DeptName:  defaultRootDeptName,
				Sort:      0,
				Status:    1,
			}
			if err := tx.Create(&root).Error; err != nil {
				return err
			}
		} else {
			root.ParentID = 0
			root.Ancestors = ""
			root.IsRoot = 1
			root.Status = 1
			if err := tx.Save(&root).Error; err != nil {
				return err
			}
		}

		var topLevelDepts []SystemDept
		if err := tx.Where("parent_id = ? AND id <> ?", 0, root.ID).Find(&topLevelDepts).Error; err != nil {
			return err
		}
		for _, dept := range topLevelDepts {
			dept.ParentID = root.ID
			dept.Ancestors = fmt.Sprintf("%d", root.ID)
			dept.IsRoot = 0
			if err := tx.Save(&dept).Error; err != nil {
				return err
			}
			if err := s.refreshChildAncestors(tx, dept.ID); err != nil {
				return err
			}
		}

		return tx.Model(&SystemDept{}).
			Where("id <> ? AND is_root = ?", root.ID, 1).
			Update("is_root", 0).Error
	})
}

func normalizeDeptSort(query *DeptListQuery) (string, bool) {
	if query == nil {
		return "sort", false
	}

	sortWhitelist := map[string]string{
		"id":        "id",
		"deptName":  "dept_name",
		"dept_name": "dept_name",
		"sort":      "sort",
		"leader":    "leader",
		"status":    "status",
	}
	column, ok := sortWhitelist[strings.TrimSpace(query.SortField)]
	if !ok {
		column = "sort"
	}
	return column, strings.ToLower(strings.TrimSpace(query.SortOrder)) == "desc"
}

func filterDeptTreeNodes(depts []SystemDept, query *DeptListQuery) []SystemDept {
	if query == nil {
		return depts
	}

	nameFilter := strings.TrimSpace(query.DeptName)
	statusFilterEnabled := query.Status != nil && (*query.Status == 1 || *query.Status == 2)
	if nameFilter == "" && !statusFilterEnabled {
		return depts
	}

	byID := make(map[uint64]SystemDept, len(depts))
	included := make(map[uint64]struct{}, len(depts))
	for _, dept := range depts {
		byID[dept.ID] = dept
		if matchesDeptQuery(dept, nameFilter, query.Status) {
			included[dept.ID] = struct{}{}
			for _, ancestorID := range splitAncestors(dept.Ancestors) {
				if _, ok := byID[ancestorID]; ok {
					included[ancestorID] = struct{}{}
				}
			}
		}
	}

	filtered := make([]SystemDept, 0, len(included))
	for _, dept := range depts {
		if _, ok := included[dept.ID]; ok {
			filtered = append(filtered, dept)
		}
	}
	return filtered
}

func matchesDeptQuery(dept SystemDept, nameFilter string, status *int) bool {
	if nameFilter != "" && !strings.Contains(strings.ToLower(dept.DeptName), strings.ToLower(nameFilter)) {
		return false
	}
	if status != nil && (*status == 1 || *status == 2) && dept.Status != *status {
		return false
	}
	return true
}

func buildDeptTree(depts []SystemDept, parentID uint64) []*DeptTreeResp {
	tree := make([]*DeptTreeResp, 0)
	for _, dept := range depts {
		if dept.ParentID != parentID {
			continue
		}
		node := toDeptTreeResp(dept)
		node.Children = buildDeptTree(depts, dept.ID)
		tree = append(tree, node)
	}
	return tree
}

func toDeptTreeResp(dept SystemDept) *DeptTreeResp {
	return &DeptTreeResp{
		ID:        dept.ID,
		ParentID:  dept.ParentID,
		Ancestors: dept.Ancestors,
		IsRoot:    dept.IsRoot == 1,
		DeptName:  dept.DeptName,
		Sort:      dept.Sort,
		Leader:    dept.Leader,
		Phone:     dept.Phone,
		Email:     dept.Email,
		Status:    dept.Status,
	}
}

func splitAncestors(value string) []uint64 {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]uint64, 0, len(parts))
	for _, part := range parts {
		var id uint64
		_, _ = fmt.Sscanf(strings.TrimSpace(part), "%d", &id)
		if id > 0 {
			result = append(result, id)
		}
	}
	return result
}

func normalizeSystemStatus(status int) int {
	if status == 2 {
		return 2
	}
	return 1
}

func normalizeDeptIDs(ids []uint64) []uint64 {
	seen := make(map[uint64]struct{}, len(ids))
	result := make([]uint64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	return result
}

func normalizeDeptRootFlag(value int) int {
	if value == 1 {
		return 1
	}
	return 0
}

func validateDeptOptionalEmail(value string) error {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	if _, err := mail.ParseAddress(value); err != nil {
		return errors.New("dept.email.invalid")
	}
	return nil
}
