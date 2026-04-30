import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  InputNumber,
import { message } from '../../../components/feedback/message';
  Popconfirm,
  Select,
  Space,
  Tag,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconRefresh, IconSearch } from '@arco-design/web-react/icon';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { isArcoFormValidationError } from '../../../core/arco/formValidation';
import { publishRefresh, useRefreshSubscription } from '../../../core/refresh/refreshBus';
import { invalidateRouteWarmDataMany, resolveRouteWarmData } from '../../../core/router/prefetch';
import { usePermission } from '../../../hooks/usePermission';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, ListHeaderActions, PageContainer, PageEmpty, PageError, PageLoading, PageNetworkError, PageServerError, SubmitBar, TABLE_ACTION_COLUMN_WIDTH, TableBatchActionBar, PermissionAction } from '../../../components';
import {
  analyzeDictUsage,
  createDictItem,
  createDictType,
  batchUpdateDictItemStatus,
  batchUpdateDictTypeStatus,
  deleteDictItem,
  deleteDictType,
  downloadDictItemImportTemplate,
  downloadDictTypeImportTemplate,
  exportDictItems,
  exportDictTypes,
  getDictItemList,
  getDictTypeList,
  importDictItems,
  importDictTypes,
  reorderDictItem,
  refreshDictCache,
  updateDictItem,
  updateDictType,
  type DictItemQuery,
  type DictItemPayload,
  type DictItemRow,
  type DictUsageAnalysisResp,
  type DictTypePayload,
  type DictTypeQuery,
  type DictTypeRow,
} from './api';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const { Text } = Typography;

const emptyTypeQuery: DictTypeQuery = {
  dictCode: '',
  dictName: '',
  status: undefined,
};

const emptyTypeForm: DictTypePayload = {
  dictCode: '',
  dictName: '',
  module: 'system',
  status: 1,
  remark: '',
};

const emptyItemForm: DictItemPayload = {
  dictCode: '',
  itemLabelKey: '',
  itemValue: '',
  itemColor: '',
  sort: 0,
  status: 1,
  remark: '',
};

const emptyItemQuery: Omit<DictItemQuery, 'dictCode'> = {
  keyword: '',
  status: undefined,
  page: 1,
  pageSize: 10,
};

function isDefaultDictTypeQuery(query: DictTypeQuery) {
  return !query.dictCode && !query.dictName && query.status === undefined;
}

function isDefaultDictItemQuery(query: Omit<DictItemQuery, 'dictCode'>) {
  return !query.keyword && query.status === undefined && (query.page ?? 1) === 1 && (query.pageSize ?? 10) === 10;
}

type DictTabKey = 'types' | 'items';
const DICT_SELECTED_TYPE_STORAGE_KEY = 'pantheon.dict.selectedTypeId';

const DictPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:dict:create');
  const canEdit = isAdmin || hasPerm('system:dict:update');
  const canDelete = isAdmin || hasPerm('system:dict:delete');
  const canRefresh = isAdmin || hasPerm('system:dict:refresh');
  const canExport = isAdmin || hasPerm('system:dict:export');
  const canImport = isAdmin || hasPerm('system:dict:import');

  const [typeRows, setTypeRows] = useState<DictTypeRow[]>([]);
  const [itemRows, setItemRows] = useState<DictItemRow[]>([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [typeLoading, setTypeLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DictTabKey>('types');
  const [typeError, setTypeError] = useState<unknown>(null);
  const [itemError, setItemError] = useState<unknown>(null);
  const [typeQuery, setTypeQuery] = useState<DictTypeQuery>(emptyTypeQuery);
  const [itemQuery, setItemQuery] = useState<Omit<DictItemQuery, 'dictCode'>>(emptyItemQuery);
  const [selectedType, setSelectedType] = useState<DictTypeRow | null>(null);
  const [typeVisible, setTypeVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const [selectedTypeRowKeys, setSelectedTypeRowKeys] = useState<(string | number)[]>([]);
  const [selectedItemRowKeys, setSelectedItemRowKeys] = useState<(string | number)[]>([]);
  const [usageVisible, setUsageVisible] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageAnalysis, setUsageAnalysis] = useState<DictUsageAnalysisResp | null>(null);
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeRow | null>(null);
  const [editingItem, setEditingItem] = useState<DictItemRow | null>(null);
  const [typeForm] = Form.useForm<DictTypePayload>();
  const [itemForm] = Form.useForm<DictItemPayload>();
  const [queryForm] = Form.useForm<DictTypeQuery>();
  const [itemQueryForm] = Form.useForm<Omit<DictItemQuery, 'dictCode'>>();
  const selectedTypeId = selectedType?.id;
  const invalidateDictCaches = useCallback((dictCode?: string) => {
    const targets: Array<{ path: string; resourceKeys?: string[] }> = [
      { path: '/system/dict', resourceKeys: ['types:default'] },
    ];
    if (dictCode) {
      targets.push({ path: '/system/dict', resourceKeys: [`items:${dictCode}:default`] });
    }
    invalidateRouteWarmDataMany(targets);
  }, []);

  const selectType = useCallback((nextType: DictTypeRow | null, options?: { resetItemQuery?: boolean }) => {
    setSelectedType(nextType);
    if (options?.resetItemQuery) {
      setItemQuery(emptyItemQuery);
    }
  }, []);

  const loadTypes = useCallback(async (nextQuery: DictTypeQuery = typeQuery) => {
    setTypeLoading(true);
    setTypeError(null);
    try {
      const rows = isDefaultDictTypeQuery(nextQuery)
        ? await resolveRouteWarmData('/system/dict', 'types:default', () => getDictTypeList(nextQuery))
        : await getDictTypeList(nextQuery);
      setTypeRows(rows);
      setSelectedTypeRowKeys([]);
      if (rows.length === 0) {
        selectType(null, { resetItemQuery: true });
        setItemRows([]);
        setItemError(null);
        localStorage.removeItem(DICT_SELECTED_TYPE_STORAGE_KEY);
        return;
      }
      const savedTypeId = Number(localStorage.getItem(DICT_SELECTED_TYPE_STORAGE_KEY) || 0);
      const nextSelectedType = rows.find((item) => item.id === selectedTypeId)
        || rows.find((item) => item.id === savedTypeId)
        || rows[0];
      selectType(nextSelectedType, { resetItemQuery: nextSelectedType.id !== selectedTypeId });
    } catch (requestError) {
      setTypeError(requestError);
    } finally {
      setTypeLoading(false);
    }
  }, [selectType, selectedTypeId, typeQuery]);

  const loadItems = useCallback(async (
    nextQuery: Omit<DictItemQuery, 'dictCode'> = itemQuery,
    dictCode?: string,
  ) => {
    const currentCode = dictCode || selectedType?.dictCode;
    if (!currentCode) {
      setItemRows([]);
      setItemTotal(0);
      setItemError(null);
      return;
    }
    setItemLoading(true);
    setItemError(null);
    try {
      const resp = isDefaultDictItemQuery(nextQuery)
        ? await resolveRouteWarmData('/system/dict', `items:${currentCode}:default`, () => getDictItemList({ dictCode: currentCode, ...nextQuery }))
        : await getDictItemList({ dictCode: currentCode, ...nextQuery });
      setItemRows(resp.items);
      setItemTotal(resp.total);
      setSelectedItemRowKeys([]);
    } catch (requestError) {
      setItemError(requestError);
    } finally {
      setItemLoading(false);
    }
  }, [itemQuery, selectedType?.dictCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTypes(typeQuery); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTypes, typeQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadItems(itemQuery, selectedType?.dictCode); }, 0);
    return () => window.clearTimeout(timer);
  }, [itemQuery, loadItems, selectedType?.dictCode]);

  useRefreshSubscription('system:dict:changed', (payload) => {
    if (payload.source === 'system/dict') {
      return;
    }
    void loadTypes(typeQuery);
    void loadItems(itemQuery, selectedType?.dictCode);
  });

  const selectedTypeTitle = useMemo(
    () => (selectedType ? t(selectedType.dictName, selectedType.dictCode) : t('system.dict.item.empty')),
    [selectedType, t],
  );

  const selectedTypeOptions = useMemo(
    () => typeRows.map((item) => ({
      label: `${t(item.dictName, item.dictCode)} (${item.dictCode})`,
      value: item.id,
    })),
    [t, typeRows],
  );

  const typeSummary = useMemo(() => {
    const activeCount = typeRows.filter((item) => item.status === 1).length;
    const totalItems = typeRows.reduce((sum, item) => sum + (item.itemCount || 0), 0);
    return {
      total: typeRows.length,
      active: activeCount,
      disabled: typeRows.length - activeCount,
      items: totalItems,
    };
  }, [typeRows]);

  const handleSearch = () => {
    const values = queryForm.getFieldsValue();
    setTypeQuery({
      ...typeQuery,
      ...values,
    });
  };

  const handleReset = () => {
    queryForm.setFieldsValue(emptyTypeQuery);
    setTypeQuery(emptyTypeQuery);
  };

  const handleItemSearch = () => {
    const values = itemQueryForm.getFieldsValue();
    setItemQuery({
      ...emptyItemQuery,
      ...values,
      page: 1,
    });
  };

  const handleItemReset = () => {
    itemQueryForm.setFieldsValue(emptyItemQuery);
    setItemQuery(emptyItemQuery);
  };

  const handleSelectedTypeChange = (value?: string | number) => {
    const nextType = typeRows.find((item) => item.id === Number(value)) || null;
    itemQueryForm.setFieldsValue(emptyItemQuery);
    selectType(nextType, { resetItemQuery: true });
  };

  const switchToItemsTab = (row: DictTypeRow) => {
    selectType(row, { resetItemQuery: row.id !== selectedTypeId });
    setActiveTab('items');
  };

  const openCreateType = () => {
    setEditingType(null);
    typeForm.setFieldsValue(emptyTypeForm);
    setTypeVisible(true);
  };

  const openEditType = (row: DictTypeRow) => {
    setEditingType(row);
    typeForm.setFieldsValue({
      dictCode: row.dictCode,
      dictName: row.dictName,
      module: row.module,
      status: row.status,
      remark: row.remark,
    });
    setTypeVisible(true);
  };

  const openCreateItem = () => {
    if (!selectedType) {
      return;
    }
    setEditingItem(null);
    itemForm.setFieldsValue({
      ...emptyItemForm,
      dictCode: selectedType.dictCode,
    });
    setItemVisible(true);
  };

  const openEditItem = (row: DictItemRow) => {
    setEditingItem(row);
    itemForm.setFieldsValue({
      dictCode: row.dictCode,
      itemLabelKey: row.itemLabelKey,
      itemValue: row.itemValue,
      itemColor: row.itemColor,
      sort: row.sort,
      status: row.status,
      remark: row.remark,
    });
    setItemVisible(true);
  };

  const submitTypeForm = async () => {
    let values;
    try {
      values = await typeForm.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    setTypeSubmitting(true);
    try {
      if (editingType) {
        await updateDictType(editingType.id, values);
        message.success(t('common.updateSuccess'));
      } else {
        await createDictType(values);
        message.success(t('common.createSuccess'));
      }
      invalidateDictCaches();
      publishRefresh('system:dict:changed', 'system/dict');
      setTypeVisible(false);
      await loadTypes(typeQuery);
    } finally {
      setTypeSubmitting(false);
    }
  };

  const submitItemForm = async () => {
    let values;
    try {
      values = await itemForm.validate();
    } catch (error) {
      if (isArcoFormValidationError(error)) {
        return;
      }
      throw error;
    }
    setItemSubmitting(true);
    try {
      if (editingItem) {
        await updateDictItem(editingItem.id, values);
        message.success(t('common.updateSuccess'));
      } else {
        await createDictItem(values);
        message.success(t('common.createSuccess'));
      }
      invalidateDictCaches(values.dictCode);
      publishRefresh('system:dict:changed', 'system/dict');
      setItemVisible(false);
      await loadItems(itemQuery, values.dictCode);
      await loadTypes(typeQuery);
    } finally {
      setItemSubmitting(false);
    }
  };

  const removeType = async (row: DictTypeRow) => {
    await deleteDictType(row.id);
    message.success(t('common.deleteSuccess'));
    invalidateDictCaches(row.dictCode);
    publishRefresh('system:dict:changed', 'system/dict');
    await loadTypes(typeQuery);
  };

  const removeItem = async (row: DictItemRow) => {
    await deleteDictItem(row.id);
    message.success(t('common.deleteSuccess'));
    invalidateDictCaches(row.dictCode);
    publishRefresh('system:dict:changed', 'system/dict');
    await loadItems(itemQuery, row.dictCode);
    await loadTypes(typeQuery);
  };

  const handleRefreshCache = async () => {
    const codes = selectedType ? [selectedType.dictCode] : [];
    await refreshDictCache({ codes });
    message.success(t('system.dict.refreshSuccess'));
    invalidateDictCaches(selectedType?.dictCode);
    publishRefresh('system:dict:changed', 'system/dict');
    await loadItems(itemQuery, selectedType?.dictCode);
  };

  const handleExportTypes = async () => {
    await exportDictTypes(typeQuery);
  };

  const handleDownloadTypeTemplate = async () => {
    await downloadDictTypeImportTemplate();
  };

  const handleImportTypes = async (file: File) => {
    const result = await importDictTypes(file);
    showImportResult(result, t);
    if (result.applied) {
      invalidateDictCaches();
      publishRefresh('system:dict:changed', 'system/dict');
      await loadTypes(typeQuery);
    }
  };

  const handleExportItems = async () => {
    if (!selectedType) {
      return;
    }
    await exportDictItems({
      dictCode: selectedType.dictCode,
      keyword: itemQuery.keyword,
      status: itemQuery.status,
    });
  };

  const handleDownloadItemTemplate = async () => {
    await downloadDictItemImportTemplate();
  };

  const handleImportItems = async (file: File) => {
    const result = await importDictItems(file);
    showImportResult(result, t);
    if (result.applied) {
      invalidateDictCaches(selectedType?.dictCode);
      publishRefresh('system:dict:changed', 'system/dict');
      await loadItems(itemQuery, selectedType?.dictCode);
      await loadTypes(typeQuery);
    }
  };

  const handleBatchTypeStatus = async (status: 1 | 2) => {
    if (selectedTypeRowKeys.length === 0) {
      message.warning(t('common.batchSelectionRequired'));
      return;
    }
    const typeIds = selectedTypeRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdateDictTypeStatus({ typeIds, status });
    message.success(t('system.dict.type.batchStatusSuccess', { count: result.updatedCount }));
    invalidateDictCaches();
    publishRefresh('system:dict:changed', 'system/dict');
    setSelectedTypeRowKeys([]);
    await loadTypes(typeQuery);
  };

  const handleBatchItemStatus = async (status: 1 | 2) => {
    if (selectedItemRowKeys.length === 0) {
      message.warning(t('common.batchSelectionRequired'));
      return;
    }
    const itemIds = selectedItemRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdateDictItemStatus({ itemIds, status });
    message.success(t('system.dict.item.batchStatusSuccess', { count: result.updatedCount }));
    invalidateDictCaches(selectedType?.dictCode);
    publishRefresh('system:dict:changed', 'system/dict');
    setSelectedItemRowKeys([]);
    await loadItems(itemQuery, selectedType?.dictCode);
    await loadTypes(typeQuery);
  };

  const handleReorderItem = async (row: DictItemRow, direction: 'up' | 'down') => {
    await reorderDictItem(row.id, direction);
    invalidateDictCaches(row.dictCode);
    publishRefresh('system:dict:changed', 'system/dict');
    await loadItems(itemQuery, row.dictCode);
    await loadTypes(typeQuery);
  };

  const handleOpenUsageAnalysis = async () => {
    if (!selectedType?.dictCode) {
      return;
    }
    setUsageVisible(true);
    setUsageLoading(true);
    try {
      const result = await analyzeDictUsage(selectedType.dictCode);
      setUsageAnalysis(result);
    } catch {
      setUsageAnalysis(null);
      message.error(t('system.dict.usage.error'));
    } finally {
      setUsageLoading(false);
    }
  };

  const typeColumns: ColumnProps<DictTypeRow>[] = [
    {
      title: t('system.dict.dictCode'),
      dataIndex: 'dictCode',
      width: 180,
      render: (value: string, row: DictTypeRow) => (
        <Button type="text" style={{ padding: 0 }} onClick={() => selectType(row, { resetItemQuery: row.id !== selectedTypeId })}>
          {value}
        </Button>
      ),
    },
    {
      title: t('system.dict.dictName'),
      dataIndex: 'dictName',
      width: 160,
      render: (value: string) => (
        <Text ellipsis={{ showTooltip: true }}>
          {t(value, value)}
        </Text>
      ),
    },
    {
      title: t('system.dict.module'),
      dataIndex: 'module',
      width: 120,
      ellipsis: true,
    },
    {
      title: t('system.dict.item'),
      dataIndex: 'itemCount',
      width: 108,
      render: (_: unknown, row: DictTypeRow) => (
        <Text>{`${row.activeItemCount}/${row.itemCount}`}</Text>
      ),
    },
    {
      title: t('system.dict.status'),
      dataIndex: 'status',
      width: 96,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.medium,
      render: (_: unknown, row: DictTypeRow) => (
        <Space size={4} className="system-list__actions">
          <Button size="small" type="text" onClick={() => switchToItemsTab(row)}>
            {t('system.dict.item')}
          </Button>
          <Button size="small" icon={<IconEdit />} onClick={() => openEditType(row)} disabled={!canEdit}>
            {t('common.edit')}
          </Button>
          <Popconfirm title={t('common.deleteConfirm')} onOk={() => removeType(row)} disabled={!canDelete}>
            <Button size="small" status="danger" icon={<IconDelete />} disabled={!canDelete}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnProps<DictItemRow>[] = [
    {
      title: t('system.dict.itemLabelKey'),
      dataIndex: 'itemLabelKey',
      width: 300,
      render: (value: string) => (
        <Space direction="vertical" size={2}>
          <Text ellipsis={{ showTooltip: true }}>{t(value, value)}</Text>
          <Text type="secondary" className="text-sm" ellipsis={{ showTooltip: true }}>{value}</Text>
        </Space>
      ),
    },
    {
      title: t('system.dict.itemValue'),
      dataIndex: 'itemValue',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('system.dict.itemColor'),
      dataIndex: 'itemColor',
      width: 120,
      render: (value: string) => value ? <Tag color={value}>{value}</Tag> : '-',
    },
    { title: t('system.dict.sort'), dataIndex: 'sort', width: 90 },
    {
      title: t('system.dict.status'),
      dataIndex: 'status',
      width: 96,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      width: TABLE_ACTION_COLUMN_WIDTH.wide,
      render: (_: unknown, row: DictItemRow) => (
        <Space size={4} className="system-list__actions">
          <Button size="small" type="text" onClick={() => { void handleReorderItem(row, 'up'); }} disabled={!canEdit}>
            {t('system.dict.moveUp')}
          </Button>
          <Button size="small" type="text" onClick={() => { void handleReorderItem(row, 'down'); }} disabled={!canEdit}>
            {t('system.dict.moveDown')}
          </Button>
          <Button size="small" icon={<IconEdit />} onClick={() => openEditItem(row)} disabled={!canEdit}>
            {t('common.edit')}
          </Button>
          <Popconfirm title={t('common.deleteConfirm')} onOk={() => removeItem(row)} disabled={!canDelete}>
            <Button size="small" status="danger" icon={<IconDelete />} disabled={!canDelete}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderRequestErrorState = (requestError: unknown, onRetry: () => void) => {
    if (isNetworkRequestError(requestError)) {
      return <PageNetworkError timeout={isTimeoutRequestError(requestError)} onRetry={onRetry} />;
    }
    if (isServerRequestError(requestError)) {
      return <PageServerError onRetry={onRetry} />;
    }
    return <PageError onRetry={onRetry} />;
  };

  const handleItemTableChange: TableProps<DictItemRow>['onChange'] = (pagination) => {
    setItemQuery((prev) => ({
      ...prev,
      page: pagination.current || prev.page || emptyItemQuery.page,
      pageSize: pagination.pageSize || prev.pageSize || emptyItemQuery.pageSize,
    }));
  };

  const typeBatchActionDisabled = !canEdit || selectedTypeRowKeys.length === 0;
  const itemBatchActionDisabled = !canEdit || selectedItemRowKeys.length === 0;
  const heroStats = useMemo(
    () => [
      {
        key: 'types',
        label: t('system.dict.type'),
        value: typeSummary.total,
        hint: t('system.dict.hero.typeHint'),
      },
      {
        key: 'active',
        label: t('system.user.status.enabled'),
        value: typeSummary.active,
        hint: t('system.dict.hero.activeHint'),
      },
      {
        key: 'items',
        label: t('system.dict.item'),
        value: typeSummary.items,
        hint: t('system.dict.hero.itemHint'),
      },
      {
        key: 'selected',
        label: t('system.dict.hero.currentType'),
        value: selectedType?.dictCode || '-',
        hint: t('system.dict.hero.currentHint'),
      },
    ],
    [selectedType?.dictCode, t, typeSummary.active, typeSummary.items, typeSummary.total],
  );

  useEffect(() => {
    if (selectedType?.id) {
      localStorage.setItem(DICT_SELECTED_TYPE_STORAGE_KEY, String(selectedType.id));
      return;
    }
    localStorage.removeItem(DICT_SELECTED_TYPE_STORAGE_KEY);
  }, [selectedType?.id]);

  return (
    <PageContainer>
      <Space direction="vertical" size={16} className="system-page-template">
        <Card className="page-panel system-page-hero">
          <div className="system-page-hero__top">
            <div className="system-page-hero__copy">
              <span className="system-page-hero__eyebrow">{t('system.dict.hero.eyebrow')}</span>
              <Typography.Paragraph className="system-page-hero__desc">
                {t('system.dict.hero.desc')}
              </Typography.Paragraph>
            </div>
          </div>
          <div className="system-page-kpi-grid">
            {heroStats.map((item) => (
              <div key={item.key} className="system-page-kpi">
                <span className="system-page-kpi__label">{item.label}</span>
                <span className="system-page-kpi__value">{item.value}</span>
                <span className="system-page-kpi__hint">{item.hint}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="page-split-layout">
          <div className="page-main-column">
            <Card className="page-panel">
          <Tabs activeTab={activeTab} onChange={(value) => setActiveTab(value as DictTabKey)}>
            <Tabs.TabPane key="types" title={t('system.dict.type')}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div className="dict-workbench__summary">
                  <Card className="dict-workbench__summary-card dict-workbench__summary-card--active">
                    <span>{t('system.dict.type')}</span>
                    <strong>{typeSummary.total}</strong>
                  </Card>
                  <Card className="dict-workbench__summary-card">
                    <span>{t('system.user.status.enabled')}</span>
                    <strong>{typeSummary.active}</strong>
                  </Card>
                  <Card className="dict-workbench__summary-card">
                    <span>{t('system.user.status.disabled')}</span>
                    <strong>{typeSummary.disabled}</strong>
                  </Card>
                  <Card className="dict-workbench__summary-card">
                    <span>{t('system.dict.item')}</span>
                    <strong>{typeSummary.items}</strong>
                  </Card>
                </div>

                <FilterPanel>
                  <Form form={queryForm} layout="vertical">
                    <Row gutter={16}>
                      <Col span={8}>
                        <FormItem label={t('system.dict.dictCode')} field="dictCode">
                          <Input />
                        </FormItem>
                      </Col>
                      <Col span={8}>
                        <FormItem label={t('system.dict.dictName')} field="dictName">
                          <Input />
                        </FormItem>
                      </Col>
                      <Col span={4}>
                        <FormItem label={t('system.dict.status')} field="status">
                          <Select allowClear options={[
                            { label: t('system.user.status.enabled'), value: 1 },
                            { label: t('system.user.status.disabled'), value: 2 },
                          ]} />
                        </FormItem>
                      </Col>
                      <Col span={4}>
                        <FormItem className="filter-panel__action-item">
                          <Space>
                            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>{t('common.search')}</Button>
                            <Button onClick={handleReset}>{t('common.reset')}</Button>
                          </Space>
                        </FormItem>
                      </Col>
                    </Row>
                  </Form>
                </FilterPanel>

                <ListHeaderActions
                  className="dict-page__actions"
                  utility={(
                    <>
                      <Button icon={<IconDownload />} onClick={() => { void handleExportTypes(); }} disabled={!canExport}>
                        {t('common.export')}
                      </Button>
                      <Button onClick={() => { void handleDownloadTypeTemplate(); }} disabled={!canImport}>
                        {t('common.downloadTemplate')}
                      </Button>
                      <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImportTypes(file); }}>
                        {t('common.import')}
                      </ImportCsvButton>
                    </>
                  )}
                  primary={<Button type="primary" icon={<IconPlus />} onClick={openCreateType} disabled={!canCreate}>{t('common.add')}</Button>}
                />
                <TableBatchActionBar
                  selectedCount={selectedTypeRowKeys.length}
                  selectedText={t('common.selectedCount', { count: selectedTypeRowKeys.length })}
                  clearText={t('common.clearSelection')}
                  clearSuccessText={t('common.clearSelectionSuccess')}
                  onClear={() => setSelectedTypeRowKeys([])}
                  hint={!canEdit ? t('common.batchActionPermissionHint') : undefined}
                  actions={(
                    <>
                      <PermissionAction allowed={canEdit} tooltip={t('common.noPermissionAction')}>
                        <Popconfirm title={t('system.dict.type.batchEnableConfirm')} onOk={() => { void handleBatchTypeStatus(1); }} disabled={typeBatchActionDisabled}>
                          <Button disabled={typeBatchActionDisabled}>{t('system.dict.batchEnable')}</Button>
                        </Popconfirm>
                      </PermissionAction>
                      <PermissionAction allowed={canEdit} tooltip={t('common.noPermissionAction')}>
                        <Popconfirm title={t('system.dict.type.batchDisableConfirm')} onOk={() => { void handleBatchTypeStatus(2); }} disabled={typeBatchActionDisabled}>
                          <Button status={typeBatchActionDisabled ? undefined : 'warning'} disabled={typeBatchActionDisabled}>{t('system.dict.batchDisable')}</Button>
                        </Popconfirm>
                      </PermissionAction>
                    </>
                  )}
                />

                {typeLoading && typeRows.length === 0 ? <PageLoading /> : null}
                {typeError && typeRows.length === 0 ? renderRequestErrorState(typeError, () => { void loadTypes(typeQuery); }) : null}
                {!typeLoading && !typeError && typeRows.length === 0 ? <PageEmpty description={t('system.dict.typeEmpty')} /> : null}
                {!typeLoading && !(typeError && typeRows.length === 0) && typeRows.length > 0 ? (
                  <AppTable<DictTypeRow>
                    rowKey="id"
                    columns={typeColumns}
                    data={typeRows}
                    loading={typeLoading}
                    rowSelection={{
                      selectedRowKeys: selectedTypeRowKeys,
                      onChange: (keys) => setSelectedTypeRowKeys(keys),
                    }}
                    emptyText={t('system.dict.typeEmpty')}
                    scroll={{ x: 980 }}
                  />
                ) : null}
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane key="items" title={t('system.dict.item')}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {selectedType ? (
                  <Card className="dict-workbench__context-card">
                    <div className="dict-workbench__context-head">
                      <div className="dict-workbench__context-copy">
                        <div className="dict-workbench__context-title">{selectedTypeTitle}</div>
                        <div className="dict-workbench__context-subtitle">{selectedType.dictCode}</div>
                      </div>
                      <Space wrap>
                        <Tag color="arcoblue">{selectedType.module || 'system'}</Tag>
                        <Tag color={selectedType.status === 1 ? 'green' : 'red'}>
                          {selectedType.status === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
                        </Tag>
                      </Space>
                    </div>
                    <div className="dict-workbench__context-metrics">
                      <span>{t('system.dict.item')}: {selectedType.itemCount || 0}</span>
                      <span>{t('system.user.status.enabled')}: {selectedType.activeItemCount || 0}</span>
                      <span>{t('system.user.status.disabled')}: {selectedType.disabledItemCount || 0}</span>
                      <span>{t('common.search')}: {itemTotal}</span>
                      <span>{t('i18n.updatedAt')}: {selectedType.lastItemUpdatedAt || '-'}</span>
                    </div>
                  </Card>
                ) : null}

                <FilterPanel>
                  <Form form={itemQueryForm} layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} lg={8}>
                        <FormItem label={t('system.dict.type')}>
                          <Select
                            allowClear={false}
                            placeholder={t('system.dict.type')}
                            value={selectedType?.id}
                            options={selectedTypeOptions}
                            onChange={handleSelectedTypeChange}
                          />
                        </FormItem>
                      </Col>
                      <Col xs={24} lg={6}>
                        <FormItem label={t('system.dict.dictCode')}>
                          <Input value={selectedType?.dictCode || ''} readOnly />
                        </FormItem>
                      </Col>
                      <Col xs={24} lg={6}>
                        <FormItem label={t('system.dict.status')} field="status">
                          <Select
                            allowClear
                            options={[
                              { label: t('system.user.status.enabled'), value: 1 },
                              { label: t('system.user.status.disabled'), value: 2 },
                            ]}
                          />
                        </FormItem>
                      </Col>
                      <Col xs={24} lg={4}>
                        <FormItem label={t('common.search')} field="keyword">
                          <Input placeholder={t('system.dict.itemLabelKey')} />
                        </FormItem>
                      </Col>
                      <Col xs={24} lg={6}>
                        <FormItem className="filter-panel__action-item">
                          <Space>
                            <Button type="primary" icon={<IconSearch />} onClick={handleItemSearch}>{t('common.search')}</Button>
                            <Button onClick={handleItemReset}>{t('common.reset')}</Button>
                          </Space>
                        </FormItem>
                      </Col>
                    </Row>
                  </Form>
                </FilterPanel>

                <ListHeaderActions
                  className="dict-page__actions"
                  utility={(
                    <>
                      <Button icon={<IconRefresh />} onClick={() => { void handleRefreshCache(); }} disabled={!canRefresh || !selectedType}>
                        {t('system.dict.refreshCache')}
                      </Button>
                      <Button onClick={() => { void handleOpenUsageAnalysis(); }} disabled={!selectedType}>
                        {t('system.dict.usage.action')}
                      </Button>
                      <Button icon={<IconDownload />} onClick={() => { void handleExportItems(); }} disabled={!canExport || !selectedType}>
                        {t('common.export')}
                      </Button>
                      <Button onClick={() => { void handleDownloadItemTemplate(); }} disabled={!canImport}>
                        {t('common.downloadTemplate')}
                      </Button>
                      <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImportItems(file); }}>
                        {t('common.import')}
                      </ImportCsvButton>
                    </>
                  )}
                  primary={<Button type="primary" icon={<IconPlus />} onClick={openCreateItem} disabled={!canCreate || !selectedType}>{t('system.dict.itemAdd')}</Button>}
                />
                <TableBatchActionBar
                  selectedCount={selectedItemRowKeys.length}
                  selectedText={t('common.selectedCount', { count: selectedItemRowKeys.length })}
                  clearText={t('common.clearSelection')}
                  clearSuccessText={t('common.clearSelectionSuccess')}
                  onClear={() => setSelectedItemRowKeys([])}
                  hint={!canEdit ? t('common.batchActionPermissionHint') : undefined}
                  actions={(
                    <>
                      <PermissionAction allowed={canEdit} tooltip={t('common.noPermissionAction')}>
                        <Popconfirm title={t('system.dict.item.batchEnableConfirm')} onOk={() => { void handleBatchItemStatus(1); }} disabled={itemBatchActionDisabled}>
                          <Button disabled={itemBatchActionDisabled}>{t('system.dict.batchEnable')}</Button>
                        </Popconfirm>
                      </PermissionAction>
                      <PermissionAction allowed={canEdit} tooltip={t('common.noPermissionAction')}>
                        <Popconfirm title={t('system.dict.item.batchDisableConfirm')} onOk={() => { void handleBatchItemStatus(2); }} disabled={itemBatchActionDisabled}>
                          <Button status={itemBatchActionDisabled ? undefined : 'warning'} disabled={itemBatchActionDisabled}>{t('system.dict.batchDisable')}</Button>
                        </Popconfirm>
                      </PermissionAction>
                    </>
                  )}
                />

                {!selectedType ? (
                  <PageEmpty description={t('system.dict.item.empty')} />
                ) : (
                  <>
                    {itemLoading && itemRows.length === 0 ? <PageLoading /> : null}
                    {itemError && itemRows.length === 0 ? renderRequestErrorState(itemError, () => { void loadItems(itemQuery, selectedType.dictCode); }) : null}
                    {!itemLoading && !itemError && itemTotal === 0 ? <PageEmpty description={t('system.dict.itemEmpty')} /> : null}
                    {!itemLoading && !(itemError && itemRows.length === 0) && itemTotal > 0 ? (
                      <AppTable<DictItemRow>
                        rowKey="id"
                        columns={itemColumns}
                        data={itemRows}
                        loading={itemLoading}
                        rowSelection={{
                          selectedRowKeys: selectedItemRowKeys,
                          onChange: (keys) => setSelectedItemRowKeys(keys),
                        }}
                        emptyText={t('system.dict.itemEmpty')}
                        onChange={handleItemTableChange}
                        pagination={{
                          total: itemTotal,
                          current: itemQuery.page,
                          pageSize: itemQuery.pageSize,
                          showTotal: (count: number) => t('common.total', { count }),
                          pageSizeChangeResetCurrent: false,
                          onChange: (page, pageSize) => setItemQuery((prev) => ({ ...prev, page, pageSize })),
                        }}
                        scroll={{ x: 1160 }}
                      />
                    ) : null}
                  </>
                )}
              </Space>
            </Tabs.TabPane>
          </Tabs>
            </Card>
          </div>
          <div className="page-side-column">
            <Card className="page-panel side-rail-panel">
              <span className="side-rail-panel__title">{t('system.dict.hero.summaryTitle')}</span>
              <div className="side-rail-stack">
                <div className="side-rail-item">
                  <span className="side-rail-item__label">{t('system.dict.hero.disabledTypes')}</span>
                  <span className="side-rail-item__value">{typeSummary.disabled}</span>
                  <span className="side-rail-item__desc">{t('system.dict.hero.disabledHint')}</span>
                </div>
                <div className="side-rail-item">
                  <span className="side-rail-item__label">{t('system.dict.hero.refreshReady')}</span>
                  <span className="side-rail-item__value">{canRefresh ? t('common.yes') : t('common.no')}</span>
                  <span className="side-rail-item__desc">{t('system.dict.hero.refreshHint')}</span>
                </div>
                <div className="side-rail-item">
                  <span className="side-rail-item__label">{t('system.dict.hero.importReady')}</span>
                  <span className="side-rail-item__value">{canImport ? t('common.yes') : t('common.no')}</span>
                  <span className="side-rail-item__desc">{t('system.dict.hero.importHint')}</span>
                </div>
              </div>
            </Card>
            <Card className="page-panel side-rail-panel">
              <span className="side-rail-panel__title">{t('system.dict.hero.sideTitle')}</span>
              <div className="side-rail-note">
                <span className="side-rail-note__title">{t('system.dict.hero.sideLead')}</span>
                <span className="side-rail-note__desc">{t('system.dict.hero.sideDesc')}</span>
              </div>
            </Card>
          </div>
        </div>
      </Space>

      <AppModal
        title={t('system.dict.usage.title')}
        visible={usageVisible}
        size="detail"
        footer={<Button onClick={() => setUsageVisible(false)}>{t('common.close')}</Button>}
        onCancel={() => setUsageVisible(false)}
      >
        {usageLoading ? <PageLoading /> : null}
        {!usageLoading && usageAnalysis ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card className="page-panel">
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text>{`${t('system.dict.dictCode')}: ${usageAnalysis.dictCode}`}</Text>
                <Text>{`${t('system.dict.usage.referenceCount')}: ${usageAnalysis.referenceCount}`}</Text>
                <Text type="secondary">{`${t('system.dict.usage.root')}: ${usageAnalysis.scannedProjectRoot}`}</Text>
              </Space>
            </Card>
            {usageAnalysis.references.length === 0 ? (
              <PageEmpty description={t('system.dict.usage.empty')} />
            ) : (
              <Card className="page-panel">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {usageAnalysis.references.map((item) => (
                    <div key={`${item.filePath}:${item.line}:${item.column}`} className="dict-usage__item">
                      <div className="dict-usage__head">
                        <Text copyable>{`${item.filePath}:${item.line}:${item.column}`}</Text>
                        <Space wrap size={8}>
                          <Tag>{item.domain}</Tag>
                          {item.moduleHint ? <Tag color="arcoblue">{item.moduleHint}</Tag> : null}
                        </Space>
                      </div>
                      <Text code>{item.snippet || '-'}</Text>
                    </div>
                  ))}
                </Space>
              </Card>
            )}
          </Space>
        ) : null}
      </AppModal>

      <AppModal
        title={editingType ? t('system.dict.typeEdit') : t('system.dict.typeCreate')}
        visible={typeVisible}
        size="md"
        onCancel={() => setTypeVisible(false)}
        footer={(
          <SubmitBar
            onCancel={() => setTypeVisible(false)}
            onSubmit={() => { void submitTypeForm(); }}
            loading={typeSubmitting}
            submitText={editingType ? t('common.save') : t('common.add')}
          />
        )}
        unmountOnExit
      >
        <Form form={typeForm} layout="vertical">
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <FormItem label={t('system.dict.dictCode')} field="dictCode" rules={[{ required: true, message: t('system.dict.dictCodeRequired') }]}>
                <Input />
              </FormItem>
              <FormItem label={t('system.dict.dictName')} field="dictName" rules={[{ required: true, message: t('system.dict.dictNameRequired') }]}>
                <Input />
              </FormItem>
              <FormItem label={t('system.dict.module')} field="module">
                <Input />
              </FormItem>
              <FormItem label={t('system.dict.status')} field="status">
                <Select options={[
                  { label: t('system.user.status.enabled'), value: 1 },
                  { label: t('system.user.status.disabled'), value: 2 },
                ]} />
              </FormItem>
              <FormItem label={t('system.dict.remark')} field="remark">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
              </FormItem>
            </FormSection>
          </Space>
        </Form>
      </AppModal>

      <AppModal
        title={editingItem ? t('system.dict.itemEdit') : t('system.dict.itemCreate')}
        visible={itemVisible}
        size="md"
        onCancel={() => setItemVisible(false)}
        footer={(
          <SubmitBar
            onCancel={() => setItemVisible(false)}
            onSubmit={() => { void submitItemForm(); }}
            loading={itemSubmitting}
            submitText={editingItem ? t('common.save') : t('common.add')}
          />
        )}
        unmountOnExit
      >
        <Form form={itemForm} layout="vertical">
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('system.dict.item')}>
              <FormItem label={t('system.dict.dictCode')} field="dictCode" rules={[{ required: true, message: t('system.dict.dictCodeRequired') }]}>
                <Input disabled />
              </FormItem>
              <FormItem label={t('system.dict.itemLabelKey')} field="itemLabelKey" rules={[{ required: true, message: t('system.dict.itemLabelKeyRequired') }]}>
                <Input />
              </FormItem>
              <FormItem label={t('system.dict.itemValue')} field="itemValue" rules={[{ required: true, message: t('system.dict.itemValueRequired') }]}>
                <Input />
              </FormItem>
              <FormItem label={t('system.dict.itemColor')} field="itemColor">
                <Input placeholder={t('system.dict.itemColorPlaceholder')} />
              </FormItem>
              <FormItem label={t('system.dict.sort')} field="sort">
                <InputNumber min={0} />
              </FormItem>
              <FormItem label={t('system.dict.status')} field="status">
                <Select options={[
                  { label: t('system.user.status.enabled'), value: 1 },
                  { label: t('system.user.status.disabled'), value: 2 },
                ]} />
              </FormItem>
              <FormItem label={t('system.dict.remark')} field="remark">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
              </FormItem>
            </FormSection>
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default DictPage;
