import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../../api/request';
import { message } from '../../../components/feedback/message';
import { isArcoFormValidationError } from '../../../core/arco/formValidation';
import { getGeneratedModuleSchema } from '../../../modules/system/dynamicmodule/api';
import { getMdqaorderitemDetail, type MdqaorderitemDetail } from './api';
import { AppModal, PageContainer, PageEmpty, PageError, PageLoading, SubmitBar } from '../../../components';

const governanceDependencies = [] as Array<{
  module: string;
  required?: boolean;
  reason?: string;
}>;

const governanceRelations = [] as Array<{
  name: string;
  type: string;
  targetModule: string;
  localField: string;
  targetField: string;
  targetLabelField?: string;
  lookupApi?: string;
  lookupValueField?: string;
  junctionTable?: string;
}>;

const governanceTableRole = 'detail';
const governancePrimaryTable = 'biz_mdqa_order';
const governanceRelationFromField = 'orderId';
const governanceRelationToField = 'id';

type RelationRuntimeRow = Record<string, unknown>;

type ChildModuleField = {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  visibleInForm?: boolean;
  placeholder?: string;
  enumOptions?: Array<{ value: string; label: string }>;
};

type ChildModuleRelation = {
  name: string;
  type: string;
  localField: string;
  targetField: string;
  targetLabelField?: string;
  lookupApi?: string;
  lookupValueField?: string;
};

interface ChildModuleSchema {
  name: string;
  displayName: string;
  scope: string;
  relations?: ChildModuleRelation[];
  metadata?: {
    tableRole?: string;
    primaryTable?: string;
  };
  model: {
    tableName: string;
    fields: ChildModuleField[];
  };
}

interface RelationRuntimeState {
  loading: boolean;
  items: RelationRuntimeRow[];
  error?: boolean;
  unsupported?: boolean;
}

interface RelationEditorState {
  relationName: string;
  mode: 'create' | 'edit';
  record?: RelationRuntimeRow;
}

interface ManyToManyBindingState {
  relationName: string;
  options: RelationEditorOption[];
}

interface RelationEditorOption {
  label: string;
  value: string | number;
}

interface ChildRelationContract {
  field: string;
  lookupApi?: string;
  targetField?: string;
  targetLabelField?: string;
  lookupValueField?: string;
}

function normalizeRelationOptionValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return String(value ?? '');
}

function normalizeRelationOptionLabel(value: unknown, fallback: string | number): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return String(fallback);
}

function normalizeRelationOptionRows(payload: unknown): RelationRuntimeRow[] {
  if (Array.isArray(payload)) {
    return payload as RelationRuntimeRow[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as RelationRuntimeRow[];
    }
    if (Array.isArray(record.list)) {
      return record.list as RelationRuntimeRow[];
    }
    if (Array.isArray(record.rows)) {
      return record.rows as RelationRuntimeRow[];
    }
    if (Array.isArray(record.data)) {
      return record.data as RelationRuntimeRow[];
    }
  }
  return [];
}

async function loadLookupRelationRows(url: string): Promise<RelationRuntimeRow[]> {
  const payload = await apiRequest<unknown>({
    url,
    method: 'get',
    skipErrorMessage: true,
  });
  return normalizeRelationOptionRows(payload);
}

async function loadModuleRelationRows(
  scope: string,
  moduleName: string,
  targetField: string,
  targetValue: unknown,
): Promise<RelationRuntimeRow[]> {
  const payload = await apiRequest<{ items?: RelationRuntimeRow[] }>({
    url: `/${scope}/${moduleName}/list`,
    method: 'get',
    params: {
      [targetField]: targetValue,
      page: 1,
      pageSize: 5,
    },
    skipErrorMessage: true,
  });
  return Array.isArray(payload?.items) ? payload.items : [];
}

async function loadManyToManyRelationRows(
  scope: string,
  moduleName: string,
  ownerId: unknown,
  relationName: string,
): Promise<RelationRuntimeRow[]> {
  if (ownerId === undefined || ownerId === null || ownerId === '') {
    return [];
  }
  const payload = await apiRequest<{ items?: RelationRuntimeRow[] }>({
    url: buildManyToManyRelationBasePath(scope, moduleName, ownerId, relationName),
    method: 'get',
    skipErrorMessage: true,
  });
  return Array.isArray(payload?.items) ? payload.items : [];
}

function buildModuleCrudBasePath(scope: string, moduleName: string): string {
  const normalized = String(moduleName || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  return `/${scope}/${normalized}`;
}

function buildManyToManyRelationBasePath(
  scope: string,
  moduleName: string,
  ownerId: unknown,
  relationName: string,
): string {
  return `${buildModuleCrudBasePath(scope, moduleName)}/${ownerId}/relations/${relationName}`;
}

function buildManyToManyRelationItemPath(
  scope: string,
  moduleName: string,
  ownerId: unknown,
  relationName: string,
  targetId: string | number,
): string {
  return `${buildManyToManyRelationBasePath(scope, moduleName, ownerId, relationName)}/${targetId}`;
}

function stringifyRelationValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

function buildRelationRuntimePath(scope: string, moduleName: string): string {
  return buildModuleCrudBasePath(scope, moduleName);
}

function buildManagedModuleKey(scope: string, moduleName: string): string {
  const normalized = String(moduleName || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\//g, '.');
  return `${scope}.${normalized}`;
}

async function loadManagedModuleSchema(
  getGeneratedModuleSchema: (module: string) => Promise<ChildModuleSchema>,
  scope: string,
  moduleName: string,
): Promise<ChildModuleSchema> {
  return getGeneratedModuleSchema(buildManagedModuleKey(scope, moduleName));
}

function resolveEditableChildRelation(
  relation: (typeof governanceRelations)[number],
  childSchema: ChildModuleSchema | null,
  currentTableName: string,
): boolean {
  if (!childSchema || relation.type !== 'oneToMany') {
    return false;
  }
  return (
    childSchema.metadata?.tableRole === 'detail' &&
    childSchema.metadata?.primaryTable === currentTableName
  );
}

function buildEditableChildFields(
  relation: (typeof governanceRelations)[number],
  childSchema: ChildModuleSchema,
): ChildModuleField[] {
  return (childSchema.model.fields || []).filter(
    (field) => field.visibleInForm !== false && field.name !== relation.targetField,
  );
}

function buildChildRelationInitialValues(
  relation: (typeof governanceRelations)[number],
  detail: Record<string, unknown>,
  record?: RelationRuntimeRow,
): Record<string, unknown> {
  return {
    ...(record || {}),
    [relation.targetField]: detail[relation.localField],
  };
}

function buildChildRelationContractMap(
  childSchema: ChildModuleSchema,
): Record<string, ChildRelationContract> {
  return (childSchema.relations || []).reduce<Record<string, ChildRelationContract>>((acc, relation) => {
    acc[relation.localField] = {
      field: relation.localField,
      lookupApi: relation.lookupApi,
      targetField: relation.targetField,
      targetLabelField: relation.targetLabelField,
      lookupValueField: relation.lookupValueField,
    };
    return acc;
  }, {});
}

function buildChildRelationOptionKey(schemaName: string, fieldName: string): string {
  return `${schemaName}:${fieldName}`;
}

function resolveRelationRowValue(
  row: RelationRuntimeRow,
  relation: (typeof governanceRelations)[number],
): string | number | null {
  const rawValue =
    row[relation.lookupValueField || relation.targetField] ?? row.value ?? row.id ?? null;
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }
  return normalizeRelationOptionValue(rawValue);
}

function normalizeChildRelationOptions(
  rows: RelationRuntimeRow[],
  contract: ChildRelationContract,
): RelationEditorOption[] {
  return rows.map((item) => {
    const rawValue =
      item[contract.lookupValueField || contract.targetField || 'value'] ?? item.value ?? item.id ?? '';
    const value = normalizeRelationOptionValue(rawValue);
    const rawLabel =
      item[contract.targetLabelField || contract.targetField || 'label'] ?? item.label ?? item.name;
    return {
      value,
      label: normalizeRelationOptionLabel(rawLabel, value),
    };
  });
}

function normalizeManyToManyBindingOptions(
  rows: RelationRuntimeRow[],
  relation: (typeof governanceRelations)[number],
): RelationEditorOption[] {
  return rows.map((item) => {
    const value = resolveRelationRowValue(item, relation);
    const fallbackValue = value === null ? '' : value;
    const rawLabel =
      item[relation.targetLabelField || relation.targetField || 'label'] ?? item.label ?? item.name;
    return {
      value: fallbackValue,
      label: normalizeRelationOptionLabel(rawLabel, fallbackValue),
    };
  });
}

function mergeManyToManyRelationRows(
  relationRows: RelationRuntimeRow[],
  optionRows: RelationRuntimeRow[],
  relation: (typeof governanceRelations)[number],
): RelationRuntimeRow[] {
  const optionMap = new Map<string, RelationRuntimeRow>();
  optionRows.forEach((row) => {
    const value = resolveRelationRowValue(row, relation);
    if (value === null) {
      return;
    }
    optionMap.set(String(value), row);
  });

  return relationRows.map((row) => {
    const value = resolveRelationRowValue(row, relation);
    if (value === null) {
      return row;
    }
    const optionRow = optionMap.get(String(value));
    return {
      ...row,
      ...(optionRow || {}),
      [relation.lookupValueField || relation.targetField || 'value']: value,
      value,
      id: value,
    };
  });
}

function renderChildFieldInput(
  field: ChildModuleField,
  relationContract: ChildRelationContract | undefined,
  options: RelationEditorOption[],
  loading: boolean,
) {
  switch (field.type) {
    case 'enum':
      return <Select allowClear options={(field.enumOptions || []).map((item) => ({ label: item.label, value: item.value }))} />;
    case 'relation':
      return (
        <Select
          allowClear
          loading={loading}
          disabled={!relationContract?.lookupApi}
          placeholder={field.placeholder || field.label || field.name}
          options={options}
        />
      );
    case 'int':
    case 'float':
      return <InputNumber style={{ width: '100%' }} />;
    case 'bool':
      return <Switch />;
    case 'text':
      return <TextArea autoSize />;
    default:
      return <Input placeholder={field.placeholder || field.label || field.name} />;
  }
}

function buildRelationRuntimeColumns(
  relation: (typeof governanceRelations)[number],
  rows: RelationRuntimeRow[],
  onEdit?: (row: RelationRuntimeRow) => void,
  onUnbind?: (row: RelationRuntimeRow) => void,
  actionTitle?: string,
  actionLabel?: string,
  unbindLabel?: string,
) {
  const labelField = relation.targetLabelField || 'label';
  const columns: Array<{
    title: string;
    dataIndex: string;
    render: (_: unknown, row: RelationRuntimeRow) => React.ReactNode;
  }> = [
    {
      title: labelField,
      dataIndex: labelField,
      render: (_: unknown, row: RelationRuntimeRow) =>
        stringifyRelationValue(row[labelField] ?? row.label ?? row.name ?? row[relation.targetField]),
    },
    {
      title: relation.targetField,
      dataIndex: relation.targetField,
      render: (_: unknown, row: RelationRuntimeRow) =>
        stringifyRelationValue(row[relation.targetField] ?? row.value ?? row.id),
    },
  ];
  const firstRow = rows[0];
  if (firstRow && relation.lookupValueField && relation.lookupValueField !== relation.targetField) {
    columns.push({
      title: relation.lookupValueField,
      dataIndex: relation.lookupValueField,
      render: (_: unknown, row: RelationRuntimeRow) =>
        stringifyRelationValue(row[relation.lookupValueField || relation.targetField]),
    });
  }
  if (onEdit || onUnbind) {
    columns.push({
      title: actionTitle || 'Actions',
      dataIndex: 'actions',
      render: (_: unknown, row: RelationRuntimeRow) => (
        <Space size={8}>
          {onEdit ? (
            <Button
              size="mini"
              onClick={() => {
                onEdit(row);
              }}
            >
              {actionLabel || 'Edit'}
            </Button>
          ) : null}
          {onUnbind ? (
            <Button
              size="mini"
              status="danger"
              onClick={() => {
                onUnbind(row);
              }}
            >
              {unbindLabel || 'Remove'}
            </Button>
          ) : null}
        </Space>
      ),
    });
  }
  return columns;
}


const FormItem = Form.Item;
const TextArea = Input.TextArea;

const MdqaorderitemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const scope = 'business';
  const moduleName = 'mdqaorderitem';
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [detail, setDetail] = useState<MdqaorderitemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [relatedData, setRelatedData] = useState<Record<string, RelationRuntimeState>>({});
  const [childSchemas, setChildSchemas] = useState<Record<string, ChildModuleSchema | null>>({});
  const [childSchemaErrors, setChildSchemaErrors] = useState<Record<string, boolean>>({});
  const [editingChildRelation, setEditingChildRelation] = useState<RelationEditorState | null>(null);
  const [bindingRelation, setBindingRelation] = useState<ManyToManyBindingState | null>(null);
  const [childSubmitting, setChildSubmitting] = useState(false);
  const [manyToManySubmitting, setManyToManySubmitting] = useState(false);
  const [childRelationOptions, setChildRelationOptions] = useState<Record<string, RelationEditorOption[]>>({});
  const [childRelationLoading, setChildRelationLoading] = useState<Record<string, boolean>>({});
  const [childForm] = Form.useForm();
  const [bindForm] = Form.useForm();

  const loadDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getMdqaorderitemDetail(Number(id));
      setDetail(result);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadChildRelationOptions = useCallback(async (schema: ChildModuleSchema) => {
    const relationContracts = buildChildRelationContractMap(schema);
    const loadingKeys: string[] = [];

    setChildRelationLoading((prev) => {
      const next = { ...prev };
      Object.values(relationContracts).forEach((contract) => {
        if (!contract.lookupApi) {
          return;
        }
        const optionKey = buildChildRelationOptionKey(schema.name, contract.field);
        next[optionKey] = true;
        loadingKeys.push(optionKey);
      });
      return next;
    });

    try {
      const nextOptions: Record<string, RelationEditorOption[]> = {};
      await Promise.all(
        Object.values(relationContracts).map(async (contract) => {
          if (!contract.lookupApi) {
            return;
          }
          const rows = await loadLookupRelationRows(contract.lookupApi);
          nextOptions[buildChildRelationOptionKey(schema.name, contract.field)] =
            normalizeChildRelationOptions(rows, contract);
        }),
      );
      if (Object.keys(nextOptions).length > 0) {
        setChildRelationOptions((prev) => ({ ...prev, ...nextOptions }));
      }
    } finally {
      if (loadingKeys.length > 0) {
        setChildRelationLoading((prev) => {
          const next = { ...prev };
          loadingKeys.forEach((key) => {
            next[key] = false;
          });
          return next;
        });
      }
    }
  }, []);

  const loadRelationData = useCallback(
    async (nextDetail: MdqaorderitemDetail) => {
      const nextState: Record<string, RelationRuntimeState> = {};
      await Promise.all(
        governanceRelations.map(async (relation) => {
          nextState[relation.name] = { loading: true, items: [] };
          try {
            if (relation.type === 'lookup' && relation.lookupApi) {
              const optionRows = await loadLookupRelationRows(relation.lookupApi);
              const localValue = nextDetail[relation.localField as keyof MdqaorderitemDetail];
              const matched = optionRows.filter((row) => {
                const rawValue =
                  row[relation.lookupValueField || relation.targetField] ?? row.value ?? row.id;
                return String(rawValue ?? '') === String(localValue ?? '');
              });
              nextState[relation.name] = {
                loading: false,
                items: matched,
              };
              return;
            }
            const localValue = nextDetail[relation.localField as keyof MdqaorderitemDetail];
            if (relation.type === 'manyToMany') {
              if (!relation.lookupApi) {
                nextState[relation.name] = {
                  loading: false,
                  items: [],
                  unsupported: true,
                };
                return;
              }
              const [bindingRows, optionRows] = await Promise.all([
                loadManyToManyRelationRows(scope, moduleName, localValue, relation.name),
                loadLookupRelationRows(relation.lookupApi),
              ]);
              nextState[relation.name] = {
                loading: false,
                items: mergeManyToManyRelationRows(bindingRows, optionRows, relation),
              };
              return;
            }
            if (localValue === undefined || localValue === null || localValue === '') {
              nextState[relation.name] = { loading: false, items: [] };
              return;
            }
            const listResult = await loadModuleRelationRows(
              scope,
              relation.targetModule,
              relation.targetField,
              localValue,
            );
            nextState[relation.name] = {
              loading: false,
              items: listResult,
            };
          } catch {
            nextState[relation.name] = {
              loading: false,
              items: [],
              error: true,
            };
          }
        }),
      );
      setRelatedData(nextState);
    },
    [moduleName, scope],
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const childRelations = governanceRelations.filter(
      (relation) => relation.type === 'oneToMany' && !relation.lookupApi,
    );
    if (childRelations.length === 0) {
      return;
    }
    void Promise.all(
      childRelations.map(async (relation) => {
        try {
          const schema = await loadManagedModuleSchema(
            getGeneratedModuleSchema,
            scope,
            relation.targetModule,
          );
          setChildSchemas((prev) => ({ ...prev, [relation.name]: schema }));
        } catch {
          setChildSchemaErrors((prev) => ({ ...prev, [relation.name]: true }));
        }
      }),
    );
  }, [scope]);

  useEffect(() => {
    if (!detail) {
      return;
    }
    void loadRelationData(detail);
  }, [detail, loadRelationData]);

  const openChildCreateModal = useCallback(
    async (relation: (typeof governanceRelations)[number]) => {
      if (!detail) {
        return;
      }
      const schema = childSchemas[relation.name];
      if (!schema) {
        message.error(t('generator.wizard.result.childTableSchemaLoadFailed'));
        return;
      }
      childForm.setFieldsValue(
        buildChildRelationInitialValues(relation, detail as unknown as Record<string, unknown>),
      );
      setEditingChildRelation({ relationName: relation.name, mode: 'create' });
      await loadChildRelationOptions(schema);
    },
    [childForm, childSchemas, detail, loadChildRelationOptions, t],
  );

  const openChildEditModal = useCallback(
    async (relation: (typeof governanceRelations)[number], record: RelationRuntimeRow) => {
      if (!detail) {
        return;
      }
      const schema = childSchemas[relation.name];
      if (!schema) {
        message.error(t('generator.wizard.result.childTableSchemaLoadFailed'));
        return;
      }
      childForm.setFieldsValue(
        buildChildRelationInitialValues(
          relation,
          detail as unknown as Record<string, unknown>,
          record,
        ),
      );
      setEditingChildRelation({ relationName: relation.name, mode: 'edit', record });
      await loadChildRelationOptions(schema);
    },
    [childForm, childSchemas, detail, loadChildRelationOptions, t],
  );

  const closeChildDialog = useCallback(() => {
    setEditingChildRelation(null);
    childForm.resetFields();
  }, [childForm]);

  const openRelationBindModal = useCallback(
    async (relation: (typeof governanceRelations)[number]) => {
      if (!detail || relation.type !== 'manyToMany' || !relation.lookupApi) {
        return;
      }
      const optionRows = await loadLookupRelationRows(relation.lookupApi);
      const options = normalizeManyToManyBindingOptions(optionRows, relation);
      const selectedTargetIds = (relatedData[relation.name]?.items || [])
        .map((row) => resolveRelationRowValue(row, relation))
        .filter((value): value is string | number => value !== null);
      bindForm.setFieldsValue({ targetIds: selectedTargetIds });
      setBindingRelation({
        relationName: relation.name,
        options,
      });
    },
    [bindForm, detail, relatedData],
  );

  const closeRelationBindModal = useCallback(() => {
    setBindingRelation(null);
    bindForm.resetFields();
  }, [bindForm]);

  const submitChildRelationForm = useCallback(async () => {
    if (!detail || !editingChildRelation) {
      return;
    }
    const relation =
      governanceRelations.find((item) => item.name === editingChildRelation.relationName) || null;
    if (!relation) {
      return;
    }

    let values: Record<string, unknown>;
    try {
      values = await childForm.validate();
    } catch (submitError) {
      if (isArcoFormValidationError(submitError)) {
        return;
      }
      throw submitError;
    }

    setChildSubmitting(true);
    try {
      const payload = {
        ...values,
        [relation.targetField]: detail[relation.localField as keyof MdqaorderitemDetail],
      };
      if (editingChildRelation.mode === 'edit') {
        const recordId = Number(editingChildRelation.record?.id ?? 0);
        if (!recordId) {
          message.error(t('common.actionFailed'));
          return;
        }
        await apiRequest({
          url: `${buildModuleCrudBasePath(scope, relation.targetModule)}/${recordId}`,
          method: 'put',
          data: payload,
        });
        message.success(t('common.updateSuccess'));
      } else {
        await apiRequest({
          url: buildModuleCrudBasePath(scope, relation.targetModule),
          method: 'post',
          data: payload,
        });
        message.success(t('common.createSuccess'));
      }
      closeChildDialog();
      await loadRelationData(detail);
    } finally {
      setChildSubmitting(false);
    }
  }, [childForm, closeChildDialog, detail, editingChildRelation, loadRelationData, scope, t]);

  const submitManyToManyBinding = useCallback(async () => {
    if (!detail || !bindingRelation) {
      return;
    }
    const relation = governanceRelations.find((item) => item.name === bindingRelation.relationName) || null;
    if (!relation) {
      return;
    }

    let values: Record<string, unknown>;
    try {
      values = await bindForm.validate();
    } catch (submitError) {
      if (isArcoFormValidationError(submitError)) {
        return;
      }
      throw submitError;
    }

    const targetIds = Array.isArray(values.targetIds)
      ? values.targetIds.filter((item) => item !== null && item !== undefined && item !== '')
      : [];

    setManyToManySubmitting(true);
    try {
      await apiRequest({
        url: buildManyToManyRelationBasePath(scope, moduleName, detail.id, relation.name),
        method: 'post',
        data: { targetIds: targetIds.map((item) => String(item)) },
      });
      message.success(t('common.updateSuccess'));
      closeRelationBindModal();
      await loadRelationData(detail);
    } finally {
      setManyToManySubmitting(false);
    }
  }, [bindForm, bindingRelation, closeRelationBindModal, detail, loadRelationData, moduleName, scope, t]);

  const unbindManyToManyRelation = useCallback(
    async (relation: (typeof governanceRelations)[number], record: RelationRuntimeRow) => {
      if (!detail) {
        return;
      }
      const targetId = resolveRelationRowValue(record, relation);
      if (targetId === null) {
        message.error(t('common.actionFailed'));
        return;
      }
      await apiRequest({
        url: buildManyToManyRelationItemPath(scope, moduleName, detail.id, relation.name, targetId),
        method: 'delete',
      });
      message.success(t('common.updateSuccess'));
      await loadRelationData(detail);
    },
    [detail, loadRelationData, moduleName, scope, t],
  );

  const activeChildRelation =
    editingChildRelation
      ? governanceRelations.find((item) => item.name === editingChildRelation.relationName) || null
      : null;
  const activeChildSchema = activeChildRelation ? childSchemas[activeChildRelation.name] || null : null;
  const editableChildFields =
    activeChildRelation && activeChildSchema
      ? buildEditableChildFields(activeChildRelation, activeChildSchema)
      : [];
  const activeChildContracts = activeChildSchema ? buildChildRelationContractMap(activeChildSchema) : {};

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={() => { void loadDetail(); }} />;
  }

  if (!detail) {
    return <PageEmpty />;
  }

  return (
    <PageContainer>
      <Card bordered={false}>
        <Typography.Title heading={5}>{t('business.mdqaorderitem.title')}</Typography.Title>
        <Descriptions column={1} data={[
          { label: t('business.mdqaorderitem.field.itemName.label'), value: String(detail.itemName ?? '-') },
          { label: t('business.mdqaorderitem.field.quantity.label'), value: String(detail.quantity ?? '-') },
          { label: t('business.mdqaorderitem.field.enabled.label'), value: String(detail.enabled ?? '-') },
          { label: t('business.mdqaorderitem.field.remark.label'), value: String(detail.remark ?? '-') },
          { label: t('business.mdqaorderitem.field.orderId.label'), value: String(detail.orderId ?? '-') },
        ]} />
      </Card>
      <Card bordered={false}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title heading={6}>
            {t('generator.wizard.result.contractTitle')}
          </Typography.Title>
          <Space wrap>
            <Tag color="purple">{t(`generator.wizard.tableRole.${governanceTableRole}`)}</Tag>
            {governancePrimaryTable ? (
              <Tag color="arcoblue">
                {t('generator.wizard.primaryTable')}: {governancePrimaryTable}
              </Tag>
            ) : null}
            {governanceRelationFromField ? <Tag color="orange">{governanceRelationFromField}</Tag> : null}
            {governanceRelationToField ? <Tag color="orange">{governanceRelationToField}</Tag> : null}
          </Space>
          {governanceDependencies.length > 0 ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                {t('generator.wizard.result.dependencies')}
              </Typography.Text>
              {governanceDependencies.map((dependency) => (
                <Typography.Text key={dependency.module} code>
                  {dependency.module}
                  {dependency.reason ? ` · ${dependency.reason}` : ''}
                </Typography.Text>
              ))}
            </Space>
          ) : null}
          {governanceRelations.length > 0 ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                {t('generator.wizard.result.relations')}
              </Typography.Text>
              {governanceRelations.map((relation) => (
                <Typography.Text key={`${relation.name}-${relation.targetModule}`} code>
                  {relation.name} · {relation.type} · {relation.targetModule} · {relation.localField} → {relation.targetField}
                  {relation.junctionTable ? ` · ${relation.junctionTable}` : ''}
                </Typography.Text>
              ))}
            </Space>
          ) : null}
        </Space>
      </Card>
      {governanceRelations.length > 0 ? (
        <Card bordered={false}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title heading={6}>
              {t('generator.wizard.result.relatedData')}
            </Typography.Title>
            {governanceRelations.map((relation) => {
              const relationState = relatedData[relation.name];
              const rows = relationState?.items || [];
              return (
                <Card key={relation.name} size="small">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Space wrap>
                      <Typography.Text code>{relation.name}</Typography.Text>
                      <Tag color="arcoblue">{relation.type}</Tag>
                      <Typography.Text type="secondary">{relation.targetModule}</Typography.Text>
                      {resolveEditableChildRelation(
                        relation,
                        childSchemas[relation.name] || null,
                        'biz_mdqa_order_item',
                      ) ? (
                        <Button
                          size="mini"
                          type="primary"
                          onClick={() => {
                            void openChildCreateModal(relation);
                          }}
                        >
                          {t('generator.wizard.result.childTableCreate')}
                        </Button>
                      ) : relation.type === 'manyToMany' && relation.lookupApi ? (
                        <Button
                          size="mini"
                          type="primary"
                          onClick={() => {
                            void openRelationBindModal(relation);
                          }}
                        >
                          {t('generator.wizard.result.relatedDataBind')}
                        </Button>
                      ) : null}
                      <Button
                        size="mini"
                        onClick={() => navigate(buildRelationRuntimePath(scope, relation.targetModule))}
                      >
                        {t('generator.wizard.result.openRelatedModule')}
                      </Button>
                    </Space>
                    {childSchemaErrors[relation.name] ? (
                      <Alert type="warning" content={t('generator.wizard.result.childTableSchemaLoadFailed')} />
                    ) : null}
                    {relationState?.loading ? (
                      <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
                    ) : relationState?.unsupported ? (
                      <Alert type="info" content={t('generator.wizard.result.relatedDataUnsupported')} />
                    ) : relationState?.error ? (
                      <Alert type="warning" content={t('generator.wizard.result.relatedDataLoadFailed')} />
                    ) : rows.length === 0 ? (
                      <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
                    ) : (
                      <Table
                        size="small"
                        pagination={false}
                        rowKey={(record) =>
                          String(
                            record.id ??
                              record[relation.targetField] ??
                              record[relation.lookupValueField || relation.targetField] ??
                              relation.name,
                          )
                        }
                        data={rows.slice(0, 5)}
                        columns={buildRelationRuntimeColumns(
                          relation,
                          rows,
                          resolveEditableChildRelation(
                            relation,
                            childSchemas[relation.name] || null,
                            'biz_mdqa_order_item',
                          )
                            ? (record) => {
                                void openChildEditModal(relation, record);
                              }
                            : undefined,
                          relation.type === 'manyToMany'
                            ? (record) => {
                                void unbindManyToManyRelation(relation, record);
                              }
                            : undefined,
                          t('generator.wizard.result.childTableActions'),
                          t('generator.wizard.result.childTableEdit'),
                          t('generator.wizard.result.relatedDataUnbind'),
                        )}
                      />
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        </Card>
      ) : null}
      <AppModal
        title={t('generator.wizard.result.relatedDataBind')}
        visible={Boolean(bindingRelation)}
        size="md"
        onCancel={closeRelationBindModal}
        footer={
          <SubmitBar
            onCancel={closeRelationBindModal}
            onSubmit={() => {
              void submitManyToManyBinding();
            }}
            loading={manyToManySubmitting}
            submitText={t('common.save')}
          />
        }
      >
        <Form form={bindForm} layout="vertical">
          <FormItem
            field="targetIds"
            label={bindingRelation?.relationName || 'targetIds'}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              mode="multiple"
              allowClear
              options={bindingRelation?.options || []}
              placeholder={t('generator.wizard.result.relatedDataBind')}
            />
          </FormItem>
        </Form>
      </AppModal>
      <AppModal
        title={
          editingChildRelation?.mode === 'edit'
            ? t('generator.wizard.result.childTableDialogEdit')
            : t('generator.wizard.result.childTableDialogCreate')
        }
        visible={Boolean(editingChildRelation)}
        size="lg"
        onCancel={closeChildDialog}
        footer={
          <SubmitBar
            onCancel={closeChildDialog}
            onSubmit={() => {
              void submitChildRelationForm();
            }}
            loading={childSubmitting}
            submitText={
              editingChildRelation?.mode === 'edit' ? t('common.save') : t('common.create')
            }
          />
        }
        unmountOnExit
      >
        <Form
          form={childForm}
          layout="vertical"
          onSubmit={() => {
            void submitChildRelationForm();
          }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {activeChildRelation && activeChildSchema ? (
              editableChildFields.length > 0 ? (
                editableChildFields.map((field) => {
                  const optionKey = buildChildRelationOptionKey(activeChildSchema.name, field.name);
                  return (
                    <FormItem
                      key={field.name}
                      label={field.label || field.name}
                      field={field.name}
                      rules={field.required ? [{ required: true }] : undefined}
                      triggerPropName={field.type === 'bool' ? 'checked' : undefined}
                    >
                      {renderChildFieldInput(
                        field,
                        activeChildContracts[field.name],
                        childRelationOptions[optionKey] || [],
                        Boolean(childRelationLoading[optionKey]),
                      )}
                    </FormItem>
                  );
                })
              ) : (
                <Alert type="info" content={t('generator.wizard.result.childTableNoEditableFields')} />
              )
            ) : (
              <Alert type="warning" content={t('generator.wizard.result.childTableSchemaLoadFailed')} />
            )}
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default MdqaorderitemDetailPage;
