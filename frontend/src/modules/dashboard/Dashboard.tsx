import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Grid, Progress, Space, Statistic, Tag, Typography } from '@arco-design/web-react';
import { IconArrowRight, IconClockCircle, IconExclamationCircle, IconSafe } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { isNetworkRequestError, isServerRequestError, isTimeoutRequestError } from '../../api/request';
import { AppTable, DateTimeMeta, PageContainer, PageEmpty, PageError, PageHeader, PageLoading, PageNetworkError, PageServerError } from '../../components';
import { renderMenuIcon } from '../../core/menu/icon';
import { resolveRouteWarmData } from '../../core/router/prefetch';
import { usePermission } from '../../hooks/usePermission';
import type { MenuNode } from '../system/menu/api';
import { useMenuStore } from '../../store/useMenuStore';
import { getDashboardSummary, type DashboardRecentLogin, type DashboardSummary } from './api';
import './dashboard.css';

const Row = Grid.Row;
const Col = Grid.Col;

function findMenuNodeByPath(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const item of nodes) {
    if (item.path === path || item.activeMenu === path) {
      return item;
    }
    if (item.children?.length) {
      const child = findMenuNodeByPath(item.children, path);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menuTree } = useMenuStore();
  const { hasPerm, isAdmin } = usePermission();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<unknown>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resolveRouteWarmData('/dashboard', 'summary', () => getDashboardSummary());
      setSummary(data);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  const translateLogMessage = useCallback(
    (value?: string | null) => {
      if (!value) {
        return '-';
      }
      return t(value, { defaultValue: value });
    },
    [t],
  );

  const successRate = useMemo(() => {
    if (!summary) {
      return 0;
    }
    const total = summary.loginSuccessCount + summary.loginFailureCount;
    if (total === 0) {
      return 100;
    }
    return Math.round((summary.loginSuccessCount / total) * 100);
  }, [summary]);

  const enabledRate = useMemo(() => {
    if (!summary || summary.totalUsers === 0) {
      return 0;
    }
    return Math.round((summary.enabledUsers / summary.totalUsers) * 100);
  }, [summary]);

  const stats = useMemo(
    () => ([
      {
        key: 'users',
        title: t('dashboard.users'),
        value: summary?.totalUsers ?? 0,
        extra: <Tag color="green">{t('dashboard.enabledUsers')}: {summary?.enabledUsers ?? 0}</Tag>,
        hint: t('dashboard.metric.usersHint'),
      },
      {
        key: 'menus',
        title: t('dashboard.menus'),
        value: summary?.visibleMenuCount ?? 0,
        extra: <Tag>{t('dashboard.platformOverview')}</Tag>,
        hint: t('dashboard.metric.menusHint'),
      },
      {
        key: 'sessions',
        title: t('dashboard.sessions'),
        value: summary?.activeSessionCount ?? 0,
        extra: <Tag color="arcoblue">{t('dashboard.securityOverview')}</Tag>,
        hint: t('dashboard.metric.sessionsHint'),
      },
      {
        key: 'operations',
        title: t('dashboard.todayOperations'),
        value: summary?.todayOperationCount ?? 0,
        extra: <Tag color="purple"><IconClockCircle />{t('dashboard.platformActivity')}</Tag>,
        hint: t('dashboard.metric.todayOpsHint'),
      },
    ]),
    [summary, t],
  );

  const quickActions = useMemo(() => {
    const items = [
      {
        key: 'user',
        path: '/system/user',
        title: t('system.menu.user'),
        description: t('dashboard.quickAction.user'),
        icon: 'user',
        permission: 'system:user:list',
      },
      {
        key: 'role',
        path: '/system/role',
        title: t('system.menu.role'),
        description: t('dashboard.quickAction.role'),
        icon: 'safe',
        permission: 'system:role:list',
      },
      {
        key: 'menu',
        path: '/system/menu',
        title: t('system.menu.menu'),
        description: t('dashboard.quickAction.menu'),
        icon: 'menu',
        permission: 'system:menu:list',
      },
      {
        key: 'dict',
        path: '/system/dict',
        title: t('system.menu.dict'),
        description: t('dashboard.quickAction.dict'),
        icon: 'storage',
        permission: 'system:dict:list',
      },
      {
        key: 'setting',
        path: '/system/setting',
        title: t('system.menu.setting'),
        description: t('dashboard.quickAction.setting'),
        icon: 'settings',
        permission: 'system:setting:list',
      },
      {
        key: 'security',
        path: '/auth/security',
        title: t('auth.security.title'),
        description: t('dashboard.quickAction.security'),
        icon: 'safe',
      },
    ];

    return items.filter((item) => {
      const hasAccess = !item.permission || isAdmin || hasPerm(item.permission);
      if (!hasAccess) {
        return false;
      }
      if (item.path === '/auth/security') {
        return true;
      }
      return Boolean(findMenuNodeByPath(menuTree, item.path));
    });
  }, [hasPerm, isAdmin, menuTree, t]);

  const domainCards = useMemo(
    () => ([
      {
        key: 'access',
        title: t('dashboard.domain.access'),
        description: t('dashboard.domain.accessDesc'),
        summary: t('dashboard.usersAndRoles', {
          users: summary?.totalUsers ?? 0,
          roles: summary?.totalRoles ?? 0,
        }),
        path: '/system/user',
        permission: 'system:user:list',
      },
      {
        key: 'org',
        title: t('dashboard.domain.org'),
        description: t('dashboard.domain.orgDesc'),
        summary: t('dashboard.deptsAndPosts', {
          depts: summary?.totalDepts ?? 0,
          posts: summary?.totalPosts ?? 0,
        }),
        path: '/system/dept',
        permission: 'system:dept:list',
      },
      {
        key: 'config',
        title: t('dashboard.domain.config'),
        description: t('dashboard.domain.configDesc'),
        summary: t('dashboard.dictAndSettings', {
          dicts: summary?.totalDictTypes ?? 0,
          settings: summary?.totalSettings ?? 0,
        }),
        path: '/system/setting',
        permission: 'system:setting:list',
      },
    ].filter((item) => {
      const hasAccess = !item.permission || isAdmin || hasPerm(item.permission);
      if (!hasAccess) {
        return false;
      }
      return Boolean(findMenuNodeByPath(menuTree, item.path));
    })),
    [hasPerm, isAdmin, menuTree, summary, t],
  );

  const renderActivityTime = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return <DateTimeMeta value={value} />;
  };

  const loginColumns = [
    {
      title: t('auth.loginLog.loginTime'),
      dataIndex: 'loginTime',
      width: 176,
      render: (value: string) => renderActivityTime(value),
    },
    {
      title: t('auth.username'),
      dataIndex: 'username',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: t('auth.loginLog.ip'),
      dataIndex: 'ipaddr',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: t('auth.loginLog.browser'),
      dataIndex: 'browser',
      width: 220,
      ellipsis: true,
      render: (value: string, record: DashboardRecentLogin) => `${value || '-'} / ${record.os || '-'}`,
    },
    {
      title: t('auth.loginLog.status'),
      dataIndex: 'status',
      width: 96,
      render: (value: number) => value === 1 ? <Tag color="green">{t('auth.loginLog.status.success')}</Tag> : <Tag color="red">{t('auth.loginLog.status.failed')}</Tag>,
    },
    {
      title: t('auth.loginLog.failureReason'),
      dataIndex: 'msg',
      width: 280,
      ellipsis: true,
      render: (value: string) => translateLogMessage(value),
    },
  ];

  const attentionItems = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        key: 'success',
        tone: successRate >= 90 ? 'success' : 'warning',
        icon: <IconSafe />,
        label: t('dashboard.securitySuccessRate', { days: summary.periodDays }),
        value: `${successRate}%`,
        desc: t('dashboard.attention.successRateDesc'),
      },
      {
        key: 'failed',
        tone: summary.loginFailureCount > 0 ? 'danger' : 'neutral',
        icon: <IconExclamationCircle />,
        label: t('dashboard.loginFailureTrend', { days: summary.periodDays }),
        value: summary.loginFailureCount,
        desc: t('dashboard.attention.failedLoginDesc'),
      },
      {
        key: 'sessions',
        tone: 'neutral',
        icon: <IconClockCircle />,
        label: t('dashboard.sessions'),
        value: summary.activeSessionCount,
        desc: t('dashboard.metric.sessionsHint'),
      },
      {
        key: 'org-tasks',
        tone: summary.orgGovernanceTaskCount > 0 ? 'warning' : 'success',
        icon: <IconExclamationCircle />,
        label: t('dashboard.orgGovernanceTasks'),
        value: summary.orgGovernanceTaskCount,
        desc: t('dashboard.orgGovernanceTasksDesc'),
      },
      {
        key: 'operations',
        tone: 'neutral',
        icon: <IconClockCircle />,
        label: t('dashboard.todayOperations'),
        value: summary.todayOperationCount,
        desc: t('dashboard.metric.todayOpsHint'),
      },
    ];
  }, [successRate, summary, t]);

  const primaryAttentionItems = useMemo(
    () => attentionItems.slice(0, 4),
    [attentionItems],
  );

  const renderErrorState = () => {
    if (isNetworkRequestError(error)) {
      return <PageNetworkError timeout={isTimeoutRequestError(error)} onRetry={() => { void loadSummary(); }} />;
    }
    if (isServerRequestError(error)) {
      return <PageServerError onRetry={() => { void loadSummary(); }} />;
    }
    return <PageError onRetry={() => { void loadSummary(); }} />;
  };

  return (
    <PageContainer className="dashboard-page">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        extra={<Tag color="arcoblue">{t('app.workspace')}</Tag>}
      />
      {loading && !summary ? (
        <Card className="page-panel dashboard-panel-card">
          <PageLoading />
        </Card>
      ) : null}
      {error && !summary ? (
        <Card className="page-panel dashboard-panel-card">
          {renderErrorState()}
        </Card>
      ) : null}
      {summary ? (
        <Space direction="vertical" size={20} className="dashboard-grid">
          <Card className="page-panel dashboard-panel-card dashboard-hero-card">
            <div className="dashboard-hero-card__top">
              <div className="dashboard-hero-card__copy">
                <span className="dashboard-hero-card__eyebrow">{t('dashboard.statusStrip')}</span>
                <Typography.Title heading={4} className="dashboard-hero-card__title">
                  {t('dashboard.attentionPanel')}
                </Typography.Title>
                <Typography.Paragraph className="dashboard-hero-card__desc">
                  {t('dashboard.subtitle')}
                </Typography.Paragraph>
              </div>
              <div className="dashboard-hero-card__summary">
                <div className="dashboard-hero-card__summary-item">
                  <span className="dashboard-hero-card__summary-label">{t('dashboard.enabledUserRate')}</span>
                  <span className="dashboard-hero-card__summary-value">{enabledRate}%</span>
                </div>
                <div className="dashboard-hero-card__summary-item">
                  <span className="dashboard-hero-card__summary-label">{t('dashboard.securitySuccessRate', { days: summary.periodDays })}</span>
                  <span className="dashboard-hero-card__summary-value">{successRate}%</span>
                </div>
              </div>
            </div>
            <Row gutter={[12, 12]}>
              {stats.map((item) => (
                <Col xs={24} sm={12} xl={6} key={item.title}>
                  <div className={`dashboard-stat-card dashboard-stat-card--${item.key}`}>
                    <div className="dashboard-stat-card__title">
                      <Typography.Text>{item.title}</Typography.Text>
                      {item.extra}
                    </div>
                    <Statistic className="dashboard-stat-card__value" value={item.value} />
                    <span className="dashboard-stat-card__hint">{item.hint}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Card className="page-panel dashboard-panel-card dashboard-panel-card--attention" title={t('dashboard.attentionPanel')}>
                <div className="dashboard-focus-stack">
                  {primaryAttentionItems.map((item) => (
                    <div key={item.key} className={`dashboard-focus-item dashboard-focus-item--${item.tone}`}>
                      <span className="dashboard-focus-item__icon">{item.icon}</span>
                      <span className="dashboard-focus-item__copy">
                        <span className="dashboard-focus-item__label">{item.label}</span>
                        <span className="dashboard-focus-item__value">{item.value}</span>
                      </span>
                      <span className="dashboard-focus-item__desc">{item.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="dashboard-panel-card__metric dashboard-panel-card__metric--footer">
                  <span className="dashboard-panel-card__meta">{t('dashboard.lastSuccessfulLogin')}</span>
                  <div>{summary.lastSuccessfulLoginAt ? renderActivityTime(summary.lastSuccessfulLoginAt) : t('dashboard.lastSuccessfulLoginEmpty')}</div>
                </div>
                <Progress percent={successRate} showText={false} strokeWidth={6} />
              </Card>
            </Col>
            <Col xs={24} lg={9}>
              <Card className="page-panel dashboard-panel-card dashboard-panel-card--actions" title={t('dashboard.primaryActions')}>
                {quickActions.length > 0 ? (
                  <div className="dashboard-quick-actions">
                    {quickActions.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="dashboard-quick-action"
                        onClick={() => navigate(item.path)}
                      >
                        <span className="dashboard-quick-action__icon">{renderMenuIcon(item.icon)}</span>
                        <span className="dashboard-quick-action__main">
                          <span>
                            <span className="dashboard-quick-action__title">{item.title}</span>
                            <span className="dashboard-quick-action__desc">{item.description}</span>
                          </span>
                          <IconArrowRight className="dashboard-quick-action__arrow" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <PageEmpty description={t('dashboard.emptyQuickActions')} />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card className="page-panel dashboard-panel-card dashboard-panel-card--overview" title={t('dashboard.platformOverview')}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className="dashboard-panel-card__metric">
                    <span className="dashboard-panel-card__meta">{t('dashboard.enabledUserRate')}</span>
                    <span className="dashboard-panel-card__value">{enabledRate}%</span>
                    <Progress percent={enabledRate} showText={false} strokeWidth={6} />
                  </div>
                  <div className="dashboard-panel-card__metric">
                    <span className="dashboard-panel-card__meta">{t('dashboard.visibleMenuHint')}</span>
                    <span>{t('dashboard.visibleMenuValue', { count: summary.visibleMenuCount })}</span>
                  </div>
                  <div className="dashboard-panel-card__metric">
                    <span className="dashboard-panel-card__meta">{t('dashboard.platformActivity')}</span>
                    <span>{t('dashboard.platformActivityDesc', { count: summary.todayOperationCount })}</span>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card className="page-panel dashboard-panel-card" title={t('dashboard.todoCenter')}>
                {summary.orgGovernanceTasks?.length ? (
                  <div className="dashboard-task-grid">
                    {summary.orgGovernanceTasks.map((item) => (
                      <div key={item.taskKey} className="dashboard-task-card">
                        <span className="dashboard-task-card__icon"><IconExclamationCircle /></span>
                        <div className="dashboard-task-card__body">
                          <span className="dashboard-task-card__title">
                            {item.issueLabel}
                            <Tag size="small" style={{ marginLeft: 8 }}>{item.scopeLabel}</Tag>
                          </span>
                          <span className="dashboard-task-card__desc">{item.resourceLabel}</span>
                          <span className="dashboard-task-card__desc">
                            {item.actionLabel}
                            {item.relatedUserCount > 0 ? ` · ${t('dashboard.relatedUsers', { count: item.relatedUserCount })}` : ''}
                          </span>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<IconArrowRight />}
                          onClick={() => navigate(item.routePath, { state: { deptId: item.routeStateDeptId, taskKey: item.taskKey } })}
                        >
                          {t('dashboard.openTask')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PageEmpty description={t('dashboard.todoEmpty')} />
                )}
              </Card>
            </Col>
          </Row>

          <Card className="page-panel dashboard-panel-card" title={t('dashboard.domainOverview')}>
            <div className="dashboard-domain-grid">
              {domainCards.map((item) => (
                <div key={item.key} className={`dashboard-domain-card dashboard-domain-card--${item.key}`}>
                  <div className="dashboard-domain-card__head">
                    <span className="dashboard-domain-card__title">{item.title}</span>
                    <Button type="text" size="small" icon={<IconArrowRight />} onClick={() => navigate(item.path)}>
                      {t('dashboard.openModule')}
                    </Button>
                  </div>
                  <span className="dashboard-domain-card__summary">{item.summary}</span>
                  <span className="dashboard-domain-card__desc">{item.description}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="page-panel dashboard-panel-card dashboard-login-table"
            title={t('dashboard.recentLogins')}
            extra={(
              <Button type="text" size="small" icon={<IconArrowRight />} onClick={() => navigate('/system/login-log')}>
                {t('dashboard.viewAllActivity')}
              </Button>
            )}
          >
            <AppTable<DashboardRecentLogin>
              rowKey="id"
              loading={loading}
              columns={loginColumns}
              data={summary.recentLogins}
              pagination={false}
              scroll={{ x: 1040 }}
              emptyText={t('dashboard.recentLoginsEmpty')}
            />
          </Card>
        </Space>
      ) : null}
    </PageContainer>
  );
};

export default DashboardPage;
