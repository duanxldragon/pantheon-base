import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import { IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../core/format/dateTime';
import {
  AppTable,
  FilterPanel,
  GovernanceSummaryBar,
  PageContainer,
  PageEmpty,
  PageError,
  PageLoading,
} from '../../components';
import {
  getAdminSecurityEventList,
  type SecurityEventPageResp,
  type SecurityEventQuery,
  type SecurityEventRow,
} from './api';
import './auth.css';
import '../system/list-page.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: SecurityEventQuery = {
  username: '',
  eventType: '',
  severity: '',
  page: 1,
  pageSize: 10,
};

const SecurityEventList: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<SecurityEventQuery>();
  const [query, setQuery] = useState<SecurityEventQuery>(emptyQuery);
  const [data, setData] = useState<SecurityEventPageResp>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (nextQuery: SecurityEventQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminSecurityEventList(nextQuery);
      setData(result);
      setQuery(nextQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request.failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(emptyQuery), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const columns: ColumnProps<SecurityEventRow>[] = [
    {
      title: t('auth.securityEvent.createdAt'),
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value as string),
    },
    {
      title: t('common.username'),
      dataIndex: 'username',
      width: 140,
      render: (value) => (value ? String(value) : '-'),
    },
    {
      title: t('auth.securityEvent.eventType'),
      dataIndex: 'eventType',
      width: 180,
      render: (value) =>
        t(`auth.securityEvent.type.${value}`, { defaultValue: String(value || '-') }),
    },
    {
      title: t('auth.securityEvent.severity'),
      dataIndex: 'severity',
      width: 120,
      render: (value) => {
        const severity = String(value || 'medium');
        const color = severity === 'high' ? 'red' : severity === 'low' ? 'green' : 'orange';
        return (
          <Tag color={color}>
            {t(`auth.securityEvent.severity.${severity}`, { defaultValue: severity })}
          </Tag>
        );
      },
    },
    {
      title: t('auth.securityEvent.sourceKey'),
      dataIndex: 'sourceKey',
      width: 180,
      render: (value) => (value ? String(value) : '-'),
    },
    {
      title: t('auth.securityEvent.messageKey'),
      dataIndex: 'messageKey',
      render: (value) => t(String(value || ''), { defaultValue: String(value || '-') }),
    },
  ];

  const pagination: PaginationProps = {
    current: data.page,
    pageSize: data.pageSize,
    total: data.total,
    showTotal: true,
    showJumper: true,
    sizeCanChange: true,
    onChange: (page, pageSize) => {
      void fetchData({ ...query, page, pageSize });
    },
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    void fetchData({ ...emptyQuery, ...values, page: 1 });
  };

  const handleReset = () => {
    form.resetFields();
    void fetchData(emptyQuery);
  };

  const heroStats = [
    {
      key: 'total',
      label: t('common.total'),
      value: data.total,
    },
    {
      key: 'high',
      label: t('auth.securityEvent.severity.high'),
      value: data.items.filter((item) => item.severity === 'high').length,
    },
    {
      key: 'sourceBlocked',
      label: t('auth.securityEvent.type.source_blocked'),
      value: data.items.filter((item) => item.eventType === 'source_blocked').length,
    },
    {
      key: 'accountLocked',
      label: t('auth.securityEvent.type.account_locked'),
      value: data.items.filter((item) => item.eventType === 'account_locked').length,
    },
  ];

  return (
    <PageContainer>
      <Space direction="vertical" size={16} className="system-page-template auth-security-event-page">
        <GovernanceSummaryBar
          eyebrow={t('auth.securityEvent.hero.eyebrow')}
          title={t('system.menu.securityEvent')}
          description={t('auth.securityEvent.hint')}
          metrics={heroStats}
        />
        <FilterPanel>
          <Form form={form} layout="vertical" initialValues={emptyQuery}>
            <Row gutter={16} className="auth-filter-grid">
              <Col xs={24} md={12} lg={8}>
                <FormItem field="username" label={t('common.user')}>
                  <Input
                    allowClear
                    placeholder={t('auth.securityEvent.filter.usernamePlaceholder')}
                  />
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={8}>
                <FormItem field="eventType" label={t('auth.securityEvent.eventType')}>
                  <Select
                    allowClear
                    placeholder={t('auth.securityEvent.filter.eventTypePlaceholder')}
                  >
                    <Select.Option value="source_blocked">
                      {t('auth.securityEvent.type.source_blocked')}
                    </Select.Option>
                    <Select.Option value="account_locked">
                      {t('auth.securityEvent.type.account_locked')}
                    </Select.Option>
                  </Select>
                </FormItem>
              </Col>
              <Col xs={24} md={12} lg={8}>
                <FormItem field="severity" label={t('auth.securityEvent.severity')}>
                  <Select allowClear placeholder={t('auth.securityEvent.filter.severityPlaceholder')}>
                    <Select.Option value="high">
                      {t('auth.securityEvent.severity.high')}
                    </Select.Option>
                    <Select.Option value="medium">
                      {t('auth.securityEvent.severity.medium')}
                    </Select.Option>
                    <Select.Option value="low">
                      {t('auth.securityEvent.severity.low')}
                    </Select.Option>
                  </Select>
                </FormItem>
              </Col>
              <Col xs={24}>
                <FormItem className="filter-panel__action-item">
                  <Space>
                    <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                      {t('common.search')}
                    </Button>
                    <Button onClick={handleReset}>{t('common.reset')}</Button>
                  </Space>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </FilterPanel>
        <Card className="page-panel system-list__table-card auth-security-event-page__table-card">
          <Typography.Text type="secondary">{t('auth.securityEvent.hint')}</Typography.Text>
          {loading && data.items.length === 0 ? <PageLoading /> : null}
          {error ? <PageError description={error} onRetry={() => void fetchData(query)} /> : null}
          {!error && data.items.length === 0 && !loading ? (
            <PageEmpty description={t('auth.securityEvent.empty')} />
          ) : null}
          {!error && data.items.length > 0 ? (
            <AppTable
              className="system-list__table"
              rowKey="id"
              columns={columns}
              data={data.items}
              loading={loading}
              pagination={pagination}
              scroll={{ x: 980 }}
            />
          ) : null}
        </Card>
        </Space>
    </PageContainer>
  );
};

export default SecurityEventList;
