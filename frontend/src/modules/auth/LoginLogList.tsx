import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Tag,
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDownload, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../core/format/dateTime';
import {
  exportAdminLoginLogs,
  getAdminLoginLogList,
  type LoginLogPageResp,
  type LoginLogQuery,
  type LoginLogRow,
} from './api';
import { renderClientInfo } from './clientInfo';
import {
  AppTable,
  FilterPanel,
  PageActions,
  PageContainer,
  PageEmpty,
  PageError,
  PageHeader,
  PageLoading,
} from '../../components';
import { usePermission } from '../../hooks/usePermission';
import './auth.css';
import '../system/list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: LoginLogQuery = {
  username: '',
  status: undefined,
  page: 1,
  pageSize: 10,
};

const LoginLogList: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasPerm } = usePermission();
  const canExport = isAdmin || hasPerm('system:login-log:export');
  const [data, setData] = useState<LoginLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState<LoginLogQuery>(emptyQuery);
  const [queryForm] = Form.useForm<LoginLogQuery>();

  const loadData = useCallback(async (nextQuery: LoginLogQuery = query) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const result: LoginLogPageResp = await getAdminLoginLogList(nextQuery);
      setData(result.items);
      setTotal(result.total);
    } catch {
      setLoadFailed(true);
      Message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(query);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, query]);

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

  const handleTableChange: TableProps<LoginLogRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const translateLogMessage = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return t(value, { defaultValue: value });
  };

  const successCount = data.filter((item) => item.status === 1).length;
  const failedCount = data.filter((item) => item.status !== 1).length;
  const statItems = [
    {
      label: t('auth.security.loginLogs'),
      value: String(total),
      hint: t('auth.loginLog.subtitle'),
    },
    {
      label: t('auth.loginLog.status.success'),
      value: String(successCount),
      hint: t('auth.security.recentWindow'),
    },
    {
      label: t('auth.loginLog.status.failed'),
      value: String(failedCount),
      hint: t('auth.security.loginLogHint'),
    },
  ];

  const columns: ColumnProps<LoginLogRow>[] = [
    { title: t('system.user.username'), dataIndex: 'username', width: 160 },
    { title: t('auth.loginLog.ip'), dataIndex: 'ipaddr', width: 140 },
    {
      title: t('auth.loginLog.browser'),
      dataIndex: 'browser',
      width: 220,
      render: (_: unknown, record: LoginLogRow) => renderClientInfo(record),
    },
    {
      title: t('auth.loginLog.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: number) => value === 1 ? <Tag color="green">{t('auth.loginLog.status.success')}</Tag> : <Tag color="red">{t('auth.loginLog.status.failed')}</Tag>,
    },
    {
      title: t('auth.loginLog.failureReason'),
      dataIndex: 'msg',
      ellipsis: true,
      render: (value: string) => translateLogMessage(value),
    },
    {
      title: t('auth.loginLog.loginTime'),
      dataIndex: 'loginTime',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const handleExport = async () => {
    await exportAdminLoginLogs(query);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.loginLog')}
        subtitle={t('auth.loginLog.subtitle')}
        extra={(
          <PageActions>
            <Button icon={<IconDownload />} onClick={() => { void handleExport(); }} disabled={!canExport}>
              {t('common.export')}
            </Button>
          </PageActions>
        )}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div className="auth-page-stat-grid">
          {statItems.map((item) => (
            <Card key={item.label} className="page-stat-panel auth-page-stat-card">
              <span className="auth-page-stat-card__label">{item.label}</span>
              <span className="auth-page-stat-card__value">{item.value}</span>
              <span className="auth-page-stat-card__hint">{item.hint}</span>
            </Card>
          ))}
        </div>

        <FilterPanel>
          <Form form={queryForm} layout="vertical">
            <Row gutter={16} className="auth-filter-grid">
              <Col xs={24} md={12} lg={8}>
                <FormItem label={t('system.user.username')} field="username">
                  <Input />
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <FormItem label={t('auth.loginLog.status')} field="status">
                  <Select
                    allowClear
                    options={[
                      { label: t('auth.loginLog.status.success'), value: 1 },
                      { label: t('auth.loginLog.status.failed'), value: 0 },
                    ]}
                  />
                </FormItem>
              </Col>
              <Col xs={24} md={24} lg={10}>
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
          <div className="auth-inline-note" style={{ marginBottom: 16 }}>
            <div className="auth-inline-note__copy">
              <span className="auth-inline-note__title">{t('auth.security.loginLogHint')}</span>
              <span className="auth-inline-note__desc">{t('auth.security.recentWindow')}</span>
            </div>
            <Space wrap>
              <Tag color="green">{t('auth.loginLog.status.success')}: {successCount}</Tag>
              <Tag color="red">{t('auth.loginLog.status.failed')}: {failedCount}</Tag>
            </Space>
          </div>
          {loading && data.length === 0 ? <PageLoading /> : null}
          {loadFailed && !loading ? (
            <PageError onRetry={() => { void loadData(query); }} />
          ) : data.length === 0 && !loading ? (
            <PageEmpty description={t('auth.loginLog.empty')} />
          ) : (
            <AppTable<LoginLogRow>
              className="system-list__table"
              rowKey="id"
              data={data}
              columns={columns}
              loading={loading}
              scroll={{ x: 1120 }}
              onChange={handleTableChange}
              emptyText={t('auth.loginLog.empty')}
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
          )}
        </Card>
      </Space>
    </PageContainer>
  );
};

export default LoginLogList;
