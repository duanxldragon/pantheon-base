package system

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/impexp"

	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&middleware.SystemLogOper{}); err != nil {
		return err
	}
	return repairSQLiteTemporalTables(s.db, sqliteTemporalTableRepair{
		tableName: "system_log_oper",
		createSQL: `CREATE TABLE system_log_oper (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NULL,
business_type INTEGER DEFAULT 0,
method TEXT NULL,
oper_name TEXT NULL,
oper_url TEXT NULL,
oper_ip TEXT NULL,
oper_param TEXT NULL,
json_result TEXT NULL,
status INTEGER DEFAULT 1,
error_msg TEXT NULL,
oper_time DATETIME NULL,
cost_time INTEGER DEFAULT 0
)`,
		copySQL: `INSERT INTO __pantheon_repair_system_log_oper (
id, title, business_type, method, oper_name, oper_url, oper_ip, oper_param, json_result, status, error_msg, oper_time, cost_time
)
SELECT
id,
title,
business_type,
method,
oper_name,
oper_url,
oper_ip,
oper_param,
json_result,
status,
error_msg,
oper_time,
cost_time
FROM system_log_oper`,
		columnTypes: map[string]string{
			"oper_time": "DATETIME",
		},
	})
}

func (s *AuditService) ListOperationLogs(query *OperationLogQuery) (*OperationLogPageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	page := 1
	pageSize := 10
	if query != nil {
		if query.Page > 0 {
			page = query.Page
		}
		if query.PageSize > 0 {
			pageSize = query.PageSize
		}
	}

	db := s.db.Model(&middleware.SystemLogOper{})
	if query != nil {
		if strings.TrimSpace(query.Title) != "" {
			db = db.Where("title LIKE ?", "%"+strings.TrimSpace(query.Title)+"%")
		}
		if strings.TrimSpace(query.OperName) != "" {
			db = db.Where("oper_name LIKE ?", "%"+strings.TrimSpace(query.OperName)+"%")
		}
		if query.Status != nil {
			db = db.Where("status = ?", *query.Status)
		}
		if query.BusinessType != nil {
			db = db.Where("business_type = ?", *query.BusinessType)
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []middleware.SystemLogOper
	if err := db.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]OperationLogResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, OperationLogResp{
			ID:           row.ID,
			Title:        row.Title,
			BusinessType: row.BusinessType,
			Method:       row.Method,
			OperName:     row.OperName,
			OperURL:      row.OperURL,
			OperIP:       row.OperIP,
			OperParam:    row.OperParam,
			JsonResult:   row.JsonResult,
			Status:       row.Status,
			ErrorMsg:     row.ErrorMsg,
			OperTime:     row.OperTime.Format(time.RFC3339),
			CostTime:     row.CostTime,
		})
	}

	return &OperationLogPageResp{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *AuditService) ExportOperationLogs(query *OperationLogQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	rows, err := s.listOperationLogsForExport(query)
	if err != nil {
		return nil, err
	}
	result := make([][]string, 0, len(rows))
	for _, row := range rows {
		result = append(result, []string{
			row.Title,
			fmt.Sprintf("%d", row.BusinessType),
			row.Method,
			row.OperName,
			row.OperURL,
			row.OperIP,
			fmt.Sprintf("%d", row.Status),
			row.ErrorMsg,
			row.OperTime.Format(time.RFC3339),
			fmt.Sprintf("%d", row.CostTime),
		})
	}

	return &impexp.CSVFile{
		Filename: "system-operation-log-export.csv",
		Headers:  []string{"title", "businessType", "method", "operName", "operUrl", "operIp", "status", "errorMsg", "operTime", "costTime"},
		Rows:     result,
	}, nil
}

func (s *AuditService) DeleteOperationLog(logID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.Delete(&middleware.SystemLogOper{}, logID).Error
}

func (s *AuditService) ClearOperationLogs() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.Exec("TRUNCATE TABLE system_log_oper").Error
}

func (s *AuditService) listOperationLogsForExport(query *OperationLogQuery) ([]middleware.SystemLogOper, error) {
	var rows []middleware.SystemLogOper
	db := s.db.Model(&middleware.SystemLogOper{})
	if query != nil {
		if strings.TrimSpace(query.Title) != "" {
			db = db.Where("title LIKE ?", "%"+strings.TrimSpace(query.Title)+"%")
		}
		if strings.TrimSpace(query.OperName) != "" {
			db = db.Where("oper_name LIKE ?", "%"+strings.TrimSpace(query.OperName)+"%")
		}
		if query.Status != nil {
			db = db.Where("status = ?", *query.Status)
		}
		if query.BusinessType != nil {
			db = db.Where("business_type = ?", *query.BusinessType)
		}
	}
	if err := db.Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

type sqliteTemporalTableRepair struct {
	tableName   string
	createSQL   string
	copySQL     string
	indexSQL    []string
	columnTypes map[string]string
}

func repairSQLiteTemporalTables(db *gorm.DB, repairs ...sqliteTemporalTableRepair) error {
	if db == nil || db.Dialector.Name() != "sqlite" {
		return nil
	}
	for _, repair := range repairs {
		needsRepair, err := sqliteTableNeedsRepair(db, repair.tableName, repair.columnTypes)
		if err != nil || !needsRepair {
			if err != nil {
				return err
			}
			continue
		}
		if err := rebuildSQLiteTable(db, repair); err != nil {
			return err
		}
	}
	return nil
}

func sqliteTableNeedsRepair(db *gorm.DB, tableName string, columnTypes map[string]string) (bool, error) {
	if !db.Migrator().HasTable(tableName) {
		return false, nil
	}
	rows, err := db.Raw(fmt.Sprintf("PRAGMA table_info(%s)", tableName)).Rows()
	if err != nil {
		return false, err
	}
	defer rows.Close()

	seen := make(map[string]bool, len(columnTypes))
	for rows.Next() {
		var cid int
		var name string
		var dataType string
		var notNull int
		var defaultValue interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			return false, err
		}
		expectedType, ok := columnTypes[name]
		if !ok {
			continue
		}
		seen[name] = true
		if !strings.EqualFold(strings.TrimSpace(dataType), expectedType) {
			return true, nil
		}
	}
	for name := range columnTypes {
		if !seen[name] {
			return true, nil
		}
	}
	return false, nil
}

func rebuildSQLiteTable(db *gorm.DB, repair sqliteTemporalTableRepair) error {
	tempTableName := "__pantheon_repair_" + repair.tableName
	statements := []string{
		fmt.Sprintf("DROP TABLE IF EXISTS %s", tempTableName),
		strings.Replace(repair.createSQL, repair.tableName, tempTableName, 1),
	}
	if db.Migrator().HasTable(repair.tableName) {
		statements = append(statements, repair.copySQL)
		statements = append(statements,
			fmt.Sprintf("DROP TABLE %s", repair.tableName),
			fmt.Sprintf("ALTER TABLE %s RENAME TO %s", tempTableName, repair.tableName),
		)
	} else {
		statements = append(statements,
			fmt.Sprintf("ALTER TABLE %s RENAME TO %s", tempTableName, repair.tableName),
		)
	}
	statements = append(statements, repair.indexSQL...)

	return db.Transaction(func(tx *gorm.DB) error {
		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
