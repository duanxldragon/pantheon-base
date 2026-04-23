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
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconClockCircle, IconEye, IconLock, IconSafe } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../core/format/dateTime';
import {
  getOwnLoginLogs,
  getSecurityOverview,
  getSessions,
  revokeSession,
  updatePassword,
  type AuthSession,
  type LoginLogRow,
  type SecurityOverview,
  type UserPasswordUpdatePayload,
} from './api';
import { formatClientSummary, renderClientInfo } from './clientInfo';
import { useAuthStore } from '../../store/useAuthStore';
import {
  AppTable,
  DateTimeMeta,
  FormSection,
  PageContainer,
  PageEmpty,
  PageError,
  PageHeader,
  PageLoading,
  SubmitBar,
} from '../../components';
import SessionDetailModal from './SessionDetailModal';
import './auth.css';

const FormItem = Form.Item;
const Row = Grid.Row;
const Col = Grid.Col;

const SecurityCenter: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo, setUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogRow[]>([]);
  const [detailSession, setDetailSession] = useState<AuthSession | null>(null);
  const [passwordForm] = Form.useForm<UserPasswordUpdatePayload & { confirmPassword: string }>();

  const loadSecurityContext = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [overviewResp, sessionsResp, loginLogsResp] = await Promise.all([
        getSecurityOverview(),
        getSessions(),
        getOwnLoginLogs({ page: 1, pageSize: 10 }),
      ]);
      setOverview(overviewResp);
      setUserInfo(overviewResp.user);
      setSessions(sessionsResp);
      setLoginLogs(loginLogsResp.items);
    } catch {
      setLoadFailed(true);
      Message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [setUserInfo, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSecurityContext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSecurityContext]);

  const currentSession = useMemo(
    () => overview?.currentSession ?? sessions.find((item) => item.isCurrent) ?? null,
    [overview, sessions],
  );

  const translateLogMessage = useCallback(
    (value?: string | null) => {
      if (!value) {
        return '-';
      }
      return t(value, { defaultValue: value });
    },
    [t],
  );

  const renderActivityTime = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return <DateTimeMeta value={value} />;
  };

  const handleChangePassword = async () => {
    const values = await passwordForm.validate();
    setSavingPassword(true);
    try {
      await updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      Message.success(t('system.profile.passwordSuccess'));
      await loadSecurityContext();
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await revokeSession(sessionId);
      Message.success(t('auth.session.revokeSuccess'));
      await loadSecurityContext();
    } finally {
      setRevokingSessionId(null);
    }
  };

  const successCount = loginLogs.filter((item) => item.status === 1).length;
  const failedCount = loginLogs.filter((item) => item.status !== 1).length;
  const statItems = [
    {
      label: t('auth.security.activeSessionCount'),
      value: String(overview?.activeSessionCount ?? sessions.length),
      hint: t('auth.security.sessionHint'),
    },
    {
      label: t('auth.security.lastLoginAt'),
      value: <DateTimeMeta value={overview?.lastLoginAt} className="auth-page-stat-card__time" />,
      hint: t('auth.security.loginLogHint'),
    },
    {
      label: t('auth.security.currentIp'),
      value: currentSession?.lastIp || '-',
      hint: t('auth.security.currentSessionSummary'),
    },
    {
      label: t('auth.loginLog.status.success'),
      value: String(successCount),
      hint: t('auth.security.recentWindow'),
    },
  ];

  const sessionColumns = [
    {
      title: t('auth.session.current'),
      dataIndex: 'isCurrent',
      render: (_: unknown, record: AuthSession) => (
        record.isCurrent ? <Tag color="arcoblue">{t('auth.session.currentDevice')}</Tag> : <Tag>{t('auth.session.otherDevice')}</Tag>
      ),
    },
    {
      title: t('auth.session.ip'),
      dataIndex: 'lastIp',
      render: (value: string) => value || '-',
    },
    {
      title: t('auth.session.userAgent'),
      dataIndex: 'device',
      render: (_: unknown, record: AuthSession) => (
        <Typography.Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 320 }}>
          {formatClientSummary(record)}
        </Typography.Text>
      ),
    },
    {
      title: t('auth.session.lastActive'),
      dataIndex: 'lastRefreshAt',
      render: (value: string | undefined, record: AuthSession) => renderActivityTime(value || record.createdAt),
    },
    {
      title: t('auth.session.refreshExpiresAt'),
      dataIndex: 'refreshExpiresAt',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('system.profile.createdAt'),
      dataIndex: 'createdAt',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.action'),
      dataIndex: 'action',
      width: 188,
      render: (_: unknown, record: AuthSession) => (
        <Space size={4}>
          <Button type="text" icon={<IconEye />} onClick={() => setDetailSession(record)}>
            {t('common.detail')}
          </Button>
          <Popconfirm
            title={t('auth.session.revokeConfirm')}
            onOk={() => handleRevokeSession(record.sessionId)}
            disabled={record.isCurrent}
          >
            <Button
              type="text"
              status="danger"
              disabled={record.isCurrent}
              loading={revokingSessionId === record.sessionId}
            >
              {record.isCurrent ? t('auth.session.current') : t('auth.session.revoke')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const loginLogColumns = [
    {
      title: t('auth.loginLog.loginTime'),
      dataIndex: 'loginTime',
      render: (value: string) => renderActivityTime(value),
    },
    {
      title: t('auth.loginLog.ip'),
      dataIndex: 'ipaddr',
      render: (value: string) => value || '-',
    },
    {
      title: t('auth.loginLog.browser'),
      dataIndex: 'browser',
      render: (_: unknown, record: LoginLogRow) => renderClientInfo(record),
    },
    {
      title: t('auth.loginLog.status'),
      dataIndex: 'status',
      render: (value: number) => value === 1 ? <Tag color="green">{t('auth.loginLog.status.success')}</Tag> : <Tag color="red">{t('auth.loginLog.status.failed')}</Tag>,
    },
    {
      title: t('auth.loginLog.failureReason'),
      dataIndex: 'msg',
      ellipsis: true,
      render: (value: string) => translateLogMessage(value),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('auth.security.title')}
        subtitle={t('auth.security.subtitle')}
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {loadFailed && !loading && !overview ? (
          <Card className="page-panel">
            <PageError onRetry={() => { void loadSecurityContext(); }} />
          </Card>
        ) : null}

        <div className="auth-page-stat-grid">
          {statItems.map((item) => (
            <Card key={item.label} className="page-stat-panel auth-page-stat-card">
              <Typography.Text className="auth-page-stat-card__label">{item.label}</Typography.Text>
              <div className="auth-page-stat-card__value">{item.value}</div>
              <Typography.Text className="auth-page-stat-card__hint">{item.hint}</Typography.Text>
            </Card>
          ))}
        </div>

        <Card className="page-panel page-panel--soft auth-security-overview">
          {loading && !overview ? (
            <PageLoading />
          ) : (
            <div className="auth-security-overview__grid">
              <div className="auth-security-overview__main">
                <Descriptions
                  title={(
                    <Space>
                      <IconSafe />
                      <span>{t('auth.security.overview')}</span>
                    </Space>
                  )}
                  column={2}
                  data={[
                    { label: t('system.profile.username'), value: overview?.user?.username || userInfo?.username || '-' },
                    { label: t('system.profile.nickname'), value: overview?.user?.nickname || userInfo?.nickname || '-' },
                    { label: t('system.profile.email'), value: overview?.user?.email || '-' },
                    { label: t('system.profile.phone'), value: overview?.user?.phone || '-' },
                    { label: t('auth.security.activeSessionCount'), value: overview?.activeSessionCount ?? sessions.length },
                    { label: t('auth.security.lastLoginAt'), value: renderActivityTime(overview?.lastLoginAt) },
                    { label: t('auth.security.currentDevice'), value: formatClientSummary(currentSession) },
                    { label: t('auth.security.currentIp'), value: currentSession?.lastIp || '-' },
                    { label: t('auth.session.lastActive'), value: currentSession ? renderActivityTime(currentSession.lastRefreshAt || currentSession.createdAt) : '-' },
                  ]}
                />
              </div>
              <div className="auth-security-overview__side">
                <Space direction="vertical" size={14}>
                  <div className="auth-inline-note__copy">
                    <Typography.Text className="auth-inline-note__title">{t('auth.security.currentSessionSummary')}</Typography.Text>
                    <Typography.Text className="auth-inline-note__desc">{formatClientSummary(currentSession)}</Typography.Text>
                  </div>
                  <Tag color="arcoblue" icon={<IconClockCircle />}>{t('auth.security.recentWindow')}</Tag>
                  <div>
                    {currentSession ? renderActivityTime(currentSession.lastRefreshAt || currentSession.createdAt) : '-'}
                  </div>
                </Space>
              </div>
            </div>
          )}
        </Card>

        <Card className="page-panel" title={t('auth.security.password')} extra={<Tag>{t('auth.security.passwordTip')}</Tag>}>
          <Form form={passwordForm} layout="vertical">
            <Space direction="vertical" size={20} className="auth-section-stack">
              <FormSection title={t('system.profile.passwordTitle')} description={t('system.profile.passwordHint')}>
                <Row gutter={16} className="auth-form-grid">
                  <Col xs={24} md={12}>
                    <FormItem label={t('system.profile.oldPassword')} field="oldPassword" rules={[{ required: true, message: t('system.profile.oldPasswordRequired') }]}>
                      <Input.Password prefix={<IconLock />} />
                    </FormItem>
                  </Col>
                  <Col xs={24} md={12}>
                    <FormItem label={t('system.profile.newPassword')} field="newPassword" rules={[{ required: true, message: t('auth.passwordRequired') }, { minLength: 6, message: t('system.user.password.rule') }]}>
                      <Input.Password prefix={<IconLock />} />
                    </FormItem>
                  </Col>
                  <Col xs={24} md={12}>
                    <FormItem
                      label={t('system.profile.confirmPassword')}
                      field="confirmPassword"
                      rules={[
                        { required: true, message: t('system.profile.confirmPasswordRequired') },
                        {
                          validator: (value, callback) => {
                            const nextPassword = passwordForm.getFieldValue('newPassword');
                            if (value && nextPassword && value !== nextPassword) {
                              callback(t('system.profile.confirmPasswordMismatch'));
                              return;
                            }
                            callback();
                          },
                        },
                      ]}
                    >
                      <Input.Password prefix={<IconLock />} />
                    </FormItem>
                  </Col>
                </Row>
              </FormSection>
            </Space>
            <SubmitBar
              loading={savingPassword}
              onSubmit={() => { void handleChangePassword(); }}
              submitText={t('system.profile.savePassword')}
            />
          </Form>
        </Card>

        <Card className="page-panel" title={t('auth.security.sessions')} extra={<Tag color="arcoblue">{t('common.total', { count: sessions.length })}</Tag>}>
          <Space direction="vertical" size={16} className="auth-table-stack">
            <div className="auth-inline-note">
              <div className="auth-inline-note__copy">
                <span className="auth-inline-note__title">{t('auth.session.currentDevice')}</span>
                <span className="auth-inline-note__desc">{formatClientSummary(currentSession)}</span>
              </div>
              <Tag>{t('auth.security.sessionHint')}</Tag>
            </div>
            {sessions.length === 0 && !loadFailed ? (
              <PageEmpty description={t('auth.session.empty')} />
            ) : (
              <AppTable<AuthSession>
                rowKey="sessionId"
                columns={sessionColumns}
                data={sessions}
                loading={loading && Boolean(overview)}
                pagination={{ pageSize: 5, sizeCanChange: false }}
                scroll={{ x: 1100 }}
                emptyText={t('auth.session.empty')}
              />
            )}
          </Space>
        </Card>

        <Card className="page-panel" title={t('auth.security.loginLogs')} extra={<Tag color={failedCount > 0 ? 'orange' : 'green'}>{t('common.total', { count: loginLogs.length })}</Tag>}>
          <Space direction="vertical" size={16} className="auth-table-stack">
            <div className="auth-inline-note">
              <div className="auth-inline-note__copy">
                <span className="auth-inline-note__title">{t('auth.security.loginLogHint')}</span>
                <span className="auth-inline-note__desc">{t('auth.security.recentWindow')}</span>
              </div>
              <Space wrap>
                <Tag color="green">{t('auth.loginLog.status.success')}: {successCount}</Tag>
                <Tag color="red">{t('auth.loginLog.status.failed')}: {failedCount}</Tag>
              </Space>
            </div>
            {loginLogs.length === 0 && !loadFailed ? (
              <PageEmpty description={t('auth.loginLog.empty')} />
            ) : (
              <AppTable<LoginLogRow>
                rowKey="id"
                columns={loginLogColumns}
                data={loginLogs}
                loading={loading && Boolean(overview)}
                pagination={false}
                emptyText={t('auth.loginLog.empty')}
              />
            )}
          </Space>
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

export default SecurityCenter;
