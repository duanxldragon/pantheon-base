import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconRefresh, IconSearch } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { usePermission } from '../../../hooks/usePermission';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import {
  createDictItem,
  createDictType,
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
  refreshDictCache,
  updateDictItem,
  updateDictType,
  type DictItemPayload,
  type DictItemRow,
  type DictTypePayload,
  type DictTypeQuery,
  type DictTypeRow,
} from './api';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

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
  const [typeLoading, setTypeLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [typeError, setTypeError] = useState<unknown>(null);
  const [itemError, setItemError] = useState<unknown>(null);
  const [typeQuery, setTypeQuery] = useState<DictTypeQuery>(emptyTypeQuery);
  const [selectedType, setSelectedType] = useState<DictTypeRow | null>(null);
  const [typeVisible, setTypeVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeRow | null>(null);
  const [editingItem, setEditingItem] = useState<DictItemRow | null>(null);
  const [typeForm] = Form.useForm<DictTypePayload>();
  const [itemForm] = Form.useForm<DictItemPayload>();
  const [queryForm] = Form.useForm<DictTypeQuery>();

  const loadTypes = useCallback(async (nextQuery: DictTypeQuery = typeQuery) => {
    setTypeLoading(true);
    setTypeError(null);
    try {
      const rows = await getDictTypeList(nextQuery);
      setTypeRows(rows);
      if (rows.length === 0) {
        setSelectedType(null);
        setItemRows([]);
        setItemError(null);
        return;
      }
      setSelectedType((prev) => rows.find((item) => item.id === prev?.id) || rows[0]);
    } catch (requestError) {
      setTypeError(requestError);
    } finally {
      setTypeLoading(false);
    }
  }, [typeQuery]);

  const loadItems = useCallback(async (dictCode?: string) => {
    const currentCode = dictCode || selectedType?.dictCode;
    if (!currentCode) {
      setItemRows([]);
      setItemError(null);
      return;
    }
    setItemLoading(true);
    setItemError(null);
    try {
      const rows = await getDictItemList({ dictCode: currentCode });
      setItemRows(rows);
    } catch (requestError) {
      setItemError(requestError);
    } finally {
      setItemLoading(false);
    }
  }, [selectedType?.dictCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTypes(typeQuery); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTypes, typeQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadItems(selectedType?.dictCode); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadItems, selectedType?.dictCode]);

  const selectedTypeTitle = useMemo(
    () => (selectedType ? t(selectedType.dictName, selectedType.dictCode) : t('system.dict.item.empty')),
    [selectedType, t],
  );

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
    const values = await typeForm.validate();
    setTypeSubmitting(true);
    try {
      if (editingType) {
        await updateDictType(editingType.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createDictType(values);
        Message.success(t('common.createSuccess'));
      }
      setTypeVisible(false);
      await loadTypes(typeQuery);
    } finally {
      setTypeSubmitting(false);
    }
  };

  const submitItemForm = async () => {
    const values = await itemForm.validate();
    setItemSubmitting(true);
    try {
      if (editingItem) {
        await updateDictItem(editingItem.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createDictItem(values);
        Message.success(t('common.createSuccess'));
      }
      setItemVisible(false);
      await loadItems(values.dictCode);
    } finally {
      setItemSubmitting(false);
    }
  };

  const removeType = async (row: DictTypeRow) => {
    await deleteDictType(row.id);
    Message.success(t('common.deleteSuccess'));
    await loadTypes(typeQuery);
  };

  const removeItem = async (row: DictItemRow) => {
    await deleteDictItem(row.id);
    Message.success(t('common.deleteSuccess'));
    await loadItems(row.dictCode);
  };

  const handleRefreshCache = async () => {
    const codes = selectedType ? [selectedType.dictCode] : [];
    await refreshDictCache({ codes });
    Message.success(t('system.dict.refreshSuccess'));
    await loadItems(selectedType?.dictCode);
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
      await loadTypes(typeQuery);
    }
  };

  const handleExportItems = async () => {
    if (!selectedType) {
      return;
    }
    await exportDictItems({ dictCode: selectedType.dictCode });
  };

  const handleDownloadItemTemplate = async () => {
    await downloadDictItemImportTemplate();
  };

  const handleImportItems = async (file: File) => {
    const result = await importDictItems(file);
    showImportResult(result, t);
    if (result.applied) {
      await loadItems(selectedType?.dictCode);
    }
  };

  const typeColumns: ColumnProps<DictTypeRow>[] = [
    {
      title: t('system.dict.dictCode'),
      dataIndex: 'dictCode',
      width: 150,
      render: (value: string, row: DictTypeRow) => (
        <Button type="text" style={{ padding: 0 }} onClick={() => setSelectedType(row)}>
          {value}
        </Button>
      ),
    },
    {
      title: t('system.dict.dictName'),
      dataIndex: 'dictName',
      width: 100,
      render: (value: string) => t(value, value),
    },
    { title: t('system.dict.module'), dataIndex: 'module', width: 96 },
    {
      title: t('system.dict.status'),
      dataIndex: 'status',
      width: 80,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      width: 140,
      render: (_: unknown, row: DictTypeRow) => (
        <Space>
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
      render: (value: string) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{t(value, value)}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{value}</Typography.Text>
        </Space>
      ),
    },
    { title: t('system.dict.itemValue'), dataIndex: 'itemValue' },
    {
      title: t('system.dict.itemColor'),
      dataIndex: 'itemColor',
      render: (value: string) => value ? <Tag color={value}>{value}</Tag> : '-',
    },
    { title: t('system.dict.sort'), dataIndex: 'sort' },
    {
      title: t('system.dict.status'),
      dataIndex: 'status',
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      width: 140,
      render: (_: unknown, row: DictItemRow) => (
        <Space>
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

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.dict')}
        subtitle={t('system.dict.subtitle')}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
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

        <Row gutter={16}>
          <Col span={10}>
            <Card
              className="page-panel page-panel--split"
              title={t('system.dict.type')}
              extra={(
                <PageActions>
                  <Button icon={<IconDownload />} onClick={() => { void handleExportTypes(); }} disabled={!canExport}>
                    {t('common.export')}
                  </Button>
                  <Button onClick={() => { void handleDownloadTypeTemplate(); }} disabled={!canImport}>
                    {t('common.downloadTemplate')}
                  </Button>
                  <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImportTypes(file); }}>
                    {t('common.import')}
                  </ImportCsvButton>
                  <Button type="primary" icon={<IconPlus />} onClick={openCreateType} disabled={!canCreate}>
                    {t('common.add')}
                  </Button>
                </PageActions>
              )}
            >
              {typeLoading && typeRows.length === 0 ? <PageLoading /> : null}
              {typeError && typeRows.length === 0 ? renderRequestErrorState(typeError, () => { void loadTypes(typeQuery); }) : null}
              {!typeLoading && !typeError && typeRows.length === 0 ? <PageEmpty description={t('system.dict.typeEmpty')} /> : null}
              {!typeLoading && !(typeError && typeRows.length === 0) && typeRows.length > 0 ? (
                <AppTable<DictTypeRow>
                  rowKey="id"
                  columns={typeColumns}
                  data={typeRows}
                  loading={typeLoading}
                  emptyText={t('system.dict.typeEmpty')}
                />
              ) : null}
            </Card>
          </Col>
          <Col span={14}>
            <Card
              className="page-panel page-panel--split"
              title={selectedTypeTitle}
              extra={(
                <PageActions>
                  <Button icon={<IconRefresh />} onClick={() => { void handleRefreshCache(); }} disabled={!canRefresh || !selectedType}>
                    {t('system.dict.refreshCache')}
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
                  <Button type="primary" icon={<IconPlus />} onClick={openCreateItem} disabled={!canCreate || !selectedType}>
                    {t('system.dict.itemAdd')}
                  </Button>
                </PageActions>
              )}
            >
              {!selectedType ? (
                <PageEmpty description={t('system.dict.item.empty')} />
              ) : (
                <>
                  {itemLoading && itemRows.length === 0 ? <PageLoading /> : null}
                  {itemError && itemRows.length === 0 ? renderRequestErrorState(itemError, () => { void loadItems(selectedType.dictCode); }) : null}
                  {!itemLoading && !itemError && itemRows.length === 0 ? <PageEmpty description={t('system.dict.itemEmpty')} /> : null}
                  {!itemLoading && !(itemError && itemRows.length === 0) && itemRows.length > 0 ? (
                    <AppTable<DictItemRow>
                      rowKey="id"
                      columns={itemColumns}
                      data={itemRows}
                      loading={itemLoading}
                      emptyText={t('system.dict.itemEmpty')}
                    />
                  ) : null}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Space>

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
