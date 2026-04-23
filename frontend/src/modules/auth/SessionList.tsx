import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  Form,
  Grid,
  Input,
  Message,
  Popconfirm,
  Space,
  Tag,
} from '@arco-design/web-react';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/interface';
import type { ColumnProps, TableProps } from '@arco-design/web-react/es/Table/interface';
import { IconDelete, IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../core/format/dateTime';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermission } from '../../hooks/usePermission';
import {
  getAdminSessionList,
  revokeAdminSession,
  type AdminSessionPageResp,
  type AdminSessionQuery,
  type AdminSessionRow,
} from './api';
import {
  AppTable,
  FilterPanel,
  PageContainer,
  PageEmpty,
  PageError,
  PageHeader,
  PageLoading,
} from '../../components';
import { formatClientSummary } from './clientInfo';
import SessionDetailModal from './SessionDetailModal';
import './auth.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const emptyQuery: AdminSessionQuery = {
  username: '',
  page: 1,
  pageSize: 10,
};

const SessionList: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo } = useAuthStore();
  const { isAdmin, hasPerm } = usePermission();
  const canDelete = isAdmin || hasPerm('system:session:delete');
  const [data, setData] = useState<AdminSessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState<AdminSessionQuery>(emptyQuery);
  const [detailSession, setDetailSession] = useState<AdminSessionRow | null>(null);
  const [queryForm] = Form.useForm<AdminSessionQuery>();

  const loadData = useCallback(async (nextQuery: AdminSessionQuery = query) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const result: AdminSessionPageResp = await getAdminSessionList(nextQuery);
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

  const handleTableChange: TableProps<AdminSessionRow>['onChange'] = (pagination) => {
    setQuery({
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || query.pageSize || emptyQuery.pageSize,
    });
  };

  const removeSession = async (row: AdminSessionRow) => {
    await revokeAdminSession(row.sessionId);
    Message.success(t('auth.session.revokeSuccess'));
    await loadData(query);
  };

  const currentUsername = userInfo?.username;
  const activeCount = data.filter((item) => !item.revokedAt).length;
  const revokedCount = data.filter((item) => Boolean(item.revokedAt)).length;
  const statItems = [
    {
      label: t('auth.security.sessions'),
      value: String(total),
      hint: t('auth.session.subtitle'),
    },
    {
      label: t('auth.session.status.active'),
      value: String(activeCount),
      hint: t('auth.security.sessionHint'),
    },
    {
      label: t('auth.session.status.revoked'),
      value: String(revokedCount),
      hint: t('auth.session.selfProtected'),
    },
  ];

  const columns: ColumnProps<AdminSessionRow>[] = [
    {
      title: t('system.user.username'),
      dataIndex: 'username',
      width: 168,
      render: (value: string) => (
        <Space direction="vertical" size={4}>
          <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          {value === currentUsername ? <Tag color="arcoblue">{t('auth.session.currentUser')}</Tag> : null}
        </Space>
      ),
    },
    {
      title: t('system.profile.nickname'),
      dataIndex: 'nickname',
      width: 160,
      render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value || '-'}</span>,
    },
    {
      title: t('auth.session.ip'),
      dataIndex: 'lastIp',
      width: 128,
      render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value || '-'}</span>,
    },
    {
      title: t('auth.session.userAgent'),
      dataIndex: 'device',
      width: 260,
      render: (_: unknown, row: AdminSessionRow) => (
        <Space direction="vertical" size={2}>
          <span className="auth-device-summary">{formatClientSummary(row)}</span>
          {row.userAgent ? (
            <span className="auth-device-summary__meta">{row.userAgent}</span>
          ) : null}
        </Space>
      ),
    },
    { title: t('auth.session.lastActive'), dataIndex: 'lastRefreshAt', width: 150, render: (value?: string) => formatDateTime(value) },
    { title: t('auth.session.refreshExpiresAt'), dataIndex: 'refreshExpiresAt', width: 160, render: (value: string) => formatDateTime(value) },
    {
      title: t('auth.session.status'),
      dataIndex: 'revokedAt',
      width: 110,
      render: (value?: string) => value ? <Tag color="red">{t('auth.session.status.revoked')}</Tag> : <Tag color="green">{t('auth.session.status.active')}</Tag>,
    },
    {
      title: t('common.action'),
      dataIndex: 'action',
      width: 168,
      render: (_: unknown, row: AdminSessionRow) => {
        const isSelf = row.username === currentUsername;
        return (
          <Space size={4}>
            <Button size="small" onClick={() => setDetailSession(row)}>
              {t('common.detail')}
            </Button>
            <Popconfirm
              title={t('auth.session.revokeConfirm')}
              onOk={() => removeSession(row)}
              disabled={!canDelete || isSelf || !!row.revokedAt}
            >
              <Button
                size="small"
                status="danger"
                icon={<IconDelete />}
                disabled={!canDelete || isSelf || !!row.revokedAt}
              >
                {t('auth.session.revoke')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('system.menu.session')}
        subtitle={t('auth.session.subtitle')}
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
              <Col xs={24} md={12} lg={16}>
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

        <Card className="page-panel">
          <div className="auth-inline-note" style={{ marginBottom: 16 }}>
            <div className="auth-inline-note__copy">
              <span className="auth-inline-note__title">{t('auth.session.selfProtected')}</span>
              <span className="auth-inline-note__desc">{currentUsername ? `${t('auth.session.currentUser')}: ${currentUsername}` : t('auth.security.sessionHint')}</span>
            </div>
            {currentUsername ? <Tag color="arcoblue">{currentUsername}</Tag> : null}
          </div>
          {loading && data.length === 0 ? <PageLoading /> : null}
          {loadFailed && !loading ? (
            <PageError onRetry={() => { void loadData(query); }} />
          ) : data.length === 0 && !loading ? (
            <PageEmpty description={t('auth.session.empty')} />
          ) : (
            <AppTable<AdminSessionRow>
              rowKey="sessionId"
              data={data}
              columns={columns}
              loading={loading}
              onChange={handleTableChange}
              emptyText={t('auth.session.empty')}
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
      <SessionDetailModal
        visible={Boolean(detailSession)}
        session={detailSession}
        onCancel={() => setDetailSession(null)}
      />
    </PageContainer>
  );
};

export default SessionList;
