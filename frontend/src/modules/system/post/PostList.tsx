import React, { useCallback, useEffect, useState } from 'react';
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
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, SorterInfo, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { formatDateTime } from '../../../core/format/dateTime';
import { usePermission } from '../../../hooks/usePermission';
import { getDeptTree, type DeptNode } from '../dept/api';
import { batchUpdatePostStatus, createPost, deletePost, downloadPostImportTemplate, exportPosts, getPostList, importPosts, updatePost, type PostListQuery, type PostPayload, type PostRow } from './api';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: PostListQuery = {
  postCode: '',
  postName: '',
  deptId: undefined,
  status: undefined,
  page: 1,
  pageSize: 10,
};

const emptyForm: PostPayload = {
  deptId: 0,
  postCode: '',
  postName: '',
  sort: 0,
  status: 1,
  remark: '',
};

const PostList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:post:create');
  const canEdit = isAdmin || hasPerm('system:post:update');
  const canDelete = isAdmin || hasPerm('system:post:delete');
  const canExport = isAdmin || hasPerm('system:post:export');
  const canImport = isAdmin || hasPerm('system:post:import');
  const canBatchUpdate = isAdmin || hasPerm('system:post:batch-update');
  const [data, setData] = useState<PostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [deptOptions, setDeptOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [query, setQuery] = useState<PostListQuery>(emptyQuery);
  const [form] = Form.useForm<PostPayload>();
  const [queryForm] = Form.useForm<PostListQuery>();

  const loadData = useCallback(async (nextQuery: PostListQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPostList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadDeptOptions = useCallback(async () => {
    try {
      const deptRows = await getDeptTree({ sortField: 'sort', sortOrder: 'asc' });
      const flattenDept = (nodes: DeptNode[], depth = 0): Array<{ label: string; value: number }> =>
        nodes.flatMap((item) => [
          { label: `${'— '.repeat(depth)}${item.deptName}`, value: item.id },
          ...(item.children?.length ? flattenDept(item.children, depth + 1) : []),
        ]);
      const selectableDeptRows = deptRows.flatMap((item) => (item.isRoot ? (item.children || []) : [item]));
      setDeptOptions(flattenDept(selectableDeptRows));
    } catch {
      Message.error(t('common.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(query), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDeptOptions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDeptOptions]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(emptyForm);
    setVisible(true);
  };

  const openEdit = (row: PostRow) => {
    setEditing(row);
    form.setFieldsValue({
      deptId: row.deptId,
      postCode: row.postCode,
      postName: row.postName,
      sort: row.sort,
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
        await updatePost(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createPost(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await loadData(query);
    } finally {
      setSubmitting(false);
    }
  };

  const removePost = async (id: number) => {
    await deletePost(id);
    Message.success(t('common.deleteSuccess'));
    setSelectedRowKeys((keys) => keys.filter((key) => Number(key) !== id));
    const nextPage = data.length === 1 && (query.page || 1) > 1 ? (query.page || 1) - 1 : (query.page || 1);
    setQuery({ ...query, page: nextPage });
  };

  const search = () => {
    const values = queryForm.getFieldsValue();
    setSelectedRowKeys([]);
    setQuery({
      ...query,
      ...values,
      page: 1,
    });
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setSelectedRowKeys([]);
    setQuery(emptyQuery);
  };

  const toArcoSortOrder = (sortOrder?: PostListQuery['sortOrder']) => {
    if (sortOrder === 'asc') {
      return 'ascend';
    }
    if (sortOrder === 'desc') {
      return 'descend';
    }
    return undefined;
  };

  const sortableColumn = (field: NonNullable<PostListQuery['sortField']>): Partial<ColumnProps<PostRow>> => ({
    sorter: true,
    sortOrder: query.sortField === field ? toArcoSortOrder(query.sortOrder) : undefined,
  });

  const handleTableChange: TableProps<PostRow>['onChange'] = (pagination, sorter) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter as SorterInfo | undefined;
    setSelectedRowKeys([]);
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
      sortField: currentSorter?.direction ? String(currentSorter.field) : undefined,
      sortOrder: currentSorter?.direction === 'ascend' ? 'asc' : currentSorter?.direction === 'descend' ? 'desc' : undefined,
    });
  };

  const columns: ColumnProps<PostRow>[] = [
    { title: t('system.post.dept'), dataIndex: 'deptName', width: 160 },
    { title: t('system.post.postCode'), dataIndex: 'postCode', width: 180, ...sortableColumn('postCode') },
    { title: t('system.post.postName'), dataIndex: 'postName', width: 180, ...sortableColumn('postName') },
    { title: t('system.post.sort'), dataIndex: 'sort', width: 120, ...sortableColumn('sort') },
    {
      title: t('system.post.status'),
      dataIndex: 'status',
      width: 120,
      ...sortableColumn('status'),
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    { title: t('system.post.remark'), dataIndex: 'remark' },
    {
      title: t('system.post.createdAt'),
      dataIndex: 'createdAt',
      width: 180,
      ...sortableColumn('createdAt'),
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.action'),
      width: 180,
      fixed: 'right',
      render: (_: unknown, row: PostRow) => (
        <Space size={4} className="system-list__actions">
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => removePost(row.id)}>
              <Button type="text" size="small" status="danger" icon={<IconDelete />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

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
    await exportPosts(query);
  };

  const handleDownloadTemplate = async () => {
    await downloadPostImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importPosts(file);
    showImportResult(result, t);
    if (result.applied) {
      await loadData(query);
    }
  };

  const handleBatchStatus = async (status: 1 | 2) => {
    const postIds = selectedRowKeys.map((item) => Number(item)).filter((item) => item > 0);
    const result = await batchUpdatePostStatus({ postIds, status });
    Message.success(t('system.post.batchStatusSuccess', { count: result.updatedCount }));
    setSelectedRowKeys([]);
    await loadData(query);
  };

  const batchActionDisabled = !canBatchUpdate || selectedRowKeys.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.post')}
        subtitle={t('system.post.subtitle')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
            <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
            <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
              {t('common.import')}
            </ImportCsvButton>
            <Popconfirm title={t('system.post.batchEnableConfirm')} onOk={() => { void handleBatchStatus(1); }} disabled={batchActionDisabled}>
              <Button disabled={batchActionDisabled}>{t('system.post.batchEnable')}</Button>
            </Popconfirm>
            <Popconfirm title={t('system.post.batchDisableConfirm')} onOk={() => { void handleBatchStatus(2); }} disabled={batchActionDisabled}>
              <Button status={batchActionDisabled ? undefined : 'warning'} disabled={batchActionDisabled}>{t('system.post.batchDisable')}</Button>
            </Popconfirm>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate} disabled={!canCreate}>{t('common.add')}</Button>
          </PageActions>
        )}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <FilterPanel>
          <Form form={queryForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12} lg={6}>
                <FormItem label={t('system.post.postCode')} field="postCode">
                  <Input />
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <FormItem label={t('system.post.postName')} field="postName">
                  <Input />
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <FormItem label={t('system.post.dept')} field="deptId">
                  <Select allowClear options={deptOptions} />
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <FormItem label={t('system.post.status')} field="status">
                  <Select allowClear options={[
                    { label: t('system.user.status.enabled'), value: 1 },
                    { label: t('system.user.status.disabled'), value: 2 },
                  ]} />
                </FormItem>
              </Col>
              <Col xs={24} md={24} lg={6}>
                <FormItem className="filter-panel__action-item">
                  <Space>
                    <Button type="primary" icon={<IconSearch />} onClick={search}>{t('common.search')}</Button>
                    <Button onClick={reset}>{t('common.reset')}</Button>
                  </Space>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </FilterPanel>
        <Card className="page-panel system-list__table-card">
          {loading && data.length === 0 ? <PageLoading /> : null}
          {error && data.length === 0 ? renderErrorState() : null}
          {!loading && !error && data.length === 0 ? <PageEmpty description={t('common.noData')} /> : null}
          {!loading && !(error && data.length === 0) && data.length > 0 ? (
            <AppTable<PostRow>
              className="system-list__table"
              data={data}
              columns={columns}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1240 }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                fixed: true,
                onChange: (rowKeys) => setSelectedRowKeys(rowKeys),
              }}
              onChange={handleTableChange}
              emptyText={t('common.noData')}
              pagination={{
                current: query.page || emptyQuery.page,
                pageSize: query.pageSize || emptyQuery.pageSize,
                total,
                showJumper: true,
                pageSizeChangeResetCurrent: false,
                sizeCanChange: true,
                sizeOptions: [10, 20, 50, 100],
                size: 'small',
                showTotal: (count: number) => t('common.total', { count }),
              } as PaginationProps}
            />
          ) : null}
        </Card>
      </Space>

      <AppModal
        title={editing ? t('system.post.edit') : t('system.post.create')}
        visible={visible}
        size="md"
        onCancel={() => setVisible(false)}
        footer={(
          <SubmitBar
            onCancel={() => setVisible(false)}
            onSubmit={() => { void submitForm(); }}
            loading={submitting}
            submitText={editing ? t('common.save') : t('common.add')}
          />
        )}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Space direction="vertical" size={20} className="dialog-form-stack">
            <FormSection title={t('common.basicInfo')}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.dept')} field="deptId" rules={[{ required: true, message: t('system.post.deptRequired') }]}>
                    <Select options={deptOptions} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.postCode')} field="postCode" rules={[{ required: true, message: t('system.post.postCodeRequired') }]}>
                    <Input disabled={Boolean(editing)} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.postName')} field="postName" rules={[{ required: true, message: t('system.post.postNameRequired') }]}>
                    <Input />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.sort')} field="sort">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </FormItem>
                </Col>
                <Col xs={24} md={12}>
                  <FormItem label={t('system.post.status')} field="status">
                    <Select options={[
                      { label: t('system.user.status.enabled'), value: 1 },
                      { label: t('system.user.status.disabled'), value: 2 },
                    ]} />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem label={t('system.post.remark')} field="remark">
                    <Input.TextArea maxLength={200} autoSize={{ minRows: 3, maxRows: 5 }} />
                  </FormItem>
                </Col>
              </Row>
            </FormSection>
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default PostList;
