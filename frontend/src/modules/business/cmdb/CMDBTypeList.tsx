import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Grid, Input, Message, Popconfirm, Select, Space, Tag } from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import { createCMDBType, deleteCMDBType, downloadCMDBTypeImportTemplate, exportCMDBTypes, getCMDBTypeList, importCMDBTypes, updateCMDBType, type CMDBTypePayload, type CMDBTypeQuery, type CMDBTypeRow } from './api';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: CMDBTypeQuery = {
  typeCode: '',
  typeName: '',
  category: '',
  status: undefined,
  page: 1,
  pageSize: 10,
};

const emptyForm: CMDBTypePayload = {
  typeCode: '',
  typeName: '',
  category: '',
  status: 1,
  remark: '',
};

const CMDBTypeList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('business:cmdb:type:create');
  const canEdit = isAdmin || hasPerm('business:cmdb:type:update');
  const canDelete = isAdmin || hasPerm('business:cmdb:type:delete');
  const canExport = isAdmin || hasPerm('business:cmdb:type:export');
  const canImport = isAdmin || hasPerm('business:cmdb:type:import');
  const [data, setData] = useState<CMDBTypeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<CMDBTypeQuery>(emptyQuery);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<CMDBTypeRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [queryForm] = Form.useForm<CMDBTypeQuery>();
  const [form] = Form.useForm<CMDBTypePayload>();

  const loadData = useCallback(async (nextQuery: CMDBTypeQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCMDBTypeList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(query); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(emptyForm);
    setVisible(true);
  };

  const openEdit = (row: CMDBTypeRow) => {
    setEditing(row);
    form.setFieldsValue({
      typeCode: row.typeCode,
      typeName: row.typeName,
      category: row.category,
      status: row.status,
      remark: row.remark,
    });
    setVisible(true);
  };

  const submitForm = async () => {
    const values = await form.validate();
    setSubmitting(true);
    try {
      if (editing) {
        await updateCMDBType(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createCMDBType(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (row: CMDBTypeRow) => {
    await deleteCMDBType(row.id);
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

  const handleTableChange: TableProps<CMDBTypeRow>['onChange'] = (pagination) => {
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
    await exportCMDBTypes(query);
  };

  const handleDownloadTemplate = async () => {
    await downloadCMDBTypeImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importCMDBTypes(file);
    showImportResult(result, t, {
      autoDownloadErrors: true,
      errorFileName: 'cmdb-type-import-errors.csv',
    });
    if (result.applied) {
      await loadData(query);
    }
  };

  const columns: ColumnProps<CMDBTypeRow>[] = [
    { title: t('cmdb.type.code'), dataIndex: 'typeCode', width: 180 },
    { title: t('cmdb.type.name'), dataIndex: 'typeName', width: 180 },
    { title: t('cmdb.type.category'), dataIndex: 'category', width: 160, render: (value: string) => value || '-' },
    {
      title: t('cmdb.common.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: number) => value === 1 ? <Tag color="green">{t('common.yes')}</Tag> : <Tag color="red">{t('common.no')}</Tag>,
    },
    { title: t('system.post.remark'), dataIndex: 'remark', render: (value: string) => value || '-' },
    { title: t('system.user.createdAt'), dataIndex: 'createdAt', width: 170, render: (value: string) => formatDateTime(value) },
    {
      title: t('common.action'),
      width: 160,
      render: (_: unknown, row: CMDBTypeRow) => (
        <Space>
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
        title={t('cmdb.type.title')}
        subtitle={t('cmdb.type.subtitle')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
            <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
            <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
              {t('common.import')}
            </ImportCsvButton>
            {canCreate ? <Button type="primary" icon={<IconPlus />} onClick={openCreate}>{t('cmdb.type.create')}</Button> : null}
          </PageActions>
        )}
      />
      <FilterPanel>
        <Form form={queryForm} layout="vertical" initialValues={emptyQuery}>
          <Row gutter={16}>
            <Col span={6}>
              <FormItem label={t('cmdb.type.code')} field="typeCode">
                <Input allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.type.name')} field="typeName">
                <Input allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.type.category')} field="category">
                <Input allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label={t('cmdb.common.status')} field="status">
                <Select allowClear options={[{ label: t('common.yes'), value: 1 }, { label: t('common.no'), value: 2 }]} />
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
        title={editing ? t('cmdb.type.edit') : t('cmdb.type.create')}
        footer={null}
        onCancel={() => setVisible(false)}
      >
        <Form form={form} layout="vertical">
          <FormSection title={t('common.basicInfo')}>
            <FormItem label={t('cmdb.type.code')} field="typeCode" rules={[{ required: true, message: t('cmdb.type.codeRequired') }]}>
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.type.name')} field="typeName" rules={[{ required: true, message: t('cmdb.type.nameRequired') }]}>
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.type.category')} field="category">
              <Input />
            </FormItem>
            <FormItem label={t('cmdb.common.status')} field="status">
              <Select options={[{ label: t('common.yes'), value: 1 }, { label: t('common.no'), value: 2 }]} />
            </FormItem>
            <FormItem label={t('system.post.remark')} field="remark">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </FormItem>
          </FormSection>
          <SubmitBar loading={submitting} onCancel={() => setVisible(false)} onSubmit={() => { void submitForm(); }} />
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default CMDBTypeList;
