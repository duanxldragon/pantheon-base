package generator

import (
	"errors"
	"fmt"
	"net/netip"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	mysqlDriver "github.com/go-sql-driver/mysql"
	mysqlgorm "gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type GeneratorService struct {
	db *gorm.DB
}

func NewGeneratorService(db *gorm.DB) *GeneratorService {
	return &GeneratorService{db: db}
}

type tableRow struct {
	TableName    string `gorm:"column:table_name"`
	TableComment string `gorm:"column:table_comment"`
	Engine       string `gorm:"column:engine"`
	TableRows    int64  `gorm:"column:table_rows"`
}

type columnRow struct {
	ColumnName    string `gorm:"column:column_name"`
	DataType      string `gorm:"column:data_type"`
	ColumnType    string `gorm:"column:column_type"`
	ColumnKey     string `gorm:"column:column_key"`
	IsNullable    string `gorm:"column:is_nullable"`
	Extra         string `gorm:"column:extra"`
	ColumnComment string `gorm:"column:column_comment"`
}

type generatorSchemaReader struct {
	db     *gorm.DB
	schema string
	close  func() error
}

func (s *GeneratorService) ListDatasources() ([]GeneratorDatasourceResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	schemaName, err := s.currentSchema()
	if err != nil {
		return nil, err
	}

	items := []GeneratorDatasourceResp{{
		ID:            generatorDatasourceCurrentID,
		Name:          "当前平台库",
		Driver:        "mysql",
		DatabaseName:  schemaName,
		Status:        generatorDatasourceEnabled,
		ReadonlyScope: "metadata_only",
		IsCurrent:     true,
	}}

	var rows []GeneratorDatasource
	if err := s.db.Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		items = append(items, buildDatasourceResp(row))
	}
	return items, nil
}

func (s *GeneratorService) CreateDatasource(req *UpsertGeneratorDatasourceReq) (*GeneratorDatasourceResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	row, err := normalizeDatasourceReq(req, true)
	if err != nil {
		return nil, err
	}
	if err := s.db.Create(row).Error; err != nil {
		return nil, err
	}
	resp := buildDatasourceResp(*row)
	return &resp, nil
}

func (s *GeneratorService) UpdateDatasource(id string, req *UpsertGeneratorDatasourceReq) (*GeneratorDatasourceResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	numericID, err := parseDatasourceNumericID(id)
	if err != nil {
		return nil, err
	}

	var existing GeneratorDatasource
	if err := s.db.First(&existing, numericID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("generator.datasource.not_found")
		}
		return nil, err
	}

	row, err := normalizeDatasourceReq(req, false)
	if err != nil {
		return nil, err
	}
	existing.Name = row.Name
	existing.Driver = row.Driver
	existing.Host = row.Host
	existing.Port = row.Port
	existing.DatabaseName = row.DatabaseName
	existing.Username = row.Username
	existing.Status = row.Status
	existing.Remark = row.Remark
	existing.ReadonlyScope = row.ReadonlyScope
	if strings.TrimSpace(row.PasswordEncrypted) != "" {
		existing.PasswordEncrypted = row.PasswordEncrypted
	}
	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}
	resp := buildDatasourceResp(existing)
	return &resp, nil
}

func (s *GeneratorService) DeleteDatasource(id string) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	numericID, err := parseDatasourceNumericID(id)
	if err != nil {
		return err
	}
	result := s.db.Delete(&GeneratorDatasource{}, numericID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("generator.datasource.not_found")
	}
	return nil
}

func (s *GeneratorService) TestDatasource(id string) (*GeneratorDatasourceResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if strings.TrimSpace(id) == "" || id == generatorDatasourceCurrentID {
		schemaName, err := s.currentSchema()
		if err != nil {
			return nil, err
		}
		now := time.Now().Format(time.RFC3339)
		return &GeneratorDatasourceResp{
			ID:              generatorDatasourceCurrentID,
			Name:            "当前平台库",
			Driver:          "mysql",
			DatabaseName:    schemaName,
			Status:          generatorDatasourceEnabled,
			ReadonlyScope:   "metadata_only",
			LastCheckedAt:   now,
			LastCheckStatus: "success",
			IsCurrent:       true,
		}, nil
	}

	row, err := s.loadDatasource(id)
	if err != nil {
		return nil, err
	}
	reader, err := s.openSchemaReader(id)
	now := time.Now()
	status := "success"
	lastError := ""
	if err != nil {
		status = "failed"
		lastError = trimErrorMessage(err.Error())
	} else if reader.close != nil {
		_ = reader.close()
	}

	if saveErr := s.db.Model(row).Updates(map[string]interface{}{
		"last_checked_at":   &now,
		"last_check_status": status,
		"last_check_error":  lastError,
	}).Error; saveErr != nil {
		return nil, saveErr
	}
	if err != nil {
		return nil, err
	}
	row.LastCheckedAt = &now
	row.LastCheckStatus = status
	row.LastCheckError = lastError
	resp := buildDatasourceResp(*row)
	return &resp, nil
}

func (s *GeneratorService) ListTables(datasourceID string, keyword string) ([]TableOptionResp, error) {
	reader, err := s.openSchemaReader(datasourceID)
	if err != nil {
		return nil, err
	}
	if reader.close != nil {
		defer reader.close()
	}

	query := reader.db.Table("information_schema.tables").
		Select("table_name, table_comment, engine, table_rows").
		Where("table_schema = ?", reader.schema).
		Order("table_name asc")

	normalizedKeyword := strings.TrimSpace(keyword)
	if normalizedKeyword != "" {
		like := "%" + normalizedKeyword + "%"
		query = query.Where("(table_name like ? or table_comment like ?)", like, like)
	}

	var rows []tableRow
	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]TableOptionResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, TableOptionResp{
			TableName: row.TableName,
			Comment:   row.TableComment,
			Engine:    row.Engine,
			Rows:      row.TableRows,
		})
	}
	return items, nil
}

func (s *GeneratorService) PreviewTable(datasourceID string, tableName string) (*TableSchemaPreviewResp, error) {
	normalizedTable := strings.TrimSpace(tableName)
	if normalizedTable == "" {
		return nil, errors.New("generator.table.required")
	}
	if !regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString(normalizedTable) {
		return nil, errors.New("generator.table.invalid")
	}

	reader, err := s.openSchemaReader(datasourceID)
	if err != nil {
		return nil, err
	}
	if reader.close != nil {
		defer reader.close()
	}

	var table tableRow
	if err := reader.db.Table("information_schema.tables").
		Select("table_name, table_comment, engine, table_rows").
		Where("table_schema = ? and table_name = ?", reader.schema, normalizedTable).
		Take(&table).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("generator.table.not_found")
		}
		return nil, err
	}

	var columns []columnRow
	if err := reader.db.Table("information_schema.columns").
		Select("column_name, data_type, column_type, column_key, is_nullable, extra, column_comment").
		Where("table_schema = ? and table_name = ?", reader.schema, normalizedTable).
		Order("ordinal_position asc").
		Scan(&columns).Error; err != nil {
		return nil, err
	}

	fields := make([]ModuleFieldResp, 0, len(columns))
	for _, column := range columns {
		if isIgnoredGovernanceColumn(column.ColumnName) {
			continue
		}
		field := mapColumnToField(column)
		fields = append(fields, field)
	}

	resp := &TableSchemaPreviewResp{
		TableName:      table.TableName,
		TableComment:   table.TableComment,
		SuggestedName:  suggestModuleName(table.TableName),
		SuggestedScope: suggestScope(table.TableName),
		SuggestedTitle: suggestTitle(table.TableName, table.TableComment),
		Fields:         fields,
	}
	return resp, nil
}

func (s *GeneratorService) openSchemaReader(datasourceID string) (*generatorSchemaReader, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	if strings.TrimSpace(datasourceID) == "" || datasourceID == generatorDatasourceCurrentID {
		schemaName, err := s.currentSchema()
		if err != nil {
			return nil, err
		}
		return &generatorSchemaReader{db: s.db, schema: schemaName}, nil
	}

	row, err := s.loadDatasource(datasourceID)
	if err != nil {
		return nil, err
	}
	if row.Status != generatorDatasourceEnabled {
		return nil, errors.New("generator.datasource.disabled")
	}
	if strings.TrimSpace(row.Driver) != "" && !strings.EqualFold(strings.TrimSpace(row.Driver), "mysql") {
		return nil, errors.New("generator.datasource.driver_unsupported")
	}
	password, err := decryptDatasourcePassword(row.PasswordEncrypted)
	if err != nil {
		return nil, err
	}

	cfg := mysqlDriver.NewConfig()
	cfg.User = row.Username
	cfg.Passwd = password
	cfg.Net = "tcp"
	cfg.Addr = fmt.Sprintf("%s:%d", row.Host, row.Port)
	cfg.DBName = row.DatabaseName
	cfg.ParseTime = true
	cfg.Collation = "utf8mb4_general_ci"
	cfg.Timeout = 5 * time.Second
	cfg.ReadTimeout = 5 * time.Second
	cfg.WriteTimeout = 5 * time.Second
	cfg.Params = map[string]string{"charset": "utf8mb4"}

	db, err := gorm.Open(mysqlgorm.Open(cfg.FormatDSN()), &gorm.Config{})
	if err != nil {
		return nil, errors.New("generator.datasource.connect_failed")
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(0)

	return &generatorSchemaReader{
		db:     db,
		schema: row.DatabaseName,
		close:  sqlDB.Close,
	}, nil
}

func (s *GeneratorService) loadDatasource(id string) (*GeneratorDatasource, error) {
	numericID, err := parseDatasourceNumericID(id)
	if err != nil {
		return nil, err
	}
	var row GeneratorDatasource
	if err := s.db.First(&row, numericID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("generator.datasource.not_found")
		}
		return nil, err
	}
	return &row, nil
}

func (s *GeneratorService) currentSchema() (string, error) {
	var schemaName string
	if err := s.db.Raw("select database()").Scan(&schemaName).Error; err != nil {
		return "", err
	}
	if strings.TrimSpace(schemaName) == "" {
		return "", errors.New("database.schema_unknown")
	}
	return schemaName, nil
}

func normalizeDatasourceReq(req *UpsertGeneratorDatasourceReq, requirePassword bool) (*GeneratorDatasource, error) {
	if req == nil {
		return nil, errors.New("param.invalid")
	}
	name := strings.TrimSpace(req.Name)
	host := strings.TrimSpace(req.Host)
	databaseName := strings.TrimSpace(req.DatabaseName)
	username := strings.TrimSpace(req.Username)
	driver := strings.ToLower(strings.TrimSpace(req.Driver))
	if driver == "" {
		driver = "mysql"
	}
	if name == "" || host == "" || databaseName == "" || username == "" {
		return nil, errors.New("generator.datasource.required")
	}
	if driver != "mysql" {
		return nil, errors.New("generator.datasource.driver_unsupported")
	}
	if err := validateDatasourceHost(host); err != nil {
		return nil, err
	}
	port := req.Port
	if port <= 0 {
		port = 3306
	}
	if port > 65535 {
		return nil, errors.New("generator.datasource.port_invalid")
	}
	if req.Status != generatorDatasourceEnabled && req.Status != generatorDatasourceDisabled {
		req.Status = generatorDatasourceEnabled
	}
	password := strings.TrimSpace(req.Password)
	if requirePassword && password == "" {
		return nil, errors.New("generator.datasource.password_required")
	}
	encrypted := ""
	var err error
	if password != "" {
		encrypted, err = encryptDatasourcePassword(password)
		if err != nil {
			return nil, err
		}
	}

	return &GeneratorDatasource{
		Name:              name,
		Driver:            driver,
		Host:              host,
		Port:              port,
		DatabaseName:      databaseName,
		Username:          username,
		PasswordEncrypted: encrypted,
		Status:            req.Status,
		ReadonlyScope:     "metadata_only",
		Remark:            strings.TrimSpace(req.Remark),
	}, nil
}

func validateDatasourceHost(host string) error {
	normalizedHost := strings.ToLower(strings.TrimSpace(host))
	if normalizedHost == "" {
		return errors.New("generator.datasource.required")
	}
	if strings.ContainsAny(normalizedHost, `/\:@`) {
		return errors.New("generator.datasource.host_invalid")
	}

	if addr, err := netip.ParseAddr(normalizedHost); err == nil {
		if addr.IsLoopback() || addr.IsMulticast() || addr.IsLinkLocalMulticast() || addr.IsLinkLocalUnicast() || addr.IsUnspecified() {
			return errors.New("generator.datasource.host_invalid")
		}
		if addr.IsPrivate() && !allowPrivateGeneratorDatasourceHosts() {
			return errors.New("generator.datasource.host_private_disabled")
		}
		return nil
	}

	if normalizedHost == "localhost" || strings.HasSuffix(normalizedHost, ".localhost") {
		return errors.New("generator.datasource.host_invalid")
	}
	if strings.HasSuffix(normalizedHost, ".local") || strings.HasSuffix(normalizedHost, ".internal") {
		if !allowPrivateGeneratorDatasourceHosts() {
			return errors.New("generator.datasource.host_private_disabled")
		}
	}
	if !regexp.MustCompile(`^[a-z0-9.-]+$`).MatchString(normalizedHost) {
		return errors.New("generator.datasource.host_invalid")
	}
	if strings.HasPrefix(normalizedHost, ".") || strings.HasSuffix(normalizedHost, ".") || strings.Contains(normalizedHost, "..") {
		return errors.New("generator.datasource.host_invalid")
	}
	for _, label := range strings.Split(normalizedHost, ".") {
		if label == "" || strings.HasPrefix(label, "-") || strings.HasSuffix(label, "-") {
			return errors.New("generator.datasource.host_invalid")
		}
	}
	return nil
}

func allowPrivateGeneratorDatasourceHosts() bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv("PANTHEON_ALLOW_PRIVATE_GENERATOR_DATASOURCE")))
	return value == "1" || value == "true" || value == "yes" || value == "on"
}

func parseDatasourceNumericID(id string) (uint64, error) {
	trimmed := strings.TrimSpace(id)
	if trimmed == "" || trimmed == generatorDatasourceCurrentID {
		return 0, errors.New("generator.datasource.not_found")
	}
	value, err := strconv.ParseUint(trimmed, 10, 64)
	if err != nil || value == 0 {
		return 0, errors.New("generator.datasource.not_found")
	}
	return value, nil
}

func buildDatasourceResp(row GeneratorDatasource) GeneratorDatasourceResp {
	resp := GeneratorDatasourceResp{
		ID:              strconv.FormatUint(row.ID, 10),
		Name:            row.Name,
		Driver:          row.Driver,
		Host:            row.Host,
		Port:            row.Port,
		DatabaseName:    row.DatabaseName,
		Username:        row.Username,
		Status:          row.Status,
		Remark:          row.Remark,
		ReadonlyScope:   row.ReadonlyScope,
		LastCheckStatus: row.LastCheckStatus,
		LastCheckError:  row.LastCheckError,
		IsCurrent:       false,
	}
	if row.LastCheckedAt != nil {
		resp.LastCheckedAt = row.LastCheckedAt.Format(time.RFC3339)
	}
	return resp
}

func trimErrorMessage(message string) string {
	trimmed := strings.TrimSpace(message)
	if len(trimmed) <= 255 {
		return trimmed
	}
	return trimmed[:255]
}

func mapColumnToField(column columnRow) ModuleFieldResp {
	fieldType, dictCode, enumOptions := mapColumnType(column)
	required := strings.EqualFold(column.IsNullable, "NO") && !strings.Contains(strings.ToLower(column.Extra), "auto_increment")
	unique := column.ColumnKey == "UNI"
	label := humanizeLabel(column.ColumnName, column.ColumnComment)
	labelEn := humanizeEnglishLabel(column.ColumnName)
	placeholder := ""
	placeholderEn := ""
	if fieldType == "string" || fieldType == "text" {
		placeholder = fmt.Sprintf("请输入%s", label)
		placeholderEn = fmt.Sprintf("Enter %s", strings.ToLower(labelEn))
	}
	if fieldType == "enum" {
		placeholder = fmt.Sprintf("请选择%s", label)
		placeholderEn = fmt.Sprintf("Select %s", strings.ToLower(labelEn))
	}

	validation := &FieldValidationResp{
		Required: required,
		Unique:   unique,
	}
	if len(enumOptions) > 0 {
		validation.Enum = make([]string, 0, len(enumOptions))
		for _, item := range enumOptions {
			validation.Enum = append(validation.Enum, item.Value)
		}
	}
	if !required && !unique && len(validation.Enum) == 0 {
		validation = nil
	}

	return ModuleFieldResp{
		Name:          toCamel(column.ColumnName),
		Type:          fieldType,
		Label:         label,
		LabelEn:       labelEn,
		Required:      required,
		Searchable:    shouldFieldBeSearchable(column.ColumnName, fieldType),
		Sortable:      fieldType != "text" && fieldType != "relation",
		VisibleInList: fieldType != "text",
		VisibleInForm: true,
		Placeholder:   placeholder,
		PlaceholderEn: placeholderEn,
		HelpText:      strings.TrimSpace(column.ColumnComment),
		HelpTextEn:    "",
		DictCode:      dictCode,
		EnumOptions:   enumOptions,
		Validation:    validation,
	}
}

func mapColumnType(column columnRow) (string, string, []EnumOptionResp) {
	dataType := strings.ToLower(strings.TrimSpace(column.DataType))
	columnType := strings.ToLower(strings.TrimSpace(column.ColumnType))
	columnName := strings.ToLower(strings.TrimSpace(column.ColumnName))

	switch dataType {
	case "varchar", "char":
		if dictCode, options, ok := inferConventionalEnumField(columnName); ok {
			return "enum", dictCode, options
		}
		return "string", "", nil
	case "text", "mediumtext", "longtext":
		return "text", "", nil
	case "tinyint":
		if strings.HasPrefix(columnType, "tinyint(1)") {
			return "bool", "", nil
		}
		return "int", "", nil
	case "smallint", "mediumint", "int", "bigint":
		return "int", "", nil
	case "decimal", "float", "double":
		return "float", "", nil
	case "date", "datetime", "timestamp":
		return "date", "", nil
	case "enum", "set":
		options := parseEnumOptions(columnType)
		return "enum", "", options
	default:
		return "string", "", nil
	}
}

func inferConventionalEnumField(columnName string) (string, []EnumOptionResp, bool) {
	switch columnName {
	case "environment":
		return "environment", []EnumOptionResp{
			{Value: "dev", Label: "开发", LabelEn: "Development"},
			{Value: "test", Label: "测试", LabelEn: "Test"},
			{Value: "staging", Label: "预发", LabelEn: "Staging"},
			{Value: "prod", Label: "生产", LabelEn: "Production"},
		}, true
	case "status":
		return "status", []EnumOptionResp{
			{Value: "active", Label: "启用", LabelEn: "Active"},
			{Value: "inactive", Label: "停用", LabelEn: "Inactive"},
		}, true
	default:
		return "", nil, false
	}
}

func parseEnumOptions(columnType string) []EnumOptionResp {
	start := strings.Index(columnType, "(")
	end := strings.LastIndex(columnType, ")")
	if start < 0 || end <= start {
		return nil
	}
	raw := columnType[start+1 : end]
	parts := strings.Split(raw, ",")
	items := make([]EnumOptionResp, 0, len(parts))
	for _, part := range parts {
		value := strings.Trim(part, "' ")
		if value == "" {
			continue
		}
		items = append(items, EnumOptionResp{
			Value:   value,
			Label:   strings.ReplaceAll(value, "_", " "),
			LabelEn: humanizeEnglishLabel(value),
		})
	}
	return items
}

func isIgnoredGovernanceColumn(columnName string) bool {
	switch strings.ToLower(strings.TrimSpace(columnName)) {
	case "id", "created_at", "updated_at", "deleted_at":
		return true
	default:
		return false
	}
}

func suggestModuleName(tableName string) string {
	normalized := strings.TrimSpace(strings.ToLower(tableName))
	if strings.HasPrefix(normalized, "system_") {
		return strings.TrimPrefix(normalized, "system_")
	}
	normalized = strings.TrimPrefix(normalized, "biz_")
	return strings.ReplaceAll(normalized, "_", "/")
}

func suggestScope(tableName string) string {
	normalized := strings.TrimSpace(strings.ToLower(tableName))
	if strings.HasPrefix(normalized, "system_") {
		return "system"
	}
	return "business"
}

func suggestTitle(tableName string, comment string) string {
	trimmed := strings.TrimSpace(comment)
	if trimmed != "" {
		return trimmed
	}
	return humanizeLabel(strings.TrimPrefix(strings.TrimPrefix(tableName, "biz_"), "system_"), "")
}

func humanizeLabel(name string, comment string) string {
	if trimmed := strings.TrimSpace(comment); trimmed != "" {
		return trimmed
	}
	if label, ok := conventionalChineseFieldLabels[strings.ToLower(strings.TrimSpace(name))]; ok {
		return label
	}
	normalized := strings.ReplaceAll(strings.TrimSpace(name), "_", " ")
	if normalized == "" {
		return name
	}
	runes := []rune(normalized)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

func humanizeEnglishLabel(name string) string {
	if label, ok := conventionalEnglishFieldLabels[strings.ToLower(strings.TrimSpace(name))]; ok {
		return label
	}
	normalized := strings.NewReplacer("_", " ", "-", " ").Replace(strings.TrimSpace(name))
	if normalized == "" {
		return name
	}
	words := strings.Fields(normalized)
	for index, word := range words {
		if strings.ToUpper(word) == word && len(word) <= 4 {
			continue
		}
		words[index] = strings.ToLower(word)
	}
	result := strings.Join(words, " ")
	runes := []rune(result)
	if len(runes) == 0 {
		return result
	}
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

func toCamel(value string) string {
	parts := strings.Split(strings.TrimSpace(strings.ToLower(value)), "_")
	if len(parts) == 0 {
		return value
	}
	builder := strings.Builder{}
	for index, part := range parts {
		if part == "" {
			continue
		}
		if index == 0 {
			builder.WriteString(part)
			continue
		}
		runes := []rune(part)
		runes[0] = unicode.ToUpper(runes[0])
		builder.WriteString(string(runes))
	}
	return builder.String()
}

var conventionalChineseFieldLabels = map[string]string{
	"arch":             "架构",
	"cluster_name":     "集群名称",
	"code":             "编码",
	"display_name":     "显示名称",
	"email":            "邮箱",
	"environment":      "环境",
	"host_code":        "主机编码",
	"hostname":         "主机名",
	"idc_code":         "机房编码",
	"ip_address":       "IP 地址",
	"kernel_version":   "内核版本",
	"lifecycle_status": "生命周期状态",
	"maintainer_team":  "维护团队",
	"name":             "名称",
	"os_family":        "系统家族",
	"os_name":          "操作系统",
	"owner_name":       "负责人",
	"owner_user_id":    "负责人用户 ID",
	"phone":            "手机号",
	"provider":         "云厂商",
	"purpose":          "用途",
	"region_code":      "区域编码",
	"remark":           "备注",
	"sort":             "排序",
	"ssh_port":         "SSH 端口",
	"status":           "状态",
}

var conventionalEnglishFieldLabels = map[string]string{
	"idc_code":      "IDC code",
	"ip_address":    "IP address",
	"os_family":     "OS family",
	"os_name":       "OS name",
	"owner_user_id": "Owner user ID",
	"ssh_port":      "SSH port",
}

func shouldFieldBeSearchable(name string, fieldType string) bool {
	if fieldType == "text" || fieldType == "relation" {
		return false
	}
	normalized := strings.ToLower(strings.TrimSpace(name))
	return strings.Contains(normalized, "name") ||
		strings.Contains(normalized, "code") ||
		strings.Contains(normalized, "title") ||
		strings.Contains(normalized, "status") ||
		strings.Contains(normalized, "phone") ||
		strings.Contains(normalized, "email")
}
