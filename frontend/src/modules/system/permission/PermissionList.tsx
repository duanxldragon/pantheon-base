import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Grid,
  Input,
  Message,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconDownload, IconEdit, IconPlus, IconRefresh, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { showImportResult } from '../../../api/importExport';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../../api/request';
import { usePermission } from '../../../hooks/usePermission';
import { getRoleList } from '../role/api';
import {
  createPermissionPolicy,
  deletePermissionPolicy,
  downloadPermissionImportTemplate,
  exportPermissionPolicies,
  getPermissionPolicyList,
  getPermissionWorkbench,
  importPermissionPolicies,
  updatePermissionPolicy,
  type PermissionPolicyPayload,
  type PermissionPolicyQuery,
  type PermissionPolicyRow,
  type PermissionWorkbenchQuery,
  type PermissionWorkbenchRole,
  type PermissionWorkbenchResp,
} from './api';
import { AppModal, AppTable, FilterPanel, FormSection, ImportCsvButton, PageActions, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError, SubmitBar } from '../../../components';
import '../list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const emptyQuery: PermissionPolicyQuery = {
  roleKey: '',
  path: '',
  method: '',
  page: 1,
  pageSize: 10,
};

const emptyWorkbenchQuery: PermissionWorkbenchQuery = {
  roleKey: '',
  status: undefined,
};

const emptyForm: PermissionPolicyPayload = {
  roleKey: '',
  path: '',
  method: 'GET',
};

type PermissionTabKey = 'workbench' | 'api';

const PermissionList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canCreate = isAdmin || hasPerm('system:permission:create');
  const canEdit = isAdmin || hasPerm('system:permission:update');
  const canDelete = isAdmin || hasPerm('system:permission:delete');
  const canExport = isAdmin || hasPerm('system:permission:export');
  const canImport = isAdmin || hasPerm('system:permission:import');
  const [activeTab, setActiveTab] = useState<PermissionTabKey>('workbench');
  const [data, setData] = useState<PermissionPolicyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [policyError, setPolicyError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<PermissionPolicyRow | null>(null);
  const [query, setQuery] = useState<PermissionPolicyQuery>(emptyQuery);
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [workbenchLoading, setWorkbenchLoading] = useState(false);
  const [workbenchError, setWorkbenchError] = useState<unknown>(null);
  const [workbench, setWorkbench] = useState<PermissionWorkbenchResp | null>(null);
  const [workbenchQuery, setWorkbenchQuery] = useState<PermissionWorkbenchQuery>(emptyWorkbenchQuery);
  const [detailRole, setDetailRole] = useState<PermissionWorkbenchRole | null>(null);
  const [form] = Form.useForm<PermissionPolicyPayload>();
  const [queryForm] = Form.useForm<PermissionPolicyQuery>();
  const [workbenchForm] = Form.useForm<PermissionWorkbenchQuery>();

  const loadData = useCallback(async (nextQuery: PermissionPolicyQuery = query) => {
    setLoading(true);
    setPolicyError(null);
    try {
      const result = await getPermissionPolicyList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setPolicyError(requestError);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadWorkbench = useCallback(async (nextQuery: PermissionWorkbenchQuery = workbenchQuery) => {
    setWorkbenchLoading(true);
    setWorkbenchError(null);
    try {
      const result = await getPermissionWorkbench(nextQuery);
      setWorkbench(result);
      setDetailRole((current) => current ? result.roles.find((item) => item.roleKey === current.roleKey) || null : current);
    } catch (requestError) {
      setWorkbenchError(requestError);
    } finally {
      setWorkbenchLoading(false);
    }
  }, [workbenchQuery]);

  const loadRoles = useCallback(async () => {
    try {
      const result = await getRoleList({ page: 1, pageSize: 100, sortField: 'sort', sortOrder: 'asc' });
      setRoleOptions(result.items.map((item) => ({
        label: item.roleName,
        value: item.roleKey,
      })));
    } catch {
      Message.error(t('common.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(query), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkbench(workbenchQuery), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkbench, workbenchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoles]);

  const handleExport = async () => {
    await exportPermissionPolicies(query);
  };

  const handleDownloadTemplate = async () => {
    await downloadPermissionImportTemplate();
  };

  const handleImport = async (file: File) => {
    const result = await importPermissionPolicies(file);
    showImportResult(result, t);
    if (result.applied) {
      await loadData(query);
      await loadWorkbench(workbenchQuery);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(emptyForm);
    setVisible(true);
  };

  const openEdit = (row: PermissionPolicyRow) => {
    setEditing(row);
    form.setFieldsValue({
      roleKey: row.roleKey,
      path: row.path,
      method: row.method,
    });
    setVisible(true);
  };

  const submitForm = async () => {
    const values = await form.validate();
    setSubmitting(true);
    try {
      if (editing) {
        await updatePermissionPolicy(editing.id, values);
        Message.success(t('common.updateSuccess'));
      } else {
        await createPermissionPolicy(values);
        Message.success(t('common.createSuccess'));
      }
      setVisible(false);
      await Promise.all([loadData(query), loadWorkbench(workbenchQuery)]);
    } finally {
      setSubmitting(false);
    }
  };

  const removePolicy = async (row: PermissionPolicyRow) => {
    await deletePermissionPolicy(row.id);
    Message.success(t('common.deleteSuccess'));
    const nextPage = data.length === 1 && (query.page || 1) > 1 ? (query.page || 1) - 1 : (query.page || 1);
    const nextQuery = { ...query, page: nextPage };
    setQuery(nextQuery);
    await loadWorkbench(workbenchQuery);
  };

  const search = () => {
    const values = queryForm.getFieldsValue();
    setQuery({
      ...query,
      ...values,
      page: 1,
    });
  };

  const reset = () => {
    queryForm.setFieldsValue(emptyQuery);
    setQuery(emptyQuery);
  };

  const searchWorkbench = () => {
    const values = workbenchForm.getFieldsValue();
    setWorkbenchQuery({
      ...workbenchQuery,
      ...values,
    });
  };

  const resetWorkbench = () => {
    workbenchForm.setFieldsValue(emptyWorkbenchQuery);
    setWorkbenchQuery(emptyWorkbenchQuery);
  };

  const handleTableChange: TableProps<PermissionPolicyRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const translateTitleKey = (key?: string, fallback?: string) => {
    if (!key) {
      return fallback || '-';
    }
    return t(key, { defaultValue: fallback || key });
  };

  const overviewCards = useMemo(() => {
    const overview = workbench?.overview;
    return [
      {
        title: t('system.permission.workbench.roleCount'),
        value: overview?.roleCount ?? 0,
      },
      {
        title: t('system.permission.workbench.navigationAssignments'),
        value: overview?.navigationAssignmentCount ?? 0,
      },
      {
        title: t('system.permission.workbench.permissionAssignments'),
        value: (overview?.pagePermissionAssignmentCount ?? 0) + (overview?.actionPermissionAssignmentCount ?? 0),
      },
      {
        title: t('system.permission.workbench.apiAssignments'),
        value: overview?.apiActionCount ?? 0,
      },
    ];
  }, [t, workbench]);

  const renderRequestErrorState = (requestError: unknown, onRetry: () => void) => {
    if (isNetworkRequestError(requestError)) {
      return <PageNetworkError timeout={isTimeoutRequestError(requestError)} onRetry={onRetry} />;
    }
    if (isServerRequestError(requestError)) {
      return <PageServerError onRetry={onRetry} />;
    }
    return <PageError onRetry={onRetry} />;
  };

  const columns: ColumnProps<PermissionPolicyRow>[] = [
    { title: t('system.permission.roleKey'), dataIndex: 'roleKey', width: 180 },
    {
      title: t('system.permission.method'),
      dataIndex: 'method',
      width: 120,
      render: (value: string) => <Tag color="arcoblue">{value}</Tag>,
    },
    { title: t('system.permission.path'), dataIndex: 'path' },
    {
      title: t('common.action'),
      width: 180,
      fixed: 'right',
      render: (_: unknown, row: PermissionPolicyRow) => (
        <Space size={4} className="system-list__actions">
          {canEdit ? (
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(row)}>
              {t('common.edit')}
            </Button>
          ) : null}
          {canDelete ? (
            <Popconfirm title={t('common.deleteConfirm')} onOk={() => removePolicy(row)} disabled={row.roleKey === 'admin'}>
              <Button type="text" size="small" status="danger" icon={<IconDelete />} disabled={row.roleKey === 'admin'}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const workbenchColumns: ColumnProps<PermissionWorkbenchRole>[] = [
    { title: t('system.role.roleName'), dataIndex: 'roleName', width: 180 },
    { title: t('system.role.roleKey'), dataIndex: 'roleKey', width: 180 },
    {
      title: t('system.role.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'}>
          {value === 1 ? t('system.user.status.enabled') : t('system.user.status.disabled')}
        </Tag>
      ),
    },
    { title: t('system.permission.workbench.navCount'), dataIndex: 'menuCount', width: 120 },
    { title: t('system.permission.workbench.pageCount'), dataIndex: 'pagePermissionCount', width: 120 },
    { title: t('system.permission.workbench.actionCount'), dataIndex: 'actionPermissionCount', width: 120 },
    { title: t('system.permission.workbench.apiCount'), dataIndex: 'apiPolicyCount', width: 120 },
    {
      title: t('system.permission.workbench.unknownCount'),
      dataIndex: 'unknownPermissionCount',
      width: 140,
      render: (value: number) => value > 0 ? <Tag color="orange">{value}</Tag> : <Tag color="green">0</Tag>,
    },
    {
      title: t('common.action'),
      width: 120,
      fixed: 'right',
      render: (_: unknown, row: PermissionWorkbenchRole) => (
        <Button type="text" size="small" onClick={() => setDetailRole(row)}>
          {t('common.detail')}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.permission')}
        subtitle={activeTab === 'workbench' ? t('system.permission.workbench.hint') : t('system.permission.hint')}
        extra={(
          <PageActions>
            <Button icon={<IconRefresh />} onClick={() => {
              if (activeTab === 'workbench') {
                void loadWorkbench(workbenchQuery);
                return;
              }
              void loadData(query);
            }}
            >
              {t('common.refresh')}
            </Button>
            {activeTab === 'api' ? (
              <>
                <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>{t('common.export')}</Button>
                <Button onClick={() => { void handleDownloadTemplate(); }} disabled={!canImport}>{t('common.downloadTemplate')}</Button>
                <ImportCsvButton disabled={!canImport} onSelect={(file) => { void handleImport(file); }}>
                  {t('common.import')}
                </ImportCsvButton>
                <Button type="primary" icon={<IconPlus />} onClick={openCreate} disabled={!canCreate}>{t('common.add')}</Button>
              </>
            ) : null}
          </PageActions>
        )}
      />

      <Tabs activeTab={activeTab} onChange={(value) => setActiveTab(value as PermissionTabKey)}>
        <Tabs.TabPane key="workbench" title={t('system.permission.workbench.tab')} />
        <Tabs.TabPane key="api" title={t('system.permission.policy.tab')} />
      </Tabs>

      {activeTab === 'workbench' ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {workbench ? (
            <Row gutter={[16, 16]}>
              {overviewCards.map((item) => (
                <Col span={6} key={item.title}>
                  <Card className="page-stat-panel">
                    <Typography.Text type="secondary">{item.title}</Typography.Text>
                    <Typography.Title heading={4} style={{ margin: '8px 0 0' }}>
                      {item.value}
                    </Typography.Title>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : null}

          <FilterPanel>
            <Form form={workbenchForm} layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <FormItem label={t('system.permission.roleKey')} field="roleKey">
                    <Select allowClear options={roleOptions} />
                  </FormItem>
                </Col>
                <Col span={6}>
                  <FormItem label={t('system.role.status')} field="status">
                    <Select
                      allowClear
                      options={[
                        { label: t('system.user.status.enabled'), value: 1 },
                        { label: t('system.user.status.disabled'), value: 2 },
                      ]}
                    />
                  </FormItem>
                </Col>
                <Col span={10}>
                  <FormItem className="filter-panel__action-item">
                    <Space>
                      <Button type="primary" icon={<IconSearch />} onClick={searchWorkbench}>{t('common.search')}</Button>
                      <Button onClick={resetWorkbench}>{t('common.reset')}</Button>
                    </Space>
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </FilterPanel>

          <Card className="page-panel system-list__table-card">
            {workbenchLoading && !workbench ? <PageLoading /> : null}
            {workbenchError && !workbench ? renderRequestErrorState(workbenchError, () => { void loadWorkbench(workbenchQuery); }) : null}
            {!workbenchLoading && !workbenchError && (!workbench || workbench.roles.length === 0) ? <PageEmpty description={t('common.noData')} /> : null}
            {!workbenchLoading && !(workbenchError && !workbench) && workbench && workbench.roles.length > 0 ? (
              <AppTable<PermissionWorkbenchRole>
                className="system-list__table"
                rowKey="id"
                data={workbench.roles}
                columns={workbenchColumns}
                loading={workbenchLoading}
                scroll={{ x: 1100 }}
                pagination={false}
                emptyText={t('common.noData')}
              />
            ) : null}
          </Card>
        </Space>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <FilterPanel>
            <Form form={queryForm} layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <FormItem label={t('system.permission.roleKey')} field="roleKey">
                    <Select allowClear options={roleOptions} />
                  </FormItem>
                </Col>
                <Col span={8}>
                  <FormItem label={t('system.permission.path')} field="path">
                    <Input />
                  </FormItem>
                </Col>
                <Col span={4}>
                  <FormItem label={t('system.permission.method')} field="method">
                    <Select allowClear options={methodOptions.map((item) => ({ label: item, value: item }))} />
                  </FormItem>
                </Col>
                <Col span={4}>
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
            {policyError && data.length === 0 ? renderRequestErrorState(policyError, () => { void loadData(query); }) : null}
            {!loading && !policyError && data.length === 0 ? <PageEmpty description={t('common.noData')} /> : null}
            {!loading && !(policyError && data.length === 0) && data.length > 0 ? (
              <AppTable<PermissionPolicyRow>
                className="system-list__table"
                data={data}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 980 }}
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
      )}

      <AppModal
        title={detailRole ? `${detailRole.roleName} · ${detailRole.roleKey}` : t('system.permission.workbench.detailTitle')}
        visible={Boolean(detailRole)}
        size="detail"
        onCancel={() => setDetailRole(null)}
        footer={null}
      >
        {detailRole ? (
          <Space direction="vertical" size={16} className="detail-stack">
            <Descriptions
              column={4}
              data={[
                { label: t('system.permission.workbench.navCount'), value: detailRole.menuCount },
                { label: t('system.permission.workbench.pageCount'), value: detailRole.pagePermissionCount },
                { label: t('system.permission.workbench.actionCount'), value: detailRole.actionPermissionCount },
                { label: t('system.permission.workbench.apiCount'), value: detailRole.apiPolicyCount },
              ]}
            />

            <Card className="detail-panel-card" title={t('system.permission.workbench.navSection')}>
              <Space wrap>
                {detailRole.menus.length > 0 ? detailRole.menus.map((item) => (
                  <Tag key={`${item.id}-${item.path}`}>{translateTitleKey(item.titleKey, item.path)}</Tag>
                )) : <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>}
              </Space>
            </Card>

            <Card className="detail-panel-card" title={t('system.permission.workbench.pageSection')}>
              <Space wrap>
                {detailRole.pagePermissions.length > 0 ? detailRole.pagePermissions.map((item) => (
                  <Tag key={item.key} color="arcoblue">{translateTitleKey(item.titleKey, item.key)}</Tag>
                )) : <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>}
              </Space>
            </Card>

            <Card className="detail-panel-card" title={t('system.permission.workbench.actionSection')}>
              <Space wrap>
                {detailRole.actionPermissions.length > 0 ? detailRole.actionPermissions.map((item) => (
                  <Tag key={item.key} color="green">{translateTitleKey(item.titleKey, item.key)}</Tag>
                )) : <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>}
              </Space>
            </Card>

            <Card className="detail-panel-card" title={t('system.permission.workbench.apiSection')}>
              <AppTable
                rowKey="id"
                data={detailRole.apiPolicies}
                columns={[
                  {
                    title: t('system.permission.method'),
                    dataIndex: 'method',
                    render: (value: string) => <Tag color="arcoblue">{value}</Tag>,
                  },
                  {
                    title: t('system.permission.path'),
                    dataIndex: 'path',
                  },
                ]}
                pagination={false}
                emptyText={t('common.noData')}
              />
            </Card>

            {detailRole.unknownPermissions.length > 0 ? (
              <Card className="detail-panel-card" title={t('system.permission.workbench.unknownSection')}>
                <Space wrap>
                  {detailRole.unknownPermissions.map((item) => (
                    <Tag key={item.key} color="orange">{item.key}</Tag>
                  ))}
                </Space>
              </Card>
            ) : null}
          </Space>
        ) : null}
      </AppModal>

      <AppModal
        title={editing ? t('system.permission.edit') : t('system.permission.create')}
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
              <FormItem label={t('system.permission.roleKey')} field="roleKey" rules={[{ required: true, message: t('system.permission.roleRequired') }]}>
                <Select options={roleOptions} />
              </FormItem>
              <FormItem label={t('system.permission.path')} field="path" rules={[{ required: true, message: t('system.permission.pathRequired') }]}>
                <Input placeholder="/api/v1/system/user/list" />
              </FormItem>
              <FormItem label={t('system.permission.method')} field="method" rules={[{ required: true, message: t('system.permission.methodRequired') }]}>
                <Select options={methodOptions.map((item) => ({ label: item, value: item }))} />
              </FormItem>
            </FormSection>
          </Space>
        </Form>
      </AppModal>
    </PageContainer>
  );
};

export default PermissionList;
