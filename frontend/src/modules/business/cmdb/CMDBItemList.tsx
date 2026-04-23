import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Grid, Input, InputNumber, Message, Popconfirm, Select, Space, Tag } from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconDownload, IconEdit, IconEye, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import { getDeptTree, type DeptNode } from '../../system/dept/api';
import {
  createCMDBItem,
  deleteCMDBItem,
  downloadCMDBItemImportTemplate,
  exportCMDBItems,
  getCMDBItemList,
  getCMDBTypeList,
  importCMDBItems,
  updateCMDBItem,
  type CMDBItemPayload,
  type CMDBItemQuery,
  type CMDBItemRow,
  type CMDBTypeRow,
} from './api';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const environmentOptions = ['dev', 'test', 'staging', 'prod'];
const statusOptions = ['active', 'inactive', 'maintenance'];

const emptyQuery: CMDBItemQuery = {
  typeId: undefined,
  itemCode: '',
  itemName: '',
  environment: '',
  status: '',
  page: 1,
  pageSize: 10,
};

const emptyForm: CMDBItemPayload = {
  typeId: 0,
  itemCode: '',
  itemName: '',
  environment: 'dev',
  status: 'active',
  ownerUserId: 0,
  ownerDeptId: 0,
  endpoint: '',
  description: '',
};

const CMDBItemList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, hasPerm } = usePermission();
  const canView = isAdmin || hasPerm('business:cmdb:item:view');
  const canCreate = isAdmin || hasPerm('business:cmdb:item:create');
  const canEdit = isAdmin || hasPerm('business:cmdb:item:update');
  const canDelete = isAdmin || hasPerm('business:cmdb:item:delete');
  const canExport = isAdmin || hasPerm('business:cmdb:item:export');
  const canImport = isAdmin || hasPerm('business:cmdb:item:import');
  const [data, setData] = useState<CMDBItemRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<CMDBItemQuery>(emptyQuery);
  const [types, setTypes] = useState<CMDBTypeRow[]>([]);
  const [deptOptions, setDeptOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<CMDBItemRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [queryForm] = Form.useForm<CMDBItemQuery>();
  const [form] = Form.useForm<CMDBItemPayload>();

  const typeOptions = useMemo(() => types.map((item) => ({ label: `${item.typeName} · ${item.typeCode}`, value: item.id })), [types]);
  const typeNameMap = useMemo(() => new Map(types.map((item) => [item.id, item.typeName])), [types]);

  const loadData = useCallback(async (nextQuery: CMDBItemQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCMDBItemList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadOptions = useCallback(async () => {
    try {
      const [typePage, deptTree] = await Promise.all([
        getCMDBTypeList({ page: 1, pageSize: 100, status: 1 }),
        getDeptTree({ sortField: 'sort', sortOrder: 'asc' }),
      ]);
      setTypes(typePage.items);
      const flattenDept = (nodes: DeptNode[], depth = 0): Array<{ label: string; value: number }> =>
        nodes.flatMap((item) => [
          { label: `${'— '.repeat(depth)}${item.deptName}`, value: item.id },
          ...(item.children?.length ? flattenDept(item.children, depth + 1) : []),
        ]);
      const selectableDeptRows = deptTree.flatMap((item) => (item.isRoot ? (item.children || []) : [item]));
      setDeptOptions([{ label: t('system.dept.none'), value: 0 }, ...flattenDept(selectableDeptRows)]);
    } catch {
      Message.error(t('common.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(query); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOptions(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOptions]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ ...emptyForm, typeId: types[0]?.id || 0 });
    setVisible(true);
  };

  const openEdit = (row: CMDBItemRow) => {
    setEditing(row);
    form.setFieldsValue({
      typeId: row.typeId,
      itemCode: row.itemCode,
      itemName: row.itemName,
      environment: row.environment,
      status: row.status,
      ownerUserId: row.ownerUserId,
      ownerDeptId: row.ownerDeptId,
      endpoint: row.endpoint,
      description: row.description,
    });
    setVisible(true);
  };

  const openDetail = (row: CMDBItemRow) => {
    navigate(`/business/cmdb/items/${row.id}`);
  };

  const submitForm = async () => {
    const values = await form.validate();
    setSubmitting(true);
    try {
      if (editing) {
        await updateCMDBItem(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createCMDBItem(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (row: CMDBItemRow) => {
    await deleteCMDBItem(row.id);
    Message.success(t('common.deleteSuccess'));
    await loadData(query);
  };

  const handleSearch = () => {
    const values = queryForm.getFieldsValue();
    setQuery({ ...query, ...values, page: 1 });
  };

  const handleReset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setQuery(emptyQuery);
  };

  const handleTableChange: TableProps<CMDBItemRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize,
    });
  };

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return <PageNetworkError timeout={isTimeoutRequestError(error)} onRetry={() => { void loadData(query); }} />;
    }
    if (isServerRequestError(error)) {
      return <PageServerError onRetry={() => { void loadData(query); }} />;
    }
    return <PageError onRetry={() => { void loadData(query); }} />;
  };

  const handleExport = async () => {
    await exportCMDBItems(query);
  };

  const handleDownloadTemplate = async () => {
    await downloadCMDBItemImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importCMDBItems(file);
    showImportResult(result, t, {
      autoDownloadErrors: true,
      errorFileName: 'cmdb-item-import-errors.csv',
    });
    if (result.applied) {
      await loadData(query);
      await loadOptions();
    }
  };

  const columns: ColumnProps<CMDBItemRow>[] = [
    { title: t('cmdb.item.code'), dataIndex: 'itemCode', width: 180 },
    { title: t('cmdb.item.name'), dataIndex: 'itemName', width: 180 },
    { title: t('cmdb.item.type'), dataIndex: 'typeName', width: 180, render: (value: string, row: CMDBItemRow) => value || typeNameMap.get(row.typeId) || '-' },
    { title: t('cmdb.item.environment'), dataIndex: 'environment', width: 120, render: (value: string) => <Tag>{t(`cmdb.environment.${value}`, value)}</Tag> },
    { title: t('cmdb.item.status'), dataIndex: 'status', width: 140, render: (value: string) => <Tag color={value === 'active' ? 'green' : value === 'maintenance' ? 'orange' : 'gray'}>{t(`cmdb.status.${value}`, value)}</Tag> },
    { title: t('cmdb.item.endpoint'), dataIndex: 'endpoint', render: (value: string) => value || '-' },
    { title: t('system.user.createdAt'), dataIndex: 'createdAt', width: 170, render: (value: string) => formatDateTime(value) },
    {
      title: t('common.action'),
      width: 220,
      render: (_: unknown, row: CMDBItemRow) => (
        <Space>
          {canView ? (
            <Button size="mini" type="text" icon={<IconEye />} onClick={() => openDetail(row)}>
              {t('common.detail')}
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="mini" type="text" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => remove(row)}>
              <Button size="mini" type="text" status="danger" icon={<IconDelete />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('cmdb.item.title')}
        subtitle={t('cmdb.item.subtitle')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
            <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
            <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
              {t('common.import')}
            </ImportCsvButton>
            {canCreate ? <Button type="primary" icon={<IconPlus />} onClick={openCreate}>{t('cmdb.item.create')}</Button> : null}
          </PageActions>
        )}
      />
      <FilterPanel>
        <Form form={queryForm} layout="vertical" initialValues={emptyQuery}>
          <Row gutter={16}>
            <Col span={6}>
              <FormItem label={t('cmdb.item.type')} field="typeId">
                <Select allowClear options={typeOptions} />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.item.code')} field="itemCode">
                <Input allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.item.name')} field="itemName">
                <Input allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.item.environment')} field="environment">
                <Select allowClear options={environmentOptions.map((value) => ({ label: t(`cmdb.environment.${value}`), value }))} />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.item.status')} field="status">
                <Select allowClear options={statusOptions.map((value) => ({ label: t(`cmdb.status.${value}`), value }))} />
              </FormItem>
            </Col>
          </Row>
          <Space>
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>{t('common.search')}</Button>
            <Button onClick={handleReset}>{t('common.reset')}</Button>
          </Space>
        </Form>
      </FilterPanel>
      {loading && data.length === 0 ? <PageLoading /> : null}
      {error && data.length === 0 ? renderErrorState() : null}
      {!loading && !error && data.length === 0 ? <PageEmpty description={t('common.noData')} /> : null}
      {!loading && !(error && data.length === 0) && data.length > 0 ? (
        <AppTable
          rowKey="id"
          data={data}
          columns={columns}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showJumper: true,
            sizeCanChange: true,
            pageSizeChangeResetCurrent: false,
            showTotal: (count: number) => t('common.total', { count }),
          } as PaginationProps}
        />
      ) : null}
      <AppModal
        visible={visible}
        title={editing ? t('cmdb.item.edit') : t('cmdb.item.create')}
        footer={null}
        onCancel={() => setVisible(false)}
      >
        <Form form={form} layout="vertical">
          <FormSection title={t('common.basicInfo')}>
            <FormItem label={t('cmdb.item.type')} field="typeId" rules={[{ required: true, message: t('cmdb.item.typeRequired') }]}>
              <Select options={typeOptions} />
            </FormItem>
            <FormItem label={t('cmdb.item.code')} field="itemCode" rules={[{ required: true, message: t('cmdb.item.codeRequired') }]}>
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.item.name')} field="itemName" rules={[{ required: true, message: t('cmdb.item.nameRequired') }]}>
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.item.environment')} field="environment">
              <Select options={environmentOptions.map((value) => ({ label: t(`cmdb.environment.${value}`), value }))} />
            </FormItem>
            <FormItem label={t('cmdb.item.status')} field="status">
              <Select options={statusOptions.map((value) => ({ label: t(`cmdb.status.${value}`), value }))} />
            </FormItem>
            <FormItem label={t('system.user.dept')} field="ownerDeptId">
              <Select showSearch options={deptOptions} />
            </FormItem>
            <FormItem label={t('cmdb.item.ownerUserId')} field="ownerUserId">
              <InputNumber min={0} style={{ width: '100%' }} />
            </FormItem>
            <FormItem label={t('cmdb.item.endpoint')} field="endpoint">
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.item.description')} field="description">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </FormItem>
          </FormSection>
          <SubmitBar loading={submitting} onCancel={() => setVisible(false)} onSubmit={() => { void submitForm(); }} />
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default CMDBItemList;
