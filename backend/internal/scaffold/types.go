package scaffold

type GeneratedFile struct {
	Path     string `json:"path"`
	Content  string `json:"content"`
	Language string `json:"language"`
}

type ModuleField struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	Label         string `json:"label"`
	Required      bool   `json:"required"`
	Searchable    bool   `json:"searchable"`
	Sortable      bool   `json:"sortable"`
	VisibleInList bool   `json:"visibleInList"`
	VisibleInForm bool   `json:"visibleInForm"`
	Placeholder   string `json:"placeholder"`
}

type ModuleSchema struct {
	Name          string `json:"name"`
	DisplayName   string `json:"displayName"`
	Description   string `json:"description"`
	Scope         string `json:"scope"`
	ParentMenu    string `json:"parentMenu"`
	TemplateLevel string `json:"templateLevel"`
	Metadata      struct {
		BoundedContext       string `json:"boundedContext"`
		Owner                string `json:"owner"`
		Summary              string `json:"summary"`
		SourceMode           string `json:"sourceMode"`
		SourceDatasourceID   string `json:"sourceDatasourceId"`
		SourceDatasourceName string `json:"sourceDatasourceName"`
		SourceTable          string `json:"sourceTable"`
	} `json:"metadata"`
	Model struct {
		TableName string        `json:"tableName"`
		ModelName string        `json:"modelName"`
		Fields    []ModuleField `json:"fields"`
	} `json:"model"`
	I18n struct {
		Namespace    string `json:"namespace"`
		Translations struct {
			Zh map[string]string `json:"zh"`
			En map[string]string `json:"en"`
		} `json:"translations"`
	} `json:"i18n"`
}

type RegisterGeneratedModuleRequest struct {
	Schema    ModuleSchema    `json:"schema"`
	Files     []GeneratedFile `json:"files"`
	Overwrite bool            `json:"overwrite"`
}

type GeneratedModuleRef struct {
	Name  string
	Scope string
}
