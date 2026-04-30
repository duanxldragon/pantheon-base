import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Grid,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { message } from '../../../components/feedback/message';
import { IconCode, IconDelete, IconDownload, IconEdit, IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { isRequestError } from '../../../api/request';
import { ensureOperationVerified } from '../../../api/request';
import PermissionAction from '../../../components/patterns/PermissionAction';
import { AppModal, PageContainer, PageHeader, showAppModalConfirm } from '../../../components';
import { usePermission } from '../../../hooks/usePermission';

import type { GenerateAndRegisterResp } from '../api';
import {
  createGeneratorDatasource,
  deleteGeneratorDatasource,
  generateAndRegisterModule,
  listGeneratorDatasources,
  listGeneratorTables,
  previewGeneratorTable,
  testGeneratorDatasource,
  updateGeneratorDatasource,
  type GeneratorDatasource,
  type GeneratorTableOption,
  type UpsertGeneratorDatasourcePayload,
} from '../api';
import { FieldEditor } from '../components/FieldEditor';
import { CodePreview } from '../components/CodePreview';
import { ModuleExporter } from '../exporter';
import {
  buildEnumOptionKey,
  buildFieldHelpTextKey,
  buildFieldLabelKey,
  buildFieldPlaceholderKey,
  buildModuleNamespace,
  buildPermissionTitleKey,
  buildAuditActionKey,
  buildTitleKey,
  generateDefaultMenus,
  generateDefaultPermissions,
  getPageActions,
  inferModelName,
  normalizeMenuPath,
  normalizeModulePath,
  isValidScopedModulePath,
  normalizeFields,
  PAGE_ACTION_TEMPLATE_DEFINITIONS,
  type ModuleField,
  type ModuleSchema,
  type ModuleScope,
  type PageActionKey,
  type PageActionTemplate,
  type TemplateLevel,
} from '../schema';
import { SECONDARY_VERIFY_CANCELLED_ERROR } from '../../../components/feedback/secondaryVerifyController';

const FormItem = Form.Item;
const { Row, Col } = Grid;

const ModuleWizard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPerm, isAdmin } = usePermission();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm<Partial<ModuleSchema>>();
  const [fields, setFields] = useState<ModuleField[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<ReturnType<ModuleExporter['generateAll']>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<GenerateAndRegisterResp | null>(null);
  const [dynamicModuleDisabled, setDynamicModuleDisabled] = useState(false);
  const [datasources, setDatasources] = useState<GeneratorDatasource[]>([]);
  const [datasourceModalVisible, setDatasourceModalVisible] = useState(false);
  const [datasourceSaving, setDatasourceSaving] = useState(false);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState('current');
  const [editingDatasourceId, setEditingDatasourceId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<GeneratorTableOption[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [sourceMode, setSourceMode] = useState<'manual' | 'database'>('manual');
  const [datasourceForm] = Form.useForm<UpsertGeneratorDatasourcePayload>();
  const canManageDatasources = isAdmin || hasPerm('system:generator:datasource:manage');
  const actionLabel = (action: Exclude<PageActionKey, 'detail'>, locale: 'zh-CN' | 'en-US') => t(`generator.pageActions.${action}`, { lng: locale });

  const selectedDatasource = datasources.find((item) => item.id === selectedDatasourceId);

  const loadDatasources = async () => {
    const items = await listGeneratorDatasources();
    setDatasources(items);
    if (!items.some((item) => item.id === selectedDatasourceId)) {
      setSelectedDatasourceId(items[0]?.id || 'current');
    }
    return items;
  };

  const loadTables = async (datasourceId: string) => {
    setTableLoading(true);
    try {
      const items = await listGeneratorTables(datasourceId);
      setTableOptions(items);
    } catch {
      setTableOptions([]);
    } finally {
      setTableLoading(false);
    }
  };

  const applyPreviewSuggestions = (preview: Awaited<ReturnType<typeof previewGeneratorTable>>) => {
    const currentName = normalizeModulePath(String(form.getFieldValue('name') || ''));
    const currentDisplayName = String(form.getFieldValue('displayName') || '').trim();
    const currentDisplayNameEn = String(form.getFieldValue('displayNameEn') || '').trim();
    const currentScope = String(form.getFieldValue('scope') || '').trim();
    const currentScopedValue = currentScope === 'system' || currentScope === 'business' ? currentScope : preview.suggestedScope;

    if (!currentName || !isValidScopedModulePath(currentScopedValue, currentName)) {
      form.setFieldValue('name', normalizeModulePath(preview.suggestedName));
    }
    if (!currentDisplayName) {
      form.setFieldValue('displayName', preview.suggestedTitle);
    }
    if (!currentDisplayNameEn) {
      form.setFieldValue('displayNameEn', preview.suggestedTitle);
    }
    if (!currentScope) {
      form.setFieldValue('scope', preview.suggestedScope);
    }
  };

  useEffect(() => {
    let active = true;
    void loadDatasources()
      .then((items) => {
        if (!active) {
          return;
        }
        const firstID = items.find((item) => item.id === selectedDatasourceId)?.id || items[0]?.id || 'current';
        setSelectedDatasourceId(firstID);
        return loadTables(firstID);
      })
      .catch(() => {
        if (active) {
          setDatasources([]);
          setTableOptions([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sourceMode !== 'database') {
      return;
    }
    form.setFieldValue('metadata.sourceDatasourceId' as keyof ModuleSchema, selectedDatasourceId);
    form.setFieldValue('metadata.sourceDatasourceName' as keyof ModuleSchema, selectedDatasource?.name || '');
    form.setFieldValue('metadata.sourceTable' as keyof ModuleSchema, undefined);
    void loadTables(selectedDatasourceId);
  }, [form, selectedDatasource?.name, selectedDatasourceId, sourceMode]);

  const getAllFormValues = () => form.getFields() as Partial<ModuleSchema>;

  const readMetadataValues = () => {
    const metadata = getAllFormValues().metadata;
    return {
      boundedContext: metadata?.boundedContext || undefined,
      owner: metadata?.owner || undefined,
      summary: metadata?.summary || undefined,
      sourceMode: metadata?.sourceMode || sourceMode,
      sourceDatasourceId: metadata?.sourceDatasourceId || undefined,
      sourceDatasourceName: metadata?.sourceDatasourceName || undefined,
      sourceTable: metadata?.sourceTable || undefined,
    };
  };

  const buildSchema = (): ModuleSchema => {
    const values = getAllFormValues();
    const metadata = readMetadataValues();
    const name = normalizeModulePath(values.name || '');
    const displayName = values.displayName || '';
    const displayNameEn = values.displayNameEn || displayName;
    const scope = (values.scope as ModuleScope | undefined) || 'business';
    const parentMenu = normalizeMenuPath(values.parentMenu);
    const templateLevel = (values.templateLevel as TemplateLevel | undefined) || 'enterprise';
    const pageActionTemplate = (values.pageActionTemplate as PageActionTemplate | undefined) || 'standard';
    const pageActions = (values.pageActions as PageActionKey[] | undefined) ?? getPageActions({
      pageActionTemplate,
      enableExport: templateLevel === 'enterprise',
      enableImport: templateLevel === 'enterprise',
    });
    const enableExport = pageActions.includes('export');
    const enableImport = pageActions.includes('import');
    const model = values.model || {
      tableName: scope === 'system' ? `system_${name}` : `biz_${name}`,
      fields: [],
    };
    const normalizedFields = normalizeFields(fields);
    const titleKey = buildTitleKey(scope, name);
    const zhTranslations = normalizedFields.reduce<Record<string, string>>((acc, field) => {
      acc[buildFieldLabelKey(scope, name, field.name)] = field.label;
      if (field.placeholder) {
        acc[buildFieldPlaceholderKey(scope, name, field.name)] = field.placeholder;
      }
      if (field.helpText) {
        acc[buildFieldHelpTextKey(scope, name, field.name)] = field.helpText;
      }
      for (const item of field.enumOptions ?? []) {
        acc[buildEnumOptionKey(scope, name, field.name, item.value)] = item.label;
      }
      return acc;
    }, {
      [titleKey]: displayName,
    });
    const enTranslations = normalizedFields.reduce<Record<string, string>>((acc, field) => {
      acc[buildFieldLabelKey(scope, name, field.name)] = field.labelEn || field.label;
      if (field.placeholder || field.placeholderEn) {
        acc[buildFieldPlaceholderKey(scope, name, field.name)] = field.placeholderEn || field.placeholder || '';
      }
      if (field.helpText || field.helpTextEn) {
        acc[buildFieldHelpTextKey(scope, name, field.name)] = field.helpTextEn || field.helpText || '';
      }
      for (const item of field.enumOptions ?? []) {
        acc[buildEnumOptionKey(scope, name, field.name, item.value)] = item.labelEn || item.label;
      }
      return acc;
    }, {
      [titleKey]: displayNameEn,
    });

    pageActions
      .filter((action) => action !== 'detail')
      .forEach((action) => {
        const key = buildPermissionTitleKey(scope, name, action);
        zhTranslations[key] = `${actionLabel(action, 'zh-CN')}${displayName}`;
        enTranslations[key] = `${actionLabel(action, 'en-US')} ${displayName}`;
      });

    zhTranslations[buildAuditActionKey(scope, name, 'create')] = `${actionLabel('create', 'zh-CN')}${displayName}`;
    zhTranslations[buildAuditActionKey(scope, name, 'update')] = `${actionLabel('update', 'zh-CN')}${displayName}`;
    zhTranslations[buildAuditActionKey(scope, name, 'delete')] = `${actionLabel('delete', 'zh-CN')}${displayName}`;
    enTranslations[buildAuditActionKey(scope, name, 'create')] = `${actionLabel('create', 'en-US')} ${displayName}`;
    enTranslations[buildAuditActionKey(scope, name, 'update')] = `${actionLabel('update', 'en-US')} ${displayName}`;
    enTranslations[buildAuditActionKey(scope, name, 'delete')] = `${actionLabel('delete', 'en-US')} ${displayName}`;

    const schema: ModuleSchema = {
      name,
      displayName,
      description: values.description,
      displayNameEn,
      scope,
      templateLevel,
      parentMenu,
      pageActionTemplate,
      pageActions,
      metadata: {
        boundedContext: metadata.boundedContext,
        owner: metadata.owner,
        summary: metadata.summary,
        sourceMode: metadata.sourceMode,
        sourceDatasourceId: metadata.sourceDatasourceId,
        sourceDatasourceName: metadata.sourceDatasourceName,
        sourceTable: metadata.sourceTable,
      },
      model: {
        tableName: model.tableName,
        modelName: inferModelName({
          name,
          displayName,
          scope,
          templateLevel,
          pageActionTemplate,
          pageActions,
          model,
          menus: [],
          permissions: [],
          i18n: { namespace: '', translations: { zh: {}, en: {} } },
        } as ModuleSchema),
        fields: normalizedFields,
      },
      menus: [],
      permissions: [],
      i18n: {
        namespace: buildModuleNamespace(scope, name),
        translations: {
          zh: zhTranslations,
          en: enTranslations,
        },
      },
      enableExport,
      enableImport,
      enableAudit: templateLevel === 'enterprise',
      enableDataScope: false,
    };

    schema.menus = generateDefaultMenus(schema);
    schema.permissions = generateDefaultPermissions(schema);
    return schema;
  };

  const getNormalizedNameAndScope = () => {
    const values = getAllFormValues();
    const normalizedName = normalizeModulePath(values.name || '');
    const scope = (values.scope as ModuleScope | undefined) || 'business';
    return { normalizedName, scope };
  };

  const syncModuleNameValidation = () => {
    const { normalizedName, scope } = getNormalizedNameAndScope();
    form.setFieldValue('name', normalizedName);
    if (!normalizedName || isValidScopedModulePath(scope, normalizedName)) {
      void form.validate(['name']).catch(() => undefined);
      return true;
    }
    void form.validate(['name']).catch(() => undefined);
    return false;
  };

  const previewSchema = currentStep >= 2 ? buildSchema() : null;
  const selectedActionTemplate = (getAllFormValues().pageActionTemplate as PageActionTemplate | undefined) || 'standard';

  const handleBasicInfoSubmit = async () => {
    try {
      let values = getAllFormValues();
      let metadata = readMetadataValues();
      const sourceMode = metadata.sourceMode;
      if (sourceMode === 'database' && !metadata.sourceTable) {
        message.error(t('generator.wizard.sourceTable.required'));
        return;
      }
      let tablePreview: Awaited<ReturnType<typeof previewGeneratorTable>> | null = null;
      if (sourceMode === 'database' && metadata.sourceTable) {
        tablePreview = await previewGeneratorTable(metadata.sourceTable, metadata.sourceDatasourceId);
        applyPreviewSuggestions(tablePreview);
      }

      await form.validate();
      values = getAllFormValues();
      metadata = readMetadataValues();
      const normalizedName = normalizeModulePath(values.name || '');
      const scope = (values.scope as ModuleScope | undefined) || 'business';
      if (!isValidScopedModulePath(scope, normalizedName)) {
        form.setFieldValue('name', normalizedName);
        void form.validate(['name']).catch(() => undefined);
        return;
      }
      form.setFieldValue('name', normalizedName);
      form.setFieldValue('parentMenu', normalizeMenuPath(values.parentMenu));
      const templateLevel = (values.templateLevel as TemplateLevel | undefined) || 'enterprise';
      const pageActionTemplate = (values.pageActionTemplate as PageActionTemplate | undefined) || 'standard';
      let importedFields = fields;
      let tableName = values.scope === 'system' ? `system_${values.name}` : `biz_${values.name}`;
      if (sourceMode === 'database' && tablePreview) {
        importedFields = tablePreview.fields;
        tableName = tablePreview.tableName;
        setFields(tablePreview.fields);
      }
      const schema = {
        ...values,
        pageActionTemplate,
        pageActions: getPageActions({
          pageActionTemplate,
          enableExport: templateLevel === 'enterprise',
          enableImport: templateLevel === 'enterprise',
        }),
        model: {
          tableName,
          fields: importedFields,
        },
      };
      form.setFieldsValue(schema);
      setRegisterResult(null);
      setCurrentStep(1);
    } catch {
      message.error(t('generator.wizard.fillRequired'));
    }
  };

  const handleGenerate = () => {
    const schema = buildSchema();
    const exporter = new ModuleExporter(schema);
    setGeneratedFiles(exporter.generateAll());
    setRegisterResult(null);
    setCurrentStep(3);
  };

  const resetDatasourceForm = () => {
    setEditingDatasourceId(null);
    datasourceForm.setFieldsValue({
      name: '',
      driver: 'mysql',
      host: '',
      port: 3306,
      databaseName: '',
      username: '',
      password: '',
      status: 1,
      remark: '',
    });
  };

  const handleEditDatasource = (item: GeneratorDatasource) => {
    setEditingDatasourceId(item.id);
    datasourceForm.setFieldsValue({
      name: item.name,
      driver: item.driver || 'mysql',
      host: item.host || '',
      port: item.port || 3306,
      databaseName: item.databaseName,
      username: item.username || '',
      password: '',
      status: item.status,
      remark: item.remark || '',
    });
  };

  const handleSaveDatasource = async () => {
    try {
      const values = await datasourceForm.validate();
      await ensureOperationVerified();
      setDatasourceSaving(true);
      if (editingDatasourceId) {
        await updateGeneratorDatasource(editingDatasourceId, values);
        message.success(t('generator.datasource.saveSuccess'));
      } else {
        await createGeneratorDatasource(values);
        message.success(t('generator.datasource.createSuccess'));
      }
      const items = await loadDatasources();
      if (!editingDatasourceId) {
        const created = items[items.length - 1];
        if (created) {
          setSelectedDatasourceId(created.id);
        }
      }
      resetDatasourceForm();
    } catch (error) {
      if (error instanceof Error && error.message === SECONDARY_VERIFY_CANCELLED_ERROR) {
        return;
      }
      if (!isRequestError(error)) {
        return;
      }
      message.error(t('generator.datasource.saveError'));
    } finally {
      setDatasourceSaving(false);
    }
  };

  const handleTestDatasource = async (id: string) => {
    try {
      await ensureOperationVerified();
      await testGeneratorDatasource(id);
      message.success(t('generator.datasource.testSuccess'));
      await loadDatasources();
    } catch (error) {
      if (error instanceof Error && error.message === SECONDARY_VERIFY_CANCELLED_ERROR) {
        return;
      }
      message.error(t('generator.datasource.testError'));
    }
  };

  const handleDeleteDatasource = async (id: string) => {
    try {
      await ensureOperationVerified();
      await deleteGeneratorDatasource(id);
      message.success(t('generator.datasource.deleteSuccess'));
      const items = await loadDatasources();
      if (selectedDatasourceId === id) {
        setSelectedDatasourceId(items[0]?.id || 'current');
      }
      resetDatasourceForm();
    } catch (error) {
      if (error instanceof Error && error.message === SECONDARY_VERIFY_CANCELLED_ERROR) {
        return;
      }
      message.error(t('generator.datasource.deleteError'));
    }
  };

  const handleDownload = async () => {
    if (generatedFiles.length === 0) {
      return;
    }
    try {
      const exporter = new ModuleExporter(buildSchema());
      const blob = await exporter.exportAsZip();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${buildSchema().name}-module.zip`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(t('generator.wizard.downloadSuccess'));
    } catch {
      message.error(t('generator.wizard.downloadError'));
    }
  };

  const oneClickEnabled = currentStep === 3 && buildSchema().scope === 'business' && generatedFiles.length > 0;
  const canGenerateRegister = isAdmin || hasPerm('system:module:generate');
  const canOpenModuleManager = isAdmin || hasPerm('system:module:list');
  const summary = registerResult?.summary;
  const activationStatusKey = registerResult
    ? registerResult.module.status === 1
      ? 'generator.moduleManager.status.active'
      : registerResult.module.status === 2
        ? 'generator.moduleManager.status.uninstalled'
        : 'generator.moduleManager.status.pending'
    : '';

  const submitGenerateAndRegister = async (overwrite = false) => {
    if (!previewSchema) {
      return;
    }
    if (previewSchema.scope !== 'business') {
      message.warning(t('generator.wizard.register.businessOnly'));
      return;
    }
    if (!isValidScopedModulePath(previewSchema.scope, previewSchema.name)) {
      void form.validate(['name']).catch(() => undefined);
      return;
    }
    try {
      await ensureOperationVerified();
      setRegistering(true);
      const result = await generateAndRegisterModule({
        schema: previewSchema,
        files: generatedFiles,
        overwrite,
      });
      setDynamicModuleDisabled(false);
      setRegisterResult(result);
      message.success(t('generator.wizard.register.success'));
    } catch (error) {
      if (error instanceof Error && error.message === SECONDARY_VERIFY_CANCELLED_ERROR) {
        return;
      }
      if (isRequestError(error) && error.messageKey === 'module.dynamic.disabled') {
        setDynamicModuleDisabled(true);
        return;
      }
      if (isRequestError(error) && (error.messageKey === 'module.generate.file_exists' || error.messageKey === 'module.generate.already_exists') && !overwrite) {
        showAppModalConfirm({
          title: t('generator.wizard.register.overwriteTitle'),
          content: t('generator.wizard.register.overwriteContent'),
          onOk: () => {
            void submitGenerateAndRegister(true);
          },
        });
        return;
      }
      if (isRequestError(error)) {
        message.error(t(error.messageKey || 'request.failed'));
        return;
      }
      message.error(t('request.failed'));
    } finally {
      setRegistering(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={t('generator.wizard.title')} />
      <Card>
      <Alert
        type="info"
        style={{ marginBottom: 16 }}
        content={t('generator.wizard.positioning')}
      />
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Steps.Step title={t('generator.wizard.step1.title')} description={t('generator.wizard.step1.desc')} />
        <Steps.Step title={t('generator.wizard.step2.title')} description={t('generator.wizard.step2.desc')} />
        <Steps.Step title={t('generator.wizard.step3.title')} description={t('generator.wizard.step3.desc')} />
        <Steps.Step title={t('generator.wizard.step4.title')} description={t('generator.wizard.step4.desc')} />
      </Steps>

      <Divider />

      {currentStep === 0 ? (
        <Form form={form} layout="vertical">
          <FormItem
            label={t('generator.wizard.moduleName')}
            field="name"
            rules={[
              { required: true, message: t('common.required') },
              {
                validator: (value, callback) => {
                  const normalized = normalizeModulePath(String(value || ''));
                  const scope = ((form.getFieldValue('scope') as ModuleScope | undefined) || 'business');
                  if (!normalized || isValidScopedModulePath(scope, normalized)) {
                    callback();
                    return;
                  }
                  callback(t('module.generate.invalid_name'));
                },
              },
            ]}
            extra={t('generator.wizard.moduleName.help')}
          >
            <Input
              placeholder="cmdb/host"
              onBlur={(event) => {
                form.setFieldValue('name', normalizeModulePath(event.target.value));
                syncModuleNameValidation();
              }}
            />
          </FormItem>
          <FormItem label={t('generator.wizard.sourceMode')} field="metadata.sourceMode" initialValue="manual">
            <Select onChange={(value) => setSourceMode((value as 'manual' | 'database') || 'manual')}>
              <Select.Option value="manual">{t('generator.wizard.sourceMode.manual')}</Select.Option>
              <Select.Option value="database">{t('generator.wizard.sourceMode.database')}</Select.Option>
            </Select>
          </FormItem>
          {sourceMode === 'database' ? (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Typography.Text>{t('generator.datasource.selector')}</Typography.Text>
                    <Space>
                      <Button size="small" onClick={() => void loadTables(selectedDatasourceId)}>
                        <IconRefresh /> {t('common.refresh')}
                      </Button>
                      <PermissionAction allowed={canManageDatasources} tooltip={t('common.noPermissionAction')}>
                        <Button
                          size="small"
                          onClick={() => {
                            resetDatasourceForm();
                            setDatasourceModalVisible(true);
                          }}
                        >
                          <IconPlus /> {t('generator.datasource.manage')}
                        </Button>
                      </PermissionAction>
                    </Space>
                  </Space>
                  <Select
                    value={selectedDatasourceId}
                    onChange={(value) => setSelectedDatasourceId(String(value))}
                    placeholder={t('generator.datasource.selectorPlaceholder')}
                  >
                    {datasources.map((item) => (
                      <Select.Option key={item.id} value={item.id}>
                        {item.name} · {item.databaseName}{item.isCurrent ? ` · ${t('generator.datasource.currentTag')}` : ''}
                      </Select.Option>
                    ))}
                  </Select>
                  <Typography.Text type="secondary">
                    {t('generator.datasource.readonlyHint')}
                  </Typography.Text>
                </Space>
              </Card>
          <FormItem label={t('generator.wizard.sourceTable')} field="metadata.sourceTable" extra={t('generator.wizard.sourceTable.help')}>
                <Select
                  allowClear
                  showSearch
                  loading={tableLoading}
                  placeholder={t('generator.wizard.sourceTable.placeholder')}
                  filterOption={(inputValue, option) => String(option?.props?.value || '').toLowerCase().includes(inputValue.toLowerCase())}
                  onChange={(value) => {
                    const tableName = String(value || '').trim();
                    form.setFieldValue('metadata.sourceTable' as keyof ModuleSchema, tableName || undefined);
                    if (!tableName) {
                      return;
                    }
                    void previewGeneratorTable(tableName, selectedDatasourceId)
                      .then((preview) => {
                        applyPreviewSuggestions(preview);
                      })
                      .catch(() => undefined);
                  }}
                >
                  {tableOptions.map((item) => (
                    <Select.Option key={item.tableName} value={item.tableName}>
                      {item.tableName}{item.comment ? ` · ${item.comment}` : ''}
                    </Select.Option>
                  ))}
                </Select>
              </FormItem>
            </>
          ) : null}
          <FormItem label={t('generator.wizard.displayName')} field="displayName" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder={t('generator.wizard.displayName.placeholder')} />
          </FormItem>
          <FormItem label={t('generator.wizard.displayNameEn')} field="displayNameEn" extra={t('generator.wizard.displayNameEn.help')}>
            <Input placeholder={t('generator.wizard.displayNameEn.placeholder')} />
          </FormItem>
          <FormItem label={t('generator.wizard.scope')} field="scope" initialValue="business" rules={[{ required: true, message: t('common.required') }]}>
            <Select
              onChange={() => {
                syncModuleNameValidation();
              }}
            >
              <Select.Option value="business">{t('generator.wizard.scope.business')}</Select.Option>
              <Select.Option value="system">{t('generator.wizard.scope.system')}</Select.Option>
            </Select>
          </FormItem>
          <FormItem label={t('generator.wizard.templateLevel')} field="templateLevel" initialValue="enterprise" rules={[{ required: true, message: t('common.required') }]}>
            <Select>
              <Select.Option value="enterprise">{t('generator.wizard.templateLevel.enterprise')}</Select.Option>
              <Select.Option value="basic">{t('generator.wizard.templateLevel.basic')}</Select.Option>
            </Select>
          </FormItem>
          <FormItem label={t('generator.wizard.pageActionTemplate')} field="pageActionTemplate" initialValue="standard">
            <Select>
              {PAGE_ACTION_TEMPLATE_DEFINITIONS.map((item) => (
                <Select.Option key={item.key} value={item.key}>
                  {t(item.labelKey)}
                </Select.Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label={t('generator.wizard.parentMenu')} field="parentMenu" extra={t('generator.wizard.parentMenu.help')}>
            <Input
              placeholder={t('generator.wizard.parentMenu.placeholder')}
              onBlur={(event) => {
                form.setFieldValue('parentMenu', normalizeMenuPath(event.target.value));
              }}
            />
          </FormItem>
          <FormItem label={t('generator.wizard.owner')} field="metadata.owner">
            <Input placeholder={t('generator.wizard.owner.placeholder')} />
          </FormItem>
          <FormItem label={t('generator.wizard.boundedContext')} field="metadata.boundedContext">
            <Input placeholder={t('generator.wizard.boundedContext.placeholder')} />
          </FormItem>
          <FormItem label={t('generator.wizard.summary')} field="metadata.summary">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder={t('generator.wizard.summary.placeholder')} />
          </FormItem>
          <Button type="primary" onClick={handleBasicInfoSubmit}>{t('common.next')}</Button>
        </Form>
      ) : null}

      {currentStep === 1 ? (
        <div>
          <Typography.Title heading={5}>{t('generator.wizard.step2.title')}</Typography.Title>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('generator.wizard.step2.desc')}
          </Typography.Text>
          <FieldEditor fields={fields} onChange={setFields} />
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>{t('common.previous')}</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)} disabled={fields.length === 0}>
              {t('common.next')}
            </Button>
          </Space>
        </div>
      ) : null}

      {currentStep === 2 && previewSchema ? (
        <div>
          <Typography.Title heading={5}>{t('generator.wizard.step3.title')}</Typography.Title>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('generator.wizard.step3.desc')}
          </Typography.Text>

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title={t('generator.wizard.step3.actions')} style={{ marginBottom: 16 }}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  {t(PAGE_ACTION_TEMPLATE_DEFINITIONS.find((item) => item.key === selectedActionTemplate)?.descriptionKey || 'generator.actionTemplates.standard.desc')}
                </Typography.Text>
                <Checkbox.Group
                  value={((form.getFieldValue('pageActions' as keyof ModuleSchema) as PageActionKey[] | undefined) ?? previewSchema.pageActions)}
                  options={['view', 'detail', 'create', 'update', 'delete', 'export', 'import'].map((item) => ({
                    label: t(`generator.pageActions.${item}`),
                    value: item,
                  }))}
                  onChange={(value) => {
                    form.setFieldValue('pageActions', value as PageActionKey[]);
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t('generator.wizard.step3.dataPolicies')} style={{ marginBottom: 16 }}>
                <Space wrap>
                  <Tag color="green">{t('generator.wizard.step3.fieldCount', { count: previewSchema.model.fields.length })}</Tag>
                  <Tag color="arcoblue">{t('generator.wizard.step3.uniqueCount', { count: previewSchema.model.fields.filter((field) => field.validation?.unique).length })}</Tag>
                  <Tag color="purple">{t('generator.wizard.step3.enumCount', { count: previewSchema.model.fields.filter((field) => field.type === 'enum').length })}</Tag>
                </Space>
                <div style={{ marginTop: 12 }}>
                  {previewSchema.model.fields.filter((field) => field.type === 'enum').map((field) => (
                    <div key={field.name} style={{ marginBottom: 8 }}>
                      <Typography.Text>{field.label}</Typography.Text>
                      <Typography.Text type="secondary"> · {field.dictCode || t('generator.fieldEditor.enumInline')}</Typography.Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Card title={t('generator.wizard.step3.permissions')} style={{ marginBottom: 16 }}>
            <Space wrap>
              {previewSchema.permissions.map((permission) => (
                <Tag key={permission.key}>{permission.key}</Tag>
              ))}
            </Space>
          </Card>

          <Space>
            <Button onClick={() => setCurrentStep(1)}>{t('common.previous')}</Button>
            <Button type="primary" onClick={handleGenerate}>{t('generator.wizard.generate')}</Button>
          </Space>
        </div>
      ) : null}

      {currentStep === 3 && previewSchema ? (
        <div>
          <Typography.Title heading={5}>{t('generator.wizard.step4.title')}</Typography.Title>

          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Typography.Text>{t('generator.wizard.generatedFiles', { count: generatedFiles.length })}</Typography.Text>
              <Tag color="green">{t('generator.wizard.totalLines', { lines: generatedFiles.reduce((sum, file) => sum + file.content.split('\n').length, 0) })}</Tag>
              <Tag color="arcoblue">{t('generator.wizard.step3.actionCount', { count: previewSchema.pageActions?.length || 0 })}</Tag>
            </Space>
          </Card>

          <Space style={{ marginBottom: 16 }}>
            <PermissionAction allowed={canGenerateRegister} tooltip={t('common.noPermissionAction')}>
              <Button
                type="primary"
                status="success"
                loading={registering}
                disabled={!oneClickEnabled}
                onClick={() => { void submitGenerateAndRegister(); }}
              >
                {t('generator.wizard.register.submit')}
              </Button>
            </PermissionAction>
            <Button type="primary" onClick={handleDownload}>
              <IconDownload /> {t('generator.wizard.download')}
            </Button>
            <Button onClick={() => setShowPreview(true)}>
              <IconCode /> {t('generator.wizard.preview')}
            </Button>
            <Button onClick={() => setCurrentStep(2)}>{t('common.previous')}</Button>
          </Space>

          <CodePreview visible={showPreview} files={generatedFiles} onClose={() => setShowPreview(false)} />

          {dynamicModuleDisabled ? (
            <Alert
              type="warning"
              title={t('generator.wizard.register.disabledTitle')}
              content={t('generator.wizard.register.disabledHint')}
              style={{ marginBottom: 16 }}
            />
          ) : null}

          {registerResult && summary ? (
            <div style={{ marginTop: 24 }}>
              <Alert
                type="success"
                title={t('generator.wizard.result.pendingActivation')}
                content={t('generator.wizard.result.pendingActivationDesc')}
                style={{ marginBottom: 16 }}
              />
              <Card title={t('generator.wizard.result.title')} style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text>{t('generator.wizard.result.moduleKey')}: {summary.moduleKey}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.parentMenu')}: {summary.parentMenuPath || t('generator.wizard.result.parentMenu.topLevel')}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.routePath')}: {summary.routePath}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.routeName')}: {summary.routeName}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.componentKey')}: {summary.componentKey}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.permissionPrefix')}: {summary.permissionPrefix}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.backendPath')}: {summary.backendModulePath}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.frontendPath')}: {summary.frontendModulePath}</Typography.Text>
                  <Typography.Text>{t('generator.wizard.result.schemaPath')}: {summary.schemaPath}</Typography.Text>
                  <Tag color={registerResult.module.status === 3 ? 'orange' : 'green'}>{t(activationStatusKey)}</Tag>
                </Space>
              </Card>
              <Card title={t('generator.wizard.result.verifications')} style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {summary.verifications.map((item) => (
                    <Space key={`${item.code}-${item.detail}`} align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Space>
                        <Tag color={item.status === 'pass' ? 'green' : item.status === 'warn' ? 'orange' : 'arcoblue'}>
                          {t(`generator.wizard.result.verificationStatus.${item.status}`)}
                        </Tag>
                        <Typography.Text>{t(item.messageKey)}</Typography.Text>
                      </Space>
                      <Typography.Text type="secondary">{item.detail}</Typography.Text>
                    </Space>
                  ))}
                </Space>
              </Card>
              <Space wrap>
                {canOpenModuleManager ? (
                  <Button onClick={() => navigate('/system/modules')}>
                    {t('generator.wizard.result.openModuleManager')}
                  </Button>
                ) : null}
                <Button onClick={() => {
                  setRegisterResult(null);
                  setGeneratedFiles([]);
                  setCurrentStep(0);
                }}
                >
                  {t('generator.wizard.result.generateAnother')}
                </Button>
              </Space>
            </div>
          ) : null}
        </div>
      ) : null}
      </Card>
      <AppModal
        title={t('generator.datasource.manageTitle')}
        visible={datasourceModalVisible}
        onCancel={() => setDatasourceModalVisible(false)}
        footer={null}
        size="xl"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Table
            pagination={false}
            rowKey="id"
            data={datasources.filter((item) => !item.isCurrent)}
            columns={[
              { title: t('generator.datasource.name'), dataIndex: 'name' },
              { title: t('generator.datasource.databaseName'), dataIndex: 'databaseName' },
              { title: t('generator.datasource.host'), dataIndex: 'host' },
              {
                title: t('generator.datasource.status'),
                dataIndex: 'status',
                render: (value: number) => <Tag color={value === 1 ? 'green' : 'gray'}>{value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}</Tag>,
              },
              {
                title: t('common.action'),
                render: (_: unknown, record: GeneratorDatasource) => (
                  <Space>
                    <Button size="mini" type="text" onClick={() => handleEditDatasource(record)}>
                      <IconEdit /> {t('common.edit')}
                    </Button>
                    <Button size="mini" type="text" onClick={() => void handleTestDatasource(record.id)}>
                      <IconCode /> {t('generator.datasource.test')}
                    </Button>
                    <Popconfirm
                      title={t('generator.datasource.deleteConfirm')}
                      onOk={() => handleDeleteDatasource(record.id)}
                    >
                      <Button size="mini" type="text" status="danger">
                        <IconDelete /> {t('common.delete')}
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            noDataElement={t('generator.datasource.empty')}
          />
          <Card size="small" title={editingDatasourceId ? t('generator.datasource.editTitle') : t('generator.datasource.createTitle')}>
            <Form form={datasourceForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormItem field="name" label={t('generator.datasource.name')} rules={[{ required: true, message: t('common.required') }]}>
                    <Input placeholder={t('generator.datasource.namePlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="driver" label={t('generator.datasource.driver')} initialValue="mysql">
                    <Select>
                      <Select.Option value="mysql">MySQL</Select.Option>
                    </Select>
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="host" label={t('generator.datasource.host')} rules={[{ required: true, message: t('common.required') }]}>
                    <Input placeholder={t('generator.datasource.hostPlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="port" label={t('generator.datasource.port')} initialValue={3306} rules={[{ required: true, message: t('common.required') }]}>
                    <InputNumber placeholder="3306" style={{ width: '100%' }} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="databaseName" label={t('generator.datasource.databaseName')} rules={[{ required: true, message: t('common.required') }]}>
                    <Input placeholder={t('generator.datasource.databasePlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="username" label={t('generator.datasource.username')} rules={[{ required: true, message: t('common.required') }]}>
                    <Input placeholder={t('generator.datasource.usernamePlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="password" label={t('generator.datasource.password')} extra={editingDatasourceId ? t('generator.datasource.passwordOptional') : undefined}>
                    <Input.Password placeholder={t('generator.datasource.passwordPlaceholder')} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem field="status" label={t('generator.datasource.status')} initialValue={1}>
                    <Select>
                      <Select.Option value={1}>{t('system.user.status.enabled')}</Select.Option>
                      <Select.Option value={0}>{t('system.user.status.disabled')}</Select.Option>
                    </Select>
                  </FormItem>
                </Col>
                <Col xs={24}>
                  <FormItem field="remark" label={t('i18n.remark')}>
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 3 }} />
                  </FormItem>
                </Col>
              </Row>
              <Space>
                <Button onClick={resetDatasourceForm}>{t('common.reset')}</Button>
                <Button type="primary" loading={datasourceSaving} onClick={() => void handleSaveDatasource()}>
                  {editingDatasourceId ? t('common.save') : t('common.create')}
                </Button>
              </Space>
            </Form>
          </Card>
        </Space>
      </AppModal>
    </PageContainer>
  );
};

export default ModuleWizard;
