package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"unicode"
)

type Field struct {
	Name       string `json:"name"`
	Label      string `json:"label"`
	Type       string `json:"type"`
	Searchable bool   `json:"searchable"`
}

type Schema struct {
	Module string  `json:"module"`
	Name   string  `json:"name"`
	Fields []Field `json:"fields"`
}

type Config struct {
	Schema    Schema
	TitleName string
	LowerName string
}

func main() {
	schemaFile := flag.String("schema", "", "Path to schema json file")
	flag.Parse()

	if *schemaFile == "" {
		fmt.Println("Usage: go run scripts/scaffold/scaffold.go -schema schema/cmdb.json")
		return
	}

	data, err := os.ReadFile(*schemaFile)
	if err != nil { panic(err) }
	var schema Schema
	json.Unmarshal(data, &schema)

	config := Config{
		Schema:    schema,
		TitleName: capitalize(schema.Module),
		LowerName: strings.ToLower(schema.Module),
	}

	fmt.Printf("Generating business module from schema: %s...\n", schema.Module)
	generateBackend(config)
	generateFrontend(config)
	fmt.Println("\nScaffold completed successfully!")
}

func capitalize(s string) string {
	if s == "" { return "" }
	r := []rune(s)
	r[0] = unicode.ToUpper(r[0])
	return string(r)
}

func generateBackend(c Config) {
	baseDir := filepath.Join("backend", "modules", "business", c.LowerName)
	os.MkdirAll(baseDir, 0755)
	writeFile(filepath.Join(baseDir, "module.go"), backendModuleTmpl, c)
	writeFile(filepath.Join(baseDir, c.LowerName+"_model.go"), backendModelTmpl, c)
	writeFile(filepath.Join(baseDir, c.LowerName+"_dto.go"), backendDtoTmpl, c)
	writeFile(filepath.Join(baseDir, c.LowerName+"_service.go"), backendServiceTmpl, c)
	writeFile(filepath.Join(baseDir, c.LowerName+"_handler.go"), backendHandlerTmpl, c)
}

func generateFrontend(c Config) {
	baseDir := filepath.Join("frontend", "src", "modules", "business", c.LowerName)
	os.MkdirAll(baseDir, 0755)
	writeFile(filepath.Join(baseDir, "api.ts"), frontendApiTmpl, c)
	writeFile(filepath.Join(baseDir, c.TitleName+"List.tsx"), frontendListTmpl, c)
}

func writeFile(path, tmplStr string, c Config) {
	tmpl, err := template.New("tmpl").
		Delims("[[", "]]").
		Funcs(template.FuncMap{"capitalize": capitalize}).
		Parse(tmplStr)
	if err != nil { panic(err) }
	f, err := os.Create(path)
	if err != nil { panic(err) }
	defer f.Close()
	tmpl.Execute(f, c)
}

const backendModuleTmpl = `package [[.LowerName]]
import (
	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/contracts"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)
func Init[[.TitleName]]Module(r *gin.RouterGroup, db *gorm.DB) {
	svc := New[[.TitleName]]Service(db)
	h := New[[.TitleName]]Handler(svc)
	contracts.RegisterBackendModules(r, db, []contracts.BackendModule{
		contracts.FuncModule{
			ModuleName: "[[.LowerName]]",
			MigrateFunc: func(db *gorm.DB) error { return db.AutoMigrate(&[[.TitleName]]{}) },
			Register: func(r *gin.RouterGroup) {
				protected := r.Group("/[[.LowerName]]").Use(middleware.JWTAuthMiddleware())
				{
					protected.GET("/list", h.List)
				}
			},
		},
	})
}
`
const backendModelTmpl = `package [[.LowerName]]
import "time"
type [[.TitleName]] struct {
	ID uint64 ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	[[range .Schema.Fields]][[capitalize .Name]] [[if eq .Type "string"]]string[[else]]int[[end]] ` + "`" + `gorm:"size:255" json:"[[.Name]]"` + "`" + `
	[[end]]CreatedAt time.Time ` + "`" + `json:"createdAt"` + "`" + `
}
func ([[.TitleName]]) TableName() string { return "business_[[.LowerName]]" }
`
const backendDtoTmpl = `package [[.LowerName]]
type [[.TitleName]]PageResp struct { Items [][[.TitleName]] ` + "`" + `json:"items"` + "`" + `; Total int64 ` + "`" + `json:"total"` + "`" + ` }
`
const backendServiceTmpl = `package [[.LowerName]]
import "gorm.io/gorm"
type [[.TitleName]]Service struct { db *gorm.DB }
func New[[.TitleName]]Service(db *gorm.DB) *[[.TitleName]]Service { return &[[.TitleName]]Service{db: db} }
func (s *[[.TitleName]]Service) List() (*[[.TitleName]]PageResp, error) {
	var total int64
	var items [][[.TitleName]]
	s.db.Model(&[[.TitleName]]{}).Count(&total)
	s.db.Limit(10).Find(&items)
	return &[[.TitleName]]PageResp{Items: items, Total: total}, nil
}
`
const backendHandlerTmpl = `package [[.LowerName]]
import (
	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/pkg/common"
)
type [[.TitleName]]Handler struct { svc *[[.TitleName]]Service }
func New[[.TitleName]]Handler(svc *[[.TitleName]]Service) *[[.TitleName]]Handler { return &[[.TitleName]]Handler{svc: svc} }
func (h *[[.TitleName]]Handler) List(c *gin.Context) {
	resp, _ := h.svc.List()
	common.Success(c, resp)
}
`
const frontendApiTmpl = `import { apiRequest } from '../../../api/request';
export function get[[.TitleName]]List(params: any) {
  return apiRequest<any>({ url: '/[[.LowerName]]/list', method: 'get', params });
}
`
const frontendListTmpl = `import React, { useState, useEffect } from 'react';
import { Table, Card, Typography } from '@arco-design/web-react';
import { get[[.TitleName]]List } from './api';

const [[.TitleName]]List: React.FC = () => {
  const [data, setData] = useState([]);
  useEffect(() => { get[[.TitleName]]List({}).then((res: any) => setData(res.items)); }, []);
  return (
    <div style={{ padding: 20 }}>
      <Card bordered={false}>
        <Typography.Title heading={5}>[[.Schema.Name]] List</Typography.Title>
        <Table data={data} columns={[[[range .Schema.Fields]]{ title: '[[.Label]]', dataIndex: '[[.Name]]' },[[end]]]} />
      </Card>
    </div>
  );
};
export default [[.TitleName]]List;
`
